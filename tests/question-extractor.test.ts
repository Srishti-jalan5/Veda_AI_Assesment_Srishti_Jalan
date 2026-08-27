import { describe, it, expect } from "vitest";
import {
  BoundingBoxSchema,
  validateExtractedQuestions,
  extractQuestionsFromPages,
  normalizeSubQuestionHierarchy,
  QuestionExtractionError,
  ExtractedQuestionPaper,
} from "../src/lib/ai/question-extractor";

describe("Question Extractor Pipeline — Unit Tests", () => {
  const validMockPayload: ExtractedQuestionPaper = {
    assessment_title: "Standard Assessment Unit Test",
    total_marks: 25,
    instructions: ["Attempt all questions.", "Each question carries marks indicated in brackets."],
    questions: [
      {
        id: "q_1",
        question_number: "1",
        parent_question_number: null,
        text: "Define kinetic energy and state its standard SI unit.",
        max_marks: 2,
        page_number: 1,
        bounding_box: { xmin: 0.05, ymin: 0.08, xmax: 0.95, ymax: 0.16 },
        confidence: 0.98,
      },
      {
        id: "q_2",
        question_number: "2",
        parent_question_number: null,
        text: "State Newton's Second Law of Motion and derive the formula F = ma.",
        max_marks: 2,
        page_number: 1,
        bounding_box: { xmin: 0.05, ymin: 0.18, xmax: 0.95, ymax: 0.26 },
        confidence: 0.99,
      },
      {
        id: "q_11a",
        question_number: "11(a)",
        parent_question_number: "11",
        text: "Analyze the circuit diagram shown and calculate the total equivalent resistance.",
        max_marks: 2,
        page_number: 2,
        bounding_box: { xmin: 0.05, ymin: 0.65, xmax: 0.95, ymax: 0.76 },
        confidence: 0.96,
      },
      {
        id: "q_11b",
        question_number: "11(b)",
        parent_question_number: "11",
        text: "Calculate the total current flowing through the circuit given a 12V power supply.",
        max_marks: 3,
        page_number: 2,
        bounding_box: { xmin: 0.05, ymin: 0.78, xmax: 0.95, ymax: 0.88 },
        confidence: 0.95,
      },
    ],
    metadata: {
      total_questions: 4,
      page_count: 2,
      extraction_timestamp: "2026-08-27T00:00:00.000Z",
    },
  };

  describe("1. Strict Schema & Field Validation", () => {
    it("should successfully validate a fully conformant question paper payload", () => {
      const parsed = validateExtractedQuestions(validMockPayload);
      expect(parsed).toBeDefined();
      expect(parsed.assessment_title).toBe("Standard Assessment Unit Test");
      expect(parsed.questions).toHaveLength(4);
      expect(parsed.questions[0].id).toBe("q_1");
      expect(parsed.questions[0].max_marks).toBe(2);
    });

    it("should validate independent sub-part items (11(a) and 11(b)) with parent linkage", () => {
      const parsed = validateExtractedQuestions(validMockPayload);
      const q11a = parsed.questions.find((q) => q.question_number === "11(a)");
      const q11b = parsed.questions.find((q) => q.question_number === "11(b)");

      expect(q11a).toBeDefined();
      expect(q11a?.parent_question_number).toBe("11");
      expect(q11a?.max_marks).toBe(2);

      expect(q11b).toBeDefined();
      expect(q11b?.parent_question_number).toBe("11");
      expect(q11b?.max_marks).toBe(3);
    });

    it("should allow nullable max_marks and assessment_title", () => {
      const payloadWithNulls = {
        ...validMockPayload,
        assessment_title: null,
        questions: [
          {
            ...validMockPayload.questions[0],
            max_marks: null,
          },
        ],
        metadata: {
          total_questions: 1,
          page_count: 1,
          extraction_timestamp: new Date().toISOString(),
        },
      };

      const parsed = validateExtractedQuestions(payloadWithNulls);
      expect(parsed.assessment_title).toBeNull();
      expect(parsed.questions[0].max_marks).toBeNull();
    });
  });

  describe("2. Bounding Box & Coordinate Constraints", () => {
    it("should accept valid normalized bounding box coordinates (0.0 to 1.0)", () => {
      const box = { xmin: 0.1, ymin: 0.2, xmax: 0.8, ymax: 0.9 };
      const parsedBox = BoundingBoxSchema.parse(box);
      expect(parsedBox).toEqual(box);
    });

    it("should reject bounding boxes with negative coordinates or values > 1.0", () => {
      const invalidBoxNegative = { xmin: -0.1, ymin: 0.2, xmax: 0.8, ymax: 0.9 };
      const invalidBoxOverflow = { xmin: 0.1, ymin: 0.2, xmax: 1.5, ymax: 0.9 };

      expect(() => BoundingBoxSchema.parse(invalidBoxNegative)).toThrow();
      expect(() => BoundingBoxSchema.parse(invalidBoxOverflow)).toThrow();
    });

    it("should reject bounding boxes where xmax < xmin or ymax < ymin", () => {
      const invertedBox = { xmin: 0.8, ymin: 0.2, xmax: 0.2, ymax: 0.9 };
      expect(() => BoundingBoxSchema.parse(invertedBox)).toThrow();
    });
  });

  describe("3. Invalid Payload & Error Handling", () => {
    it("should throw QuestionExtractionError on missing required fields (e.g. missing text)", () => {
      const brokenPayload = {
        ...validMockPayload,
        questions: [
          {
            id: "q_invalid",
            question_number: "1",
            parent_question_number: null,
            // text missing
            max_marks: 2,
            page_number: 1,
            bounding_box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 },
            confidence: 0.95,
          },
        ],
      };

      expect(() => validateExtractedQuestions(brokenPayload)).toThrowError(
        QuestionExtractionError
      );
    });

    it("should throw QuestionExtractionError on invalid confidence score (> 1.0)", () => {
      const invalidConfidencePayload = {
        ...validMockPayload,
        questions: [
          {
            ...validMockPayload.questions[0],
            confidence: 1.5, // Invalid > 1.0
          },
        ],
      };

      expect(() => validateExtractedQuestions(invalidConfidencePayload)).toThrowError(
        QuestionExtractionError
      );
    });

    it("should reject extraction when no input pages are provided", async () => {
      await expect(extractQuestionsFromPages([])).rejects.toThrowError(
        QuestionExtractionError
      );
    });
  });

  describe("4. Hierarchy Normalization & End-to-End Extraction", () => {
    it("should auto-detect parent question numbers from string patterns", () => {
      const rawList = [
        {
          question_number: "11(a)",
          parent_question_number: null,
          text: "Part A text",
          max_marks: 2,
          page_number: 1,
          bounding_box: { xmin: 0, ymin: 0, xmax: 1, ymax: 1 },
          confidence: 0.9,
        },
        {
          question_number: "Q12.b",
          parent_question_number: null,
          text: "Part B text",
          max_marks: 3,
          page_number: 1,
          bounding_box: { xmin: 0, ymin: 0, xmax: 1, ymax: 1 },
          confidence: 0.9,
        },
      ];

      const normalized = normalizeSubQuestionHierarchy(rawList);
      expect(normalized[0].parent_question_number).toBe("11");
      expect(normalized[1].parent_question_number).toBe("12");
      expect(normalized[0].id).toContain("q_11_a_");
    });

    it("should successfully extract questions using mock options", async () => {
      const pages = [
        { pageNumber: 1, dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
        { pageNumber: 2, dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
      ];

      const result = await extractQuestionsFromPages(pages, {
        mockPayload: validMockPayload,
      });

      expect(result.questions).toHaveLength(4);
      expect(result.metadata.total_questions).toBe(4);
      expect(result.metadata.page_count).toBe(2);
    });

    it("should throw an explicit error when API key is missing", async () => {
      const pages = [
        { pageNumber: 1, dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
      ];

      await expect(
        extractQuestionsFromPages(pages, { apiKey: "" })
      ).rejects.toThrow(/Question Extraction Failed/);
    });
  });
});
