import { describe, it, expect, beforeEach } from "vitest";
import {
  cosineSimilarity,
  generateEmbedding,
  computePairwiseSimilarities,
  clearEmbeddingCache,
  getEmbeddingCacheSize,
  QuestionInput,
  AnswerBlockInput,
} from "../src/lib/ai/embeddings";

describe("Embeddings & Cosine Similarity Service — Unit Tests", () => {
  beforeEach(() => {
    clearEmbeddingCache();
  });

  describe("1. Cosine Similarity Calculations", () => {
    it("should return 1.0 for identical non-zero vectors", () => {
      const vecA = [0.5, 0.5, 0.5, 0.5];
      const vecB = [0.5, 0.5, 0.5, 0.5];
      expect(cosineSimilarity(vecA, vecB)).toBe(1.0);
    });

    it("should return 0.0 for orthogonal vectors", () => {
      const vecA = [1.0, 0.0, 0.0];
      const vecB = [0.0, 1.0, 0.0];
      expect(cosineSimilarity(vecA, vecB)).toBe(0.0);
    });

    it("should return 0.0 when either vector is empty or all zeroes", () => {
      expect(cosineSimilarity([], [1, 2, 3])).toBe(0.0);
      expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0.0);
      expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0.0);
    });

    it("should accurately compute cosine angle between normalized vectors", () => {
      const vecA = [1, 1, 0];
      const vecB = [1, 0, 0];
      // cos(45 deg) = 1 / sqrt(2) = ~0.7071
      expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0.7071, 3);
    });
  });

  describe("2. Embedding Generation & In-Memory Session Caching", () => {
    it("should generate a normalized dense vector for valid text", async () => {
      const text = "State and explain the law of conservation of energy";
      const embedding = await generateEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      // Verify non-zero vector
      const magnitude = Math.sqrt(embedding.reduce((acc, v) => acc + v * v, 0));
      expect(magnitude).toBeCloseTo(1.0, 1);
    });

    it("should return all zeroes for empty or single-character strings without throwing", async () => {
      const emptyVec = await generateEmbedding("");
      const spaceVec = await generateEmbedding("   ");
      const shortVec = await generateEmbedding("a");

      expect(emptyVec.every((val) => val === 0)).toBe(true);
      expect(spaceVec.every((val) => val === 0)).toBe(true);
      expect(shortVec.every((val) => val === 0)).toBe(true);
    });

    it("should cache embeddings in-memory and avoid re-computation", async () => {
      expect(getEmbeddingCacheSize()).toBe(0);

      const text = "Calculate acceleration given force and mass values";
      await generateEmbedding(text);
      expect(getEmbeddingCacheSize()).toBe(1);

      // Repeated call with same text (even with different casing/whitespace)
      await generateEmbedding("  calculate acceleration given force and mass values  ");
      expect(getEmbeddingCacheSize()).toBe(1);

      clearEmbeddingCache();
      expect(getEmbeddingCacheSize()).toBe(0);
    });
  });

  describe("3. Pairwise Similarity Matrix & Mapping", () => {
    const testQuestions: QuestionInput[] = [
      {
        id: "q_1",
        question_number: "1",
        text: "Calculate acceleration from force and mass using F equals ma.",
      },
      {
        id: "q_2",
        question_number: "2",
        text: "Explain the law of conservation of linear momentum during collisions.",
      },
      {
        id: "q_3",
        question_number: "3",
        text: "Describe heat conduction in solids and thermal conductivity.",
      },
    ];

    const testAnswers: AnswerBlockInput[] = [
      {
        id: "ans_a",
        detected_question_label: "Q2",
        handwritten_text: "Conservation of linear momentum states that total momentum before collision equals total momentum after collision.",
      },
      {
        id: "ans_b",
        detected_question_label: "1",
        handwritten_text: "Acceleration equals force divided by mass according to formula F equals ma.",
      },
      {
        id: "ans_c_empty",
        detected_question_label: null,
        handwritten_text: "",
      },
    ];

    it("should compute full similarity matrix between all questions and answers", async () => {
      const result = await computePairwiseSimilarities(testQuestions, testAnswers);

      expect(result.matrix).toHaveLength(3); // 3 questions
      expect(result.matrix[0]).toHaveLength(3); // 3 answers per row
      expect(result.pairs).toHaveLength(9); // 3 * 3 pairs
      expect(result.questionIds).toEqual(["q_1", "q_2", "q_3"]);
      expect(result.answerIds).toEqual(["ans_a", "ans_b", "ans_c_empty"]);
    });

    it("should correctly identify highest semantic similarity matches", async () => {
      const result = await computePairwiseSimilarities(testQuestions, testAnswers);

      // Q1 (Force and acceleration) should best match ans_b (Acceleration equals force divided by mass)
      expect(result.bestMatchPerQuestion["q_1"].answerId).toBe("ans_b");
      expect(result.bestMatchPerQuestion["q_1"].similarity).toBeGreaterThan(0.5);

      // Q2 (Momentum) should best match ans_a (Total momentum before collision)
      expect(result.bestMatchPerQuestion["q_2"].answerId).toBe("ans_a");
      expect(result.bestMatchPerQuestion["q_2"].similarity).toBeGreaterThan(0.5);

      // ans_c_empty should have 0.0 similarity across all questions
      expect(result.matrix[0][2]).toBe(0.0);
      expect(result.matrix[1][2]).toBe(0.0);
      expect(result.matrix[2][2]).toBe(0.0);
    });

    it("should handle empty question or answer arrays gracefully", async () => {
      const emptyQuestionsResult = await computePairwiseSimilarities([], testAnswers);
      expect(emptyQuestionsResult.matrix).toEqual([]);
      expect(emptyQuestionsResult.pairs).toEqual([]);

      const emptyAnswersResult = await computePairwiseSimilarities(testQuestions, []);
      expect(emptyAnswersResult.matrix).toEqual([]);
      expect(emptyAnswersResult.pairs).toEqual([]);
    });
  });
});
