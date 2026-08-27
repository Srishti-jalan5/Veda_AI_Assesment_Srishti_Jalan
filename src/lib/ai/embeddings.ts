// ==========================================
// 1. Interfaces & Types
// ==========================================

export interface QuestionInput {
  id: string;
  question_number: string;
  text: string;
}

export interface AnswerBlockInput {
  id: string;
  detected_question_label?: string | null;
  handwritten_text: string;
}

export interface QuestionAnswerPairSimilarity {
  questionId: string;
  questionNumber: string;
  answerId: string;
  detectedLabel: string | null;
  similarity: number;
}

export interface PairwiseSimilarityResult {
  matrix: number[][]; // [questionIndex][answerIndex]
  questionIds: string[];
  answerIds: string[];
  pairs: QuestionAnswerPairSimilarity[];
  bestMatchPerQuestion: Record<string, { answerId: string; similarity: number }>;
  bestMatchPerAnswer: Record<string, { questionId: string; similarity: number }>;
}

export interface EmbeddingOptions {
  model?: "text-embedding-004" | "text-embedding-3-small" | "deterministic-local";
  apiKey?: string;
  bypassCache?: boolean;
}

// ==========================================
// 2. In-Memory Session Cache
// ==========================================

const sessionEmbeddingCache = new Map<string, number[]>();

export function getEmbeddingCacheSize(): number {
  return sessionEmbeddingCache.size;
}

export function clearEmbeddingCache(): void {
  sessionEmbeddingCache.clear();
}

/**
 * Normalizes text to form a reliable cache key
 */
function toCacheKey(text: string, model: string = "default"): string {
  return `${model}::${text.trim().toLowerCase()}`;
}

// ==========================================
// 3. Deterministic Local Embedding (Fallback & Fast Testing)
// ==========================================

/**
 * Generates a normalized semantic feature vector (128 dimensions)
 * from text terms, sub-word character n-grams, and keywords.
 */
export function generateDeterministicEmbedding(text: string, dimensions: number = 128): number[] {
  const clean = text.trim().toLowerCase();
  if (!clean) {
    return new Array(dimensions).fill(0);
  }

  const vector = new Array(dimensions).fill(0);
  const words = clean.split(/\W+/).filter((w) => w.length > 0);

  // Common stop words to de-emphasize
  const stopWords = new Set(["the", "is", "in", "of", "and", "a", "an", "to", "with", "which", "for", "it", "has"]);

  words.forEach((word) => {
    const isStop = stopWords.has(word);
    const weight = isStop ? 0.2 : 3.0;

    // Full word hash
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % dimensions;
    vector[bucket] += weight;

    // Sub-word character 3-grams and 4-grams
    if (!isStop && word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const sub = word.substring(i, i + 3);
        let subHash = 0;
        for (let j = 0; j < sub.length; j++) {
          subHash = (subHash << 5) - subHash + sub.charCodeAt(j);
          subHash |= 0;
        }
        vector[Math.abs(subHash) % dimensions] += 1.0;
      }
    }
  });

  // L2 Normalize vector
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSq += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSq);

  if (magnitude === 0) return vector;

  return vector.map((val) => Number((val / magnitude).toFixed(6)));
}

// ==========================================
// 4. Core Embedding Generation
// ==========================================

