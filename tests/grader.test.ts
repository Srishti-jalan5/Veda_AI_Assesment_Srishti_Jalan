import { describe, it, expect } from "vitest";
import {
  gradeQuestionAnswer,
  gradeBatchAssessment,
  GradeInput,
} from "../src/lib/ai/grader";

describe("AI Grading Service (/lib/ai/grader.ts)", () => {
  describe("1. Unanswered Questions Rule", () => {
    it("immediately awards 0 marks for unanswered questions without calling LLM", async () => {
      const input: GradeInput = {
        question_id: "q-unanswered",
        question_number: "4",
        question_text: "Explain the law of conservation of momentum.",
        max_marks: 5,
        transcribed_answer: "",
        status: "unanswered",
      };

      const grade = await gradeQuestionAnswer(input);

      expect(grade.question_id).toBe("q-unanswered");
      expect(grade.awarded_marks).toBe(0);
      expect(grade.is_correct).toBe(false);
      expect(grade.grade_percentage).toBe(0);
      expect(grade.feedback).toContain("No student response");
      expect(grade.key_missing_points).toContain("Question was left unattempted.");
    });
  });

  describe("2. Matched & Correct Answers", () => {
    it("grades matched complete answers with full marks and positive feedback", async () => {
      const input: GradeInput = {
        question_id: "q-1",
        question_number: "1",
        question_text: "State Ohm's Law relating voltage, current, and resistance.",
        max_marks: 2,
        transcribed_answer: "Ohm's Law states that V = I * R where voltage is directly proportional to current.",
        status: "matched",
      };

      const grade = await gradeQuestionAnswer(input, { model: "mock-fallback" });

      expect(grade.awarded_marks).toBe(2);
      expect(grade.max_marks).toBe(2);
      expect(grade.is_correct).toBe(true);
      expect(grade.grade_percentage).toBe(100);
      expect(grade.feedback.length).toBeGreaterThan(10);
    });
  });

  describe("3. Uncertain & Partial Answers", () => {
    it("awards partial marks and suggests missing points for uncertain answers", async () => {
      const input: GradeInput = {
        question_id: "q-partial",
        question_number: "2",
        question_text: "Describe the three stages of cellular respiration.",
        max_marks: 6,
        transcribed_answer: "It involves glycolysis and Krebs cycle.",
        status: "uncertain",
      };

      const grade = await gradeQuestionAnswer(input, { model: "mock-fallback" });

      expect(grade.awarded_marks).toBeGreaterThan(0);
      expect(grade.awarded_marks).toBeLessThan(6);
      expect(grade.is_correct).toBe(false);
      expect(grade.key_missing_points.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. Fault Tolerance & Fallbacks", () => {
    it("gracefully falls back without throwing when LLM fails or times out", async () => {
      const input: GradeInput = {
        question_id: "q-timeout-test",
        question_number: "3",
        question_text: "State Snell's Law of refraction.",
        max_marks: 3,
        transcribed_answer: "n1 * sin(theta1) = n2 * sin(theta2)",
        status: "matched",
      };

      // Pass invalid API key and short timeout to trigger fault tolerance
      const grade = await gradeQuestionAnswer(input, {
        apiKey: "invalid-key-xyz",
        timeoutMs: 50,
      });

      expect(grade).toBeDefined();
      expect(grade.question_id).toBe("q-timeout-test");
      expect(grade.is_fallback).toBe(true);
      expect(grade.awarded_marks).toBeGreaterThanOrEqual(0);
    });
  });

  describe("5. Batch Assessment Grading", () => {
    it("grades an entire assessment batch and calculates totals accurately", async () => {
      const batch: GradeInput[] = [
        {
          question_id: "q-1",
          question_text: "Q1 text",
          max_marks: 2,
          transcribed_answer: "Correct answer text",
          status: "matched",
        },
        {
          question_id: "q-2",
          question_text: "Q2 text",
          max_marks: 4,
          transcribed_answer: "Partial answer text",
          status: "uncertain",
        },
        {
          question_id: "q-3",
          question_text: "Q3 text",
          max_marks: 4,
          transcribed_answer: "",
          status: "unanswered",
        },
      ];

      const report = await gradeBatchAssessment(batch, { model: "mock-fallback" });

      expect(report.total_max_marks).toBe(10); // 2 + 4 + 4
      expect(report.total_awarded_marks).toBe(4); // 2 + 2 + 0
      expect(report.overall_percentage).toBe(40);
      expect(Object.keys(report.grades)).toHaveLength(3);
    });
  });
});
