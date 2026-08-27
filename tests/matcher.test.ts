import { describe, it, expect } from "vitest";
import {
  mapQuestionsToAnswers,
  normalizeLabel,
  computeLabelMatchScore,
  computeSequentialScore,
} from "../src/lib/ai/matcher";
import { ExtractedQuestionItem } from "../src/lib/ai/question-extractor";
import { HandwrittenAnswerBlock } from "../src/lib/ai/answer-extractor";

describe("Hybrid Answer Matcher Engine (/lib/ai/matcher.ts)", () => {
  // Test Questions
  const testQuestions: ExtractedQuestionItem[] = [
    {
      id: "q-1",
      question_number: "1",
      parent_question_number: null,
      text: "Define velocity and state how it differs from speed in mechanics.",
      max_marks: 2,
      page_number: 1,
      bounding_box: { xmin: 0.05, ymin: 0.1, xmax: 0.95, ymax: 0.2 },
      confidence: 0.98,
    },
    {
      id: "q-2",
      question_number: "2",
      parent_question_number: null,
      text: "State the law of conservation of momentum and describe its relevance in collisions.",
      max_marks: 2,
      page_number: 1,
      bounding_box: { xmin: 0.05, ymin: 0.22, xmax: 0.95, ymax: 0.35 },
      confidence: 0.97,
    },
    {
      id: "q-11a",
      question_number: "11(a)",
      parent_question_number: "11",
      text: "State Ohm's law and derive the mathematical expression relating voltage, current, and resistance.",
      max_marks: 3,
      page_number: 2,
      bounding_box: { xmin: 0.05, ymin: 0.1, xmax: 0.95, ymax: 0.3 },
      confidence: 0.99,
    },
    {
      id: "q-12",
      question_number: "12",
      parent_question_number: null,
      text: "Explain the process of nuclear fission and give one industrial application in power generation.",
      max_marks: 5,
      page_number: 2,
      bounding_box: { xmin: 0.05, ymin: 0.4, xmax: 0.95, ymax: 0.6 },
      confidence: 0.95,
    },
  ];

  // Test Student Answer Blocks
  const testAnswers: HandwrittenAnswerBlock[] = [
    {
      id: "ans-1",
      detected_question_label: "Q. 1",
      handwritten_text: "Velocity is defined as the vector rate of change of displacement with direction, unlike speed which is a scalar.",
      page_number: 1,
      bounding_box: { xmin: 0.05, ymin: 0.08, xmax: 0.9, ymax: 0.25 },
      confidence: 0.95,
      is_scratch_work: false,
      has_diagram: false,
    },
    {
      id: "ans-2",
      detected_question_label: null, // Unlabelled answer block
      handwritten_text: "State the law of conservation of momentum and describe its relevance in collisions: total momentum is always conserved.",
      page_number: 1,
      bounding_box: { xmin: 0.05, ymin: 0.3, xmax: 0.9, ymax: 0.55 },
      confidence: 0.92,
      is_scratch_work: false,
      has_diagram: false,
    },
    {
      id: "ans-3a",
      detected_question_label: "11 a",
      handwritten_text: "Ohm's law states that current through a conductor is directly proportional to the potential difference: V = I * R.",
      page_number: 2,
      bounding_box: { xmin: 0.05, ymin: 0.08, xmax: 0.9, ymax: 0.3 },
      confidence: 0.98,
      is_scratch_work: false,
      has_diagram: false,
    },
    {
      id: "ans-3b",
      detected_question_label: null, // Continuation multi-block answer
      handwritten_text: "Where V is voltage in volts, I is current in amperes, and R is electrical resistance in ohms.",
      page_number: 2,
      bounding_box: { xmin: 0.05, ymin: 0.32, xmax: 0.9, ymax: 0.48 },
      confidence: 0.91,
      is_scratch_work: false,
      has_diagram: false,
    },
    {
      id: "ans-scratch",
      detected_question_label: null,
      handwritten_text: "Rough: 235 + 1 = 236 -> 141 + 92 + 3n",
      page_number: 2,
      bounding_box: { xmin: 0.6, ymin: 0.8, xmax: 0.95, ymax: 0.95 },
      confidence: 0.88,
      is_scratch_work: true,
      has_diagram: false,
    },
  ];

  describe("1. Label Normalization and Scoring", () => {
    it("normalizes diverse label formats correctly", () => {
      expect(normalizeLabel("Q. 11 (a)")).toBe("11a");
      expect(normalizeLabel("Ans 3")).toBe("3");
      expect(normalizeLabel("Section B - Q2")).toBe("2");
      expect(normalizeLabel("Question 11a")).toBe("11a");
      expect(normalizeLabel("11 a")).toBe("11a");
      expect(normalizeLabel(null)).toBe("");
    });

    it("gives 1.0 score for exact normalized matches", () => {
      const { score, isExplicitMismatch } = computeLabelMatchScore("11(a)", "11", "11 a");
      expect(score).toBe(1.0);
      expect(isExplicitMismatch).toBe(false);
    });

    it("gives partial score for parent question match", () => {
      const { score, isExplicitMismatch } = computeLabelMatchScore("11(a)", "11", "11");
      expect(score).toBe(0.75);
      expect(isExplicitMismatch).toBe(false);
    });

    it("detects explicit label mismatch between different question numbers", () => {
      const { score, isExplicitMismatch } = computeLabelMatchScore("1", null, "Q. 4");
      expect(score).toBe(0.0);
      expect(isExplicitMismatch).toBe(true);
    });
  });

  describe("2. Sequential Continuity Scoring", () => {
    it("awards 1.0 for downward progression on the same page", () => {
      const block: HandwrittenAnswerBlock = {
        id: "ans-test",
        detected_question_label: null,
        handwritten_text: "test text",
        page_number: 1,
        bounding_box: { xmin: 0.1, ymin: 0.4, xmax: 0.9, ymax: 0.6 },
        confidence: 0.9,
        is_scratch_work: false,
        has_diagram: false,
      };

      const score = computeSequentialScore(block, 1, 0.3, 0.0);
      expect(score).toBe(1.0);
    });

    it("awards high continuity when label match is strong even if out of order", () => {
      const block: HandwrittenAnswerBlock = {
        id: "ans-test",
        detected_question_label: "Q. 1",
        handwritten_text: "test text",
        page_number: 1,
        bounding_box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.3 },
        confidence: 0.9,
        is_scratch_work: false,
        has_diagram: false,
      };

      // Last matched on page 3, but labelScore is 1.0
      const score = computeSequentialScore(block, 3, 0.8, 1.0);
      expect(score).toBe(1.0);
    });
  });

  describe("3. Hybrid Matcher Pipeline Execution", () => {
    it("accurately matches labelled questions using high label confidence", async () => {
      const report = await mapQuestionsToAnswers(testQuestions, testAnswers);

      const q1Mapping = report.mappings.find((m) => m.question_id === "q-1");
      expect(q1Mapping).toBeDefined();
      expect(q1Mapping?.status).toBe("matched");
      expect(q1Mapping?.confidence).toBeGreaterThanOrEqual(0.65);
      expect(q1Mapping?.matched_answer_ids).toContain("ans-1");
    });

    it("maps unlabelled questions using semantic similarity and sequential cues", async () => {
      const report = await mapQuestionsToAnswers(testQuestions, testAnswers);

      const q2Mapping = report.mappings.find((m) => m.question_id === "q-2");
      expect(q2Mapping).toBeDefined();
      expect(q2Mapping?.status).toBe("matched");
      expect(q2Mapping?.matched_answer_ids).toContain("ans-2");
    });

    it("links multi-block consecutive answers to a single question", async () => {
      const report = await mapQuestionsToAnswers(testQuestions, testAnswers);

      const q11aMapping = report.mappings.find((m) => m.question_id === "q-11a");
      expect(q11aMapping).toBeDefined();
      expect(q11aMapping?.status).toBe("matched");
      // Must link both primary block and continuation block
      expect(q11aMapping?.matched_answer_ids).toContain("ans-3a");
      expect(q11aMapping?.matched_answer_ids).toContain("ans-3b");
    });

    it("marks questions without answers as 'unanswered'", async () => {
      const report = await mapQuestionsToAnswers(testQuestions, testAnswers);

      const q12Mapping = report.mappings.find((m) => m.question_id === "q-12");
      expect(q12Mapping).toBeDefined();
      expect(q12Mapping?.status).toBe("unanswered");
      expect(q12Mapping?.confidence).toBeLessThan(0.40);
      expect(q12Mapping?.matched_answer_ids).toHaveLength(0);
    });

    it("collects unmapped scratch work and unlinked answers", async () => {
      const report = await mapQuestionsToAnswers(testQuestions, testAnswers);

      expect(report.unmapped_answers.length).toBeGreaterThanOrEqual(1);
      const scratch = report.unmapped_answers.find((a) => a.id === "ans-scratch");
      expect(scratch).toBeDefined();
    });

    it("marks questions with borderline score as 'uncertain'", async () => {
      const borderlineQuestion: ExtractedQuestionItem[] = [
        {
          id: "q-11b",
          question_number: "11(b)",
          parent_question_number: "11",
          text: "State the mathematical formula for power dissipation in a resistor.",
          max_marks: 3,
          page_number: 1,
          bounding_box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.3 },
          confidence: 0.95,
        },
      ];

      const ambiguousAnswer: HandwrittenAnswerBlock[] = [
        {
          id: "ans-partial",
          detected_question_label: "11", // Only base number without sub-part
          handwritten_text: "General electrical circuit definitions.", // Low-to-moderate semantic relevance
          page_number: 1,
          bounding_box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.3 },
          confidence: 0.85,
          is_scratch_work: false,
          has_diagram: false,
        },
      ];

      const report = await mapQuestionsToAnswers(borderlineQuestion, ambiguousAnswer);
      const mapping = report.mappings[0];
      expect(mapping).toBeDefined();
      expect(mapping.status).toBe("uncertain");
      expect(mapping.confidence).toBeGreaterThanOrEqual(0.40);
      expect(mapping.confidence).toBeLessThan(0.65);
    });

    it("handles out-of-order student answers when explicitly labeled", async () => {
      const outOfOrderAnswers: HandwrittenAnswerBlock[] = [
        {
          id: "ans-11a-first",
          detected_question_label: "11(a)",
          handwritten_text: "Ohm's law: V = I * R with voltage and resistance.",
          page_number: 1,
          bounding_box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.3 },
          confidence: 0.98,
          is_scratch_work: false,
          has_diagram: false,
        },
        {
          id: "ans-1-second",
          detected_question_label: "Q1",
          handwritten_text: "Velocity is the rate of change of displacement with direction.",
          page_number: 2,
          bounding_box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.3 },
          confidence: 0.95,
          is_scratch_work: false,
          has_diagram: false,
        },
      ];

      const report = await mapQuestionsToAnswers(testQuestions.slice(0, 3), outOfOrderAnswers);
      const q1 = report.mappings.find((m) => m.question_id === "q-1");
      const q11a = report.mappings.find((m) => m.question_id === "q-11a");

      expect(q1?.matched_answer_ids).toContain("ans-1-second");
      expect(q11a?.matched_answer_ids).toContain("ans-11a-first");
    });

    it("handles empty questions or empty answers gracefully", async () => {
      const emptyReport1 = await mapQuestionsToAnswers([], testAnswers);
      expect(emptyReport1.mappings).toHaveLength(0);
      expect(emptyReport1.unmapped_answers).toHaveLength(testAnswers.length);

      const emptyReport2 = await mapQuestionsToAnswers(testQuestions, []);
      expect(emptyReport2.mappings).toHaveLength(testQuestions.length);
      expect(emptyReport2.summary.unanswered_count).toBe(testQuestions.length);
    });

    it("produces accurate summary metrics in mapping report", async () => {
      const report = await mapQuestionsToAnswers(testQuestions, testAnswers);

      expect(report.summary.total_questions).toBe(4);
      expect(report.summary.matched_count).toBe(3); // Q1, Q2, Q11(a)
      expect(report.summary.unanswered_count).toBe(1); // Q12
      expect(report.summary.unmapped_answers_count).toBe(report.unmapped_answers.length);
      expect(report.overall_confidence).toBeGreaterThan(0);
    });
  });
});
