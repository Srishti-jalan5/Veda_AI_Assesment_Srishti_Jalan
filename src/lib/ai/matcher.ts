import {
  ExtractedQuestionItem,
} from "./question-extractor";
import {
  HandwrittenAnswerBlock,
  AnswerBoundingBox,
} from "./answer-extractor";
import {
  generateEmbedding,
  cosineSimilarity,
  EmbeddingOptions,
} from "./embeddings";

// ==========================================
// 1. Types & Interfaces
// ==========================================

export type MappingStatus = "matched" | "uncertain" | "unanswered";

export interface CandidateScoreBreakdown {
  answer_id: string;
  detected_label: string | null;
  label_score: number; // Weight: 0.50
  semantic_score: number; // Weight: 0.35
  sequential_score: number; // Weight: 0.15
  composite_score: number; // 0.0 to 1.0
}

export interface QuestionMapping {
  question_id: string;
  question_number: string;
  status: MappingStatus;
  confidence: number; // 0.0 to 1.0
  matched_answer_ids: string[];
  candidate_scores: CandidateScoreBreakdown[];
  matched_answers: HandwrittenAnswerBlock[];
  page_number?: number | null;
  boundingBox?: AnswerBoundingBox | null;
  student_text?: string | null;
  notes?: string;
}

export interface MappingSummary {
  total_questions: number;
  matched_count: number;
  uncertain_count: number;
  unanswered_count: number;
  unmapped_answers_count: number;
}

export interface QuestionMappingReport {
  mappings: QuestionMapping[];
  unmapped_answers: HandwrittenAnswerBlock[];
  overall_confidence: number;
  summary: MappingSummary;
}

export interface MatcherOptions extends EmbeddingOptions {
  matchedThreshold?: number; // default: 0.65
  uncertainThreshold?: number; // default: 0.40
  enableMultiBlockLinking?: boolean; // default: true
}

// Weights as per requirements
const WEIGHT_LABEL = 0.50;
const WEIGHT_SEMANTIC = 0.35;
const WEIGHT_SEQUENTIAL = 0.15;

// Thresholds
const DEFAULT_MATCHED_THRESHOLD = 0.65;
const DEFAULT_UNCERTAIN_THRESHOLD = 0.40;

// ==========================================
// 2. String & Label Normalization Helper
// ==========================================

/**
 * Normalizes question and answer labels for robust, deterministic comparison:
 * e.g. "Q. 11 (a)" -> "11a", "Ans 3" -> "3", "Section B - Q2" -> "2"
 */
export function normalizeLabel(raw: string | null | undefined): string {
  if (!raw) return "";

  return raw
    .toLowerCase()
    .replace(/^section\s+[a-z0-9]+\s*[-–—:]*\s*/i, "")
    .replace(/^(?:question|answer|ans|part|q)\s*[:.\-]?/i, "") // longer words before single letter 'q'
    .replace(/[^a-z0-9]/g, "")                                // remove dots, brackets, spaces
    .trim();
}

/**
 * Computes Rule/Label Match score (0.0 to 1.0)
 */
export function computeLabelMatchScore(
  questionNumber: string,
  parentQuestionNumber: string | null,
  detectedAnswerLabel: string | null | undefined
): { score: number; isExplicitMismatch: boolean } {
  if (!detectedAnswerLabel || !detectedAnswerLabel.trim()) {
    // Unlabelled answer block
    return { score: 0.0, isExplicitMismatch: false };
  }

  const normQ = normalizeLabel(questionNumber);
  const normA = normalizeLabel(detectedAnswerLabel);

  if (!normA) {
    return { score: 0.0, isExplicitMismatch: false };
  }

  // 1. Exact normalized label match (e.g. "11a" === "11a", "3" === "3")
  if (normQ === normA) {
    return { score: 1.0, isExplicitMismatch: false };
  }

  // 2. Base question / sub-part match (e.g. Q="11(a)" and A="11", or parent="11")
  if (parentQuestionNumber) {
    const normParent = normalizeLabel(parentQuestionNumber);
    if (normA === normParent) {
      return { score: 0.75, isExplicitMismatch: false };
    }
  }

  // 3. Prefix match (e.g. Q="2" and A="2.1" or A="2a")
  if (normA.startsWith(normQ) || normQ.startsWith(normA)) {
    return { score: 0.70, isExplicitMismatch: false };
  }

  // 4. Distinct numerical mismatch (e.g. Question 1 vs Answer 2)
  const qNumMatch = normQ.match(/\d+/);
  const aNumMatch = normA.match(/\d+/);
  if (qNumMatch && aNumMatch && qNumMatch[0] !== aNumMatch[0]) {
    return { score: 0.0, isExplicitMismatch: true };
  }

  return { score: 0.1, isExplicitMismatch: false };
}

