import { describe, it, expect } from "vitest";
import {
  AnswerBoundingBoxSchema,
  validateExtractedAnswers,
  extractAnswersFromPages,
  AnswerExtractionError,
  ExtractedAnswerSheet,
} from "../src/lib/ai/answer-extractor";

describe("Handwritten Answer Extractor Pipeline — Unit Tests", () => {
  const validMockAnswerPayload: ExtractedAnswerSheet = {
    student_identifier: "Student_Roll_104",
    total_pages_scanned: 2,
    answers: [
      // Out-of-order answer: Q3 answered first on Page 1
      {
        id: "ans_1",
        detected_question_label: "Ans 3",
        handwritten_text: "Kinetic energy equals half mass times velocity squared: KE = 1/2 * m * v^2.",
        page_number: 1,
        bounding_box: { xmin: 0.05, ymin: 0.1, xmax: 0.95, ymax: 0.45 },
        confidence: 0.97,
        diagram_detected: false,
        is_scratch_work: false,
      },
      // Q1 answered second on Page 1
      {
        id: "ans_2",
        detected_question_label: "1",
        handwritten_text: "Newton's second law defines force as the product of mass and acceleration: F = ma.",
        page_number: 1,
        bounding_box: { xmin: 0.05, ymin: 0.48, xmax: 0.95, ymax: 0.7 },
        confidence: 0.99,
        diagram_detected: false,
        is_scratch_work: false,
      },
      // Unlabelled rough scratch calculation block
      {
        id: "ans_3_scratch",
        detected_question_label: null,
        handwritten_text: "Rough: 12 * 0.35 = 4.2 J",
        page_number: 1,
        bounding_box: { xmin: 0.5, ymin: 0.75, xmax: 0.95, ymax: 0.95 },
        confidence: 0.92,
        diagram_detected: false,
        is_scratch_work: true,
      },
      // Q2 answered on Page 2 with labelled diagram
      {
        id: "ans_4",
        detected_question_label: "Q.2",
        handwritten_text: "In series circuits, current remains uniform across all resistors while voltage drops add up.",
        page_number: 2,
        bounding_box: { xmin: 0.05, ymin: 0.08, xmax: 0.95, ymax: 0.6 },
        confidence: 0.98,
        diagram_detected: true,
        is_scratch_work: false,
      },
    ],
    metadata: {
      total_blocks_detected: 4,
      page_count: 2,
      extraction_timestamp: "2026-08-27T00:00:00.000Z",
    },
  };

  describe("1. Strict Schema & Field Conformance", () => {
    it("should successfully validate a conformant answer sheet payload", () => {
      const parsed = validateExtractedAnswers(validMockAnswerPayload);
      expect(parsed).toBeDefined();
      expect(parsed.student_identifier).toBe("Student_Roll_104");
      expect(parsed.answers).toHaveLength(4);
      expect(parsed.answers[0].detected_question_label).toBe("Ans 3");
    });

    it("should allow answers written out of numerical order", () => {
      const parsed = validateExtractedAnswers(validMockAnswerPayload);
      // First item on Page 1 is Q3, second item is Q1, fourth item on Page 2 is Q2
      expect(parsed.answers[0].detected_question_label).toBe("Ans 3");
      expect(parsed.answers[1].detected_question_label).toBe("1");
      expect(parsed.answers[3].detected_question_label).toBe("Q.2");
    });

    it("should accurately capture unlabelled blocks and scratch work flags", () => {
      const parsed = validateExtractedAnswers(validMockAnswerPayload);
      const scratchBlock = parsed.answers.find((a) => a.is_scratch_work === true);

      expect(scratchBlock).toBeDefined();
      expect(scratchBlock?.detected_question_label).toBeNull();
      expect(scratchBlock?.handwritten_text).toContain("Rough");
    });

    it("should correctly identify diagram_detected flag", () => {
      const parsed = validateExtractedAnswers(validMockAnswerPayload);
      const diagramBlock = parsed.answers.find((a) => a.diagram_detected === true);

      expect(diagramBlock).toBeDefined();
      expect(diagramBlock?.detected_question_label).toBe("Q.2");
    });
  });

  describe("2. Bounding Box & Coordinate Validation", () => {
    it("should accept valid normalized bounding box coordinates", () => {
      const box = { xmin: 0.05, ymin: 0.1, xmax: 0.95, ymax: 0.85 };
      const parsed = AnswerBoundingBoxSchema.parse(box);
      expect(parsed).toEqual(box);
    });

    it("should reject bounding boxes with coordinates outside [0.0, 1.0]", () => {
      const outOfBoundsBox = { xmin: -0.05, ymin: 0.1, xmax: 1.2, ymax: 0.85 };
      expect(() => AnswerBoundingBoxSchema.parse(outOfBoundsBox)).toThrow();
    });

    it("should reject bounding boxes where xmax < xmin or ymax < ymin", () => {
      const invertedBox = { xmin: 0.9, ymin: 0.8, xmax: 0.1, ymax: 0.2 };
      expect(() => AnswerBoundingBoxSchema.parse(invertedBox)).toThrow();
    });
  });

  describe("3. Error Handling & Ingestion Pipeline", () => {
    it("should throw AnswerExtractionError on missing transcribed text", () => {
      const invalidPayload = {
        ...validMockAnswerPayload,
        answers: [
          {
            id: "ans_broken",
            detected_question_label: "Q1",
            // missing handwritten_text
            page_number: 1,
            bounding_box: { xmin: 0, ymin: 0, xmax: 1, ymax: 1 },
            confidence: 0.9,
          },
        ],
      };

      expect(() => validateExtractedAnswers(invalidPayload)).toThrowError(
        AnswerExtractionError
      );
    });

    it("should reject extraction when no input pages are provided", async () => {
      await expect(extractAnswersFromPages([])).rejects.toThrowError(
        AnswerExtractionError
      );
    });

    it("should successfully extract answers from mock input pages", async () => {
      const pages = [
        { pageNumber: 1, dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
        { pageNumber: 2, dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
      ];

      const result = await extractAnswersFromPages(pages, {
        mockPayload: validMockAnswerPayload,
      });

      expect(result.answers).toHaveLength(4);
      expect(result.metadata.total_blocks_detected).toBe(4);
      expect(result.metadata.page_count).toBe(2);
    });

    it("should throw an explicit error when API key is missing", async () => {
      const pages = [
        { pageNumber: 1, dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
      ];

      await expect(
        extractAnswersFromPages(pages, { apiKey: "" })
      ).rejects.toThrow(/Answer Extraction Failed/);
    });
  });
});