/**
 * Generates dense text embeddings with in-memory session caching and graceful fallback.
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  const trimmed = text ? text.trim() : "";

  // 1. Handle short/empty transcribed answers gracefully (fallback = zero vector)
  if (!trimmed || trimmed.length < 2) {
    return new Array(128).fill(0);
  }

  const model = options.model || "text-embedding-004";
  const cacheKey = toCacheKey(trimmed, model);

  // 2. Check in-memory session cache
  if (!options.bypassCache && sessionEmbeddingCache.has(cacheKey)) {
    return sessionEmbeddingCache.get(cacheKey)!;
  }

  const apiKey =
    options.apiKey ||
    (typeof process !== "undefined"
      ? process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
      : undefined);

  let embedding: number[];

  // 3. If API Key is present and live API is requested, call Gemini text-embedding-004
  if (apiKey && options.model !== "deterministic-local") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text: trimmed }] },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.embedding?.values && Array.isArray(data.embedding.values)) {
          embedding = data.embedding.values;
        } else {
          embedding = generateDeterministicEmbedding(trimmed);
        }
      } else {
        embedding = generateDeterministicEmbedding(trimmed);
      }
    } catch {
      embedding = generateDeterministicEmbedding(trimmed);
    }
  } else {
    // 4. Fallback to local semantic vector generator
    embedding = generateDeterministicEmbedding(trimmed);
  }

  // 5. Save to session cache
  sessionEmbeddingCache.set(cacheKey, embedding);
  return embedding;
}

// ==========================================
// 5. Cosine Similarity Calculation
// ==========================================

/**
 * Computes cosine similarity between two dense vectors.
 * Returns a score between 0.0 and 1.0.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0.0;
  }

  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  // Guard against division by zero or NaN
  if (magnitude === 0 || isNaN(magnitude) || !isFinite(magnitude)) {
    return 0.0;
  }

  const similarity = dotProduct / magnitude;
  // Round to 4 decimal places and clamp between 0.0 and 1.0
  return Number(Math.max(0.0, Math.min(1.0, similarity)).toFixed(4));
}

// ==========================================
// 6. Pairwise Question-Answer Similarities
// ==========================================

/**
 * Computes full pairwise similarity matrix and map between every question text and transcribed answer text.
 */
export async function computePairwiseSimilarities(
  questions: QuestionInput[],
  answers: AnswerBlockInput[],
  options: EmbeddingOptions = {}
): Promise<PairwiseSimilarityResult> {
  if (!questions || questions.length === 0 || !answers || answers.length === 0) {
    return {
      matrix: [],
      questionIds: questions?.map((q) => q.id) || [],
      answerIds: answers?.map((a) => a.id) || [],
      pairs: [],
      bestMatchPerQuestion: {},
      bestMatchPerAnswer: {},
    };
  }

  // 1. Generate embeddings for all questions concurrently (leveraging cache)
  const questionEmbeddings = await Promise.all(
    questions.map((q) => generateEmbedding(q.text, options))
  );

  // 2. Generate embeddings for all answers concurrently (leveraging cache)
  const answerEmbeddings = await Promise.all(
    answers.map((a) => generateEmbedding(a.handwritten_text, options))
  );

  const matrix: number[][] = [];
  const pairs: QuestionAnswerPairSimilarity[] = [];
  const bestMatchPerQuestion: Record<string, { answerId: string; similarity: number }> = {};
  const bestMatchPerAnswer: Record<string, { questionId: string; similarity: number }> = {};

  // 3. Compute all pairwise similarities
  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const q = questions[qIdx];
    const qVec = questionEmbeddings[qIdx];
    const row: number[] = [];

    let bestScoreForQ = -1;
    let bestAnswerIdForQ = "";

    for (let aIdx = 0; aIdx < answers.length; aIdx++) {
      const a = answers[aIdx];
      const aVec = answerEmbeddings[aIdx];

      // If either text is empty, similarity is 0.0
      let score = 0.0;
      if (q.text.trim() && a.handwritten_text.trim()) {
        score = cosineSimilarity(qVec, aVec);
      }

      row.push(score);

      pairs.push({
        questionId: q.id,
        questionNumber: q.question_number,
        answerId: a.id,
        detectedLabel: a.detected_question_label || null,
        similarity: score,
      });

      // Track best answer match for this question
      if (score > bestScoreForQ) {
        bestScoreForQ = score;
        bestAnswerIdForQ = a.id;
      }

      // Track best question match for this answer
      const currentBestForA = bestMatchPerAnswer[a.id];
      if (!currentBestForA || score > currentBestForA.similarity) {
        bestMatchPerAnswer[a.id] = { questionId: q.id, similarity: score };
      }
    }

    matrix.push(row);
    bestMatchPerQuestion[q.id] = { answerId: bestAnswerIdForQ, similarity: Math.max(0, bestScoreForQ) };
  }

  return {
    matrix,
    questionIds: questions.map((q) => q.id),
    answerIds: answers.map((a) => a.id),
    pairs,
    bestMatchPerQuestion,
    bestMatchPerAnswer,
  };
}