// ==========================================
// 3. Sequential Continuity Calculation
// ==========================================

/**
 * Calculates sequential continuity score based on expected reading order
 */
export function computeSequentialScore(
  answerBlock: HandwrittenAnswerBlock,
  lastMatchedPage: number | null,
  lastMatchedY: number | null,
  labelScore: number
): number {
  // If label match is near 1.0 (>= 0.9), student might have legitimately answered out of order
  if (labelScore >= 0.9) {
    return 1.0;
  }

  // If this is the first question being matched
  if (lastMatchedPage === null || lastMatchedY === null) {
    // If it starts near page 1 top, award high continuity
    if (answerBlock.page_number === 1 && answerBlock.bounding_box.ymin <= 0.4) {
      return 1.0;
    }
    return 0.8;
  }

  // 1. Same page, downward progression (ymin >= lastMatchedY - 0.05 tolerance)
  if (
    answerBlock.page_number === lastMatchedPage &&
    answerBlock.bounding_box.ymin >= lastMatchedY - 0.05
  ) {
    return 1.0;
  }

  // 2. Next page (page === lastMatchedPage + 1)
  if (answerBlock.page_number === lastMatchedPage + 1) {
    return 0.9;
  }

  // 3. Later page (jump of > 1 page forward)
  if (answerBlock.page_number > lastMatchedPage + 1) {
    return 0.5;
  }

  // 4. Backwards jump (answer on an earlier page than previous question)
  // Apply penalty unless label is strong
  if (answerBlock.page_number < lastMatchedPage) {
    return 0.2;
  }

  return 0.5;
}

// ==========================================
// 4. Hybrid Matcher Engine
// ==========================================

/**
 * Maps an array of Extracted Questions to one or more Student Answer Blocks
 * using hybrid multi-signal scoring (Label + Semantic + Sequential).
 */
export async function mapQuestionsToAnswers(
  questions: ExtractedQuestionItem[],
  answers: HandwrittenAnswerBlock[],
  options: MatcherOptions = {}
): Promise<QuestionMappingReport> {
  const matchedThreshold = options.matchedThreshold ?? DEFAULT_MATCHED_THRESHOLD;
  const uncertainThreshold = options.uncertainThreshold ?? DEFAULT_UNCERTAIN_THRESHOLD;
  const enableMultiBlockLinking = options.enableMultiBlockLinking ?? true;

  if (!questions || questions.length === 0) {
    return {
      mappings: [],
      unmapped_answers: answers || [],
      overall_confidence: 0,
      summary: {
        total_questions: 0,
        matched_count: 0,
        uncertain_count: 0,
        unanswered_count: 0,
        unmapped_answers_count: answers?.length || 0,
      },
    };
  }

  if (!answers || answers.length === 0) {
    const mappings: QuestionMapping[] = questions.map((q) => ({
      question_id: q.id,
      question_number: q.question_number,
      status: "unanswered",
      confidence: 0.0,
      matched_answer_ids: [],
      candidate_scores: [],
      matched_answers: [],
    }));

    return {
      mappings,
      unmapped_answers: [],
      overall_confidence: 0,
      summary: {
        total_questions: questions.length,
        matched_count: 0,
        uncertain_count: 0,
        unanswered_count: questions.length,
        unmapped_answers_count: 0,
      },
    };
  }

  // 1. Generate embeddings concurrently
  const questionEmbeddings = await Promise.all(
    questions.map((q) => generateEmbedding(q.text, options))
  );

  const answerEmbeddings = await Promise.all(
    answers.map((a) => generateEmbedding(a.handwritten_text, options))
  );

  // Track matched answer IDs across questions to identify unmapped blocks
  const globallyClaimedAnswerIds = new Set<string>();

  let lastMatchedPage: number | null = null;
  let lastMatchedY: number | null = null;

  const mappings: QuestionMapping[] = [];

  // 2. Iterate each question in printed sequence
  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const question = questions[qIdx];
    const qVec = questionEmbeddings[qIdx];

    const candidateScores: CandidateScoreBreakdown[] = [];

    // Compute 3 signals against all answer blocks
    for (let aIdx = 0; aIdx < answers.length; aIdx++) {
      const answer = answers[aIdx];
      const aVec = answerEmbeddings[aIdx];

      // Skip pure scratch work from primary mapping candidates
      if (answer.is_scratch_work) {
        continue;
      }

      // Signal 1: Rule / Label Match
      const { score: labelScore, isExplicitMismatch } = computeLabelMatchScore(
        question.question_number,
        question.parent_question_number ?? null,
        answer.detected_question_label
      );

      // Signal 2: Semantic Similarity
      let semanticScore = 0.0;
      if (question.text.trim() && answer.handwritten_text.trim()) {
        semanticScore = cosineSimilarity(qVec, aVec);
      }

      // Signal 3: Sequential Continuity
      const sequentialScore = computeSequentialScore(
        answer,
        lastMatchedPage,
        lastMatchedY,
        labelScore
      );

      // Composite Score Calculation
      let compositeScore: number;

      if (answer.detected_question_label && answer.detected_question_label.trim()) {
        // Label is present: Standard 0.50 / 0.35 / 0.15 weighting
        compositeScore =
          WEIGHT_LABEL * labelScore +
          WEIGHT_SEMANTIC * semanticScore +
          WEIGHT_SEQUENTIAL * sequentialScore;

        // Penalty if student explicitly labelled a different question
        if (isExplicitMismatch && labelScore === 0.0) {
          compositeScore = Math.min(compositeScore, 0.25);
        }
      } else {
        // Unlabelled block: Normalize over Semantic (0.70) and Sequential (0.30)
        const unlabelledWeightSemantic = WEIGHT_SEMANTIC / (WEIGHT_SEMANTIC + WEIGHT_SEQUENTIAL);
        const unlabelledWeightSeq = WEIGHT_SEQUENTIAL / (WEIGHT_SEMANTIC + WEIGHT_SEQUENTIAL);

        compositeScore =
          unlabelledWeightSemantic * semanticScore +
          unlabelledWeightSeq * sequentialScore;

        // If semantic similarity is negligible, sequential alone cannot manufacture a match
        if (semanticScore < 0.35) {
          compositeScore = Math.min(compositeScore, semanticScore * 1.2);
        }
      }

      // If answer was already claimed by an earlier question, penalize duplicate assignment
      if (globallyClaimedAnswerIds.has(answer.id)) {
        compositeScore = Math.min(compositeScore, 0.30);
      }

      // Clamp score to [0.0, 1.0] and round to 4 decimals
      compositeScore = Number(Math.max(0.0, Math.min(1.0, compositeScore)).toFixed(4));

      candidateScores.push({
        answer_id: answer.id,
        detected_label: answer.detected_question_label || null,
        label_score: labelScore,
        semantic_score: semanticScore,
        sequential_score: sequentialScore,
        composite_score: compositeScore,
      });
    }

    // Sort candidates descending by composite score
    candidateScores.sort((a, b) => b.composite_score - a.composite_score);

    const bestCandidate = candidateScores[0];
    const topScore = bestCandidate ? bestCandidate.composite_score : 0.0;

    // Determine status based on strict threshold rules
    let status: MappingStatus = "unanswered";
    if (topScore >= matchedThreshold) {
      status = "matched";
    } else if (topScore >= uncertainThreshold) {
      status = "uncertain";
    } else {
      status = "unanswered";
    }

    const matchedAnswerIds: string[] = [];
    const matchedAnswerBlocks: HandwrittenAnswerBlock[] = [];

    if (status !== "unanswered" && bestCandidate) {
      matchedAnswerIds.push(bestCandidate.answer_id);
      globallyClaimedAnswerIds.add(bestCandidate.answer_id);

      const primaryBlock = answers.find((a) => a.id === bestCandidate.answer_id);
      if (primaryBlock) {
        matchedAnswerBlocks.push(primaryBlock);
        lastMatchedPage = primaryBlock.page_number;
        lastMatchedY = primaryBlock.bounding_box.ymax;
      }

      // 3. Multi-block / Multi-page answer linking (Edge Case Handling)
      if (enableMultiBlockLinking && primaryBlock) {
        const primaryIdx = answers.findIndex((a) => a.id === primaryBlock.id);
        if (primaryIdx >= 0 && primaryIdx < answers.length - 1) {
          const nextBlock = answers[primaryIdx + 1];

          // A block is a genuine continuation only if:
          // 1. It is not scratch work and not already claimed
          // 2. Either it explicitly shares the same question/subpart label (e.g. "11(a)" or "11"),
          //    OR it is unlabelled AND has high semantic continuation with this question
          const isSameLabel =
            Boolean(nextBlock.detected_question_label) &&
            normalizeLabel(nextBlock.detected_question_label) === normalizeLabel(question.question_number);

          const nextVec = answerEmbeddings[primaryIdx + 1];
          const nextSemantic = cosineSimilarity(qVec, nextVec);

          const isUnlabelledContinuation =
            !nextBlock.detected_question_label &&
            nextSemantic >= 0.55 &&
            (nextBlock.page_number === primaryBlock.page_number ||
              nextBlock.page_number === primaryBlock.page_number + 1);

          if (
            !nextBlock.is_scratch_work &&
            !globallyClaimedAnswerIds.has(nextBlock.id) &&
            (isSameLabel || isUnlabelledContinuation)
          ) {
            matchedAnswerIds.push(nextBlock.id);
            matchedAnswerBlocks.push(nextBlock);
            globallyClaimedAnswerIds.add(nextBlock.id);
            lastMatchedPage = nextBlock.page_number;
            lastMatchedY = nextBlock.bounding_box.ymax;
          }
        }
      }
    }

    const primaryBlock = matchedAnswerBlocks[0];

    mappings.push({
      question_id: question.id,
      question_number: question.question_number,
      status,
      confidence: topScore,
      matched_answer_ids: matchedAnswerIds,
      candidate_scores: candidateScores,
      matched_answers: matchedAnswerBlocks,
      page_number: primaryBlock ? primaryBlock.page_number : null,
      boundingBox: primaryBlock ? primaryBlock.bounding_box : null,
      student_text: primaryBlock ? primaryBlock.handwritten_text : null,
    });
  }

  // 4. Identify Unmapped Answers (including unlabelled blocks & scratch work)
  const unmapped_answers = answers.filter((a) => !globallyClaimedAnswerIds.has(a.id));

  // 5. Compute Summary Statistics
  const matched_count = mappings.filter((m) => m.status === "matched").length;
  const uncertain_count = mappings.filter((m) => m.status === "uncertain").length;
  const unanswered_count = mappings.filter((m) => m.status === "unanswered").length;

  const totalConfidenceSum = mappings.reduce((sum, m) => sum + m.confidence, 0);
  const overall_confidence =
    mappings.length > 0 ? Number((totalConfidenceSum / mappings.length).toFixed(4)) : 0;

  return {
    mappings,
    unmapped_answers,
    overall_confidence,
    summary: {
      total_questions: questions.length,
      matched_count,
      uncertain_count,
      unanswered_count,
      unmapped_answers_count: unmapped_answers.length,
    },
  };
}

/**
 * Direct deterministic mapping function for fast question-to-answer binding
 */
export function mapQuestionsToAnswersDirect<
  Q extends { id: string; question_number: string },
  A extends { detected_question_label?: string | null; page_number: number; bounding_box?: AnswerBoundingBox | Record<string, number> | null; handwritten_text: string }
>(
  questions: Q[],
  allAnswers: A[]
) {
  return questions.map((question) => {
    const targetKey = normalizeLabel(question.question_number);

    // Find the exact matching answer block
    const matched = allAnswers.find((ans) => {
      if (!ans.detected_question_label) return false;
      return normalizeLabel(ans.detected_question_label) === targetKey;
    });

    if (matched && matched.bounding_box) {
      return {
        question_id: question.id,
        question_number: question.question_number,
        status: "matched" as const,
        page_number: matched.page_number,
        boundingBox: matched.bounding_box, // Tightly bound to this specific answer
        student_text: matched.handwritten_text,
      };
    }

    return {
      question_id: question.id,
      question_number: question.question_number,
      status: "unanswered" as const,
      page_number: null,
      boundingBox: null,
      student_text: null,
    };
  });
}
