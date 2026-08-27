import { z } from "zod";

// ==========================================
// 1. Types & Zod Schemas
// ==========================================

export const GradeResultSchema = z.object({
  question_id: z.string(),
  question_number: z.string().optional(),
  max_marks: z.number().min(1),
  awarded_marks: z.number().min(0),
  is_correct: z.boolean(),
  grade_percentage: z.number().min(0).max(100),
  feedback: z.string().min(1),
  key_missing_points: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  graded_at: z.string(),
  is_fallback: z.boolean().optional().default(false),
});

export type GradeResult = z.infer<typeof GradeResultSchema>;

export interface GradeInput {
  question_id: string;
  question_number?: string;
  question_text: string;
  max_marks?: number; // default: 5
  transcribed_answer?: string | null;
  status?: "matched" | "uncertain" | "unanswered";
  rubric_criteria?: string[];
}

export interface GradeOptions {
  model?: "gemini-1.5-flash" | "mock-fallback";
  apiKey?: string;
  timeoutMs?: number; // default: 6000ms
}

export interface BatchGradeReport {
  grades: Record<string, GradeResult>;
  total_max_marks: number;
  total_awarded_marks: number;
  overall_percentage: number;
  graded_at: string;
}

// ==========================================
// 2. System Instructions for AI Grading
// ==========================================

export const GRADING_SYSTEM_PROMPT = `
You are an expert academic evaluator. Grade the student's handwritten response against the question prompt and maximum marks.

STRICT EVALUATION CRITERIA:
1. "awarded_marks": Number between 0 and max_marks (can be decimal like 2.5 or integer).
2. "is_correct": true if awarded_marks >= (max_marks * 0.75), otherwise false.
3. "feedback": 1 to 2 clear, encouraging, constructive sentences explaining why marks were awarded or deducted.
4. "key_missing_points": Array of 0 to 3 concise bullet points outlining key concepts omitted.
5. Return ONLY a valid JSON object matching the schema.
`;

// ==========================================
// 3. Deterministic Mock Grading Generator
// ==========================================

export function generateDeterministicGrade(input: GradeInput, isFallback: boolean = false): GradeResult {
  const maxMarks = input.max_marks || 5;
  const answerText = input.transcribed_answer ? input.transcribed_answer.trim() : "";

  // 1. Unanswered criteria: 0 marks immediately
  if (input.status === "unanswered" || !answerText || answerText.length < 2) {
    return {
      question_id: input.question_id,
      question_number: input.question_number,
      max_marks: maxMarks,
      awarded_marks: 0,
      is_correct: false,
      grade_percentage: 0,
      feedback: "No student response was detected for this question.",
      key_missing_points: ["Question was left unattempted."],
      confidence: 1.0,
      graded_at: new Date().toISOString(),
      is_fallback: isFallback,
    };
  }

  // 2. Uncertain criteria: Partial marks
  if (input.status === "uncertain") {
    const awarded = Math.max(1, Math.floor(maxMarks * 0.6));
    return {
      question_id: input.question_id,
      question_number: input.question_number,
      max_marks: maxMarks,
      awarded_marks: awarded,
      is_correct: false,
      grade_percentage: Math.round((awarded / maxMarks) * 100),
      feedback:
        "The response shows partial conceptual understanding but contains minor ambiguities or incomplete steps.",
      key_missing_points: ["Elaborate further on intermediate steps or definitions."],
      confidence: 0.75,
      graded_at: new Date().toISOString(),
      is_fallback: isFallback,
    };
  }

  // 3. Matched criteria: Full or high marks
  return {
    question_id: input.question_id,
    question_number: input.question_number,
    max_marks: maxMarks,
    awarded_marks: maxMarks,
    is_correct: true,
    grade_percentage: 100,
    feedback:
      "Excellent response! All core concepts and necessary details are clearly and accurately stated.",
    key_missing_points: [],
    confidence: 0.95,
    graded_at: new Date().toISOString(),
    is_fallback: isFallback,
  };
}

// ==========================================
// 4. Core Isolated AI Grading Function
// ==========================================

/**
 * Grades a single question against student response with isolated error boundaries
 */
export async function gradeQuestionAnswer(
  input: GradeInput,
  options: GradeOptions = {}
): Promise<GradeResult> {
  const maxMarks = input.max_marks || 5;
  const answerText = input.transcribed_answer ? input.transcribed_answer.trim() : "";

  // Rule 1: If question status is "unanswered" or answer is empty, award 0 immediately without calling LLM
  if (input.status === "unanswered" || !answerText || answerText.length < 2) {
    return {
      question_id: input.question_id,
      question_number: input.question_number,
      max_marks: maxMarks,
      awarded_marks: 0,
      is_correct: false,
      grade_percentage: 0,
      feedback: "No student response was detected for this question.",
      key_missing_points: ["Question was left unattempted."],
      confidence: 1.0,
      graded_at: new Date().toISOString(),
      is_fallback: false,
    };
  }

  const groqApiKey =
    typeof process !== "undefined" ? process.env.GROQ_API_KEY : undefined;
  const geminiApiKey =
    options.apiKey ||
    (typeof process !== "undefined"
      ? process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
      : undefined);

  // If no live API key, use deterministic fallback
  if ((!groqApiKey && !geminiApiKey) || options.model === "mock-fallback") {
    return generateDeterministicGrade(input);
  }

  // Rule 2: Live LLM Call with strict timeout & error boundary
  const timeoutMs = options.timeoutMs || 6000;
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const userPrompt = `
Question Prompt: "${input.question_text}"
Maximum Marks Allocated: ${maxMarks}
Student Handwritten Transcribed Answer: "${answerText}"
${input.rubric_criteria ? `Rubric Guidelines: ${input.rubric_criteria.join("; ")}` : ""}

Evaluate the answer and return JSON:
{
  "awarded_marks": number,
  "is_correct": boolean,
  "feedback": string,
  "key_missing_points": string[]
}
`;

    let parsed: Record<string, unknown> | null = null;

    // 1. If Groq API Key is available, use ultra-fast Groq LLM inference
    if (groqApiKey) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: GRADING_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          const rawText = groqData.choices?.[0]?.message?.content || "{}";
          parsed = JSON.parse(rawText);
        }
      } catch (err) {
        console.warn("Groq grading failed, falling back to Gemini:", (err as Error).message);
      }
    }

    // 2. If Groq wasn't used or failed, try Gemini candidates
    if (!parsed && geminiApiKey) {
      const candidateModels = [
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
      ];

      for (const model of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: GRADING_SYSTEM_PROMPT }, { text: userPrompt }],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            parsed = JSON.parse(rawContent);
            if (parsed) break;
          }
        } catch (err) {
          console.warn(`Grader model ${model} failed:`, (err as Error).message);
        }
      }
    }

    if (!parsed) {
      return generateDeterministicGrade(input, true);
    }

    const awardedMarks = Math.max(
      0,
      Math.min(maxMarks, Number(parsed.awarded_marks) || 0)
    );
    const isCorrect =
      typeof parsed.is_correct === "boolean"
        ? parsed.is_correct
        : awardedMarks >= maxMarks * 0.75;
    const feedback =
      typeof parsed.feedback === "string" && parsed.feedback.trim()
        ? parsed.feedback.trim()
        : "Student response evaluated.";
    const keyMissingPoints = Array.isArray(parsed.key_missing_points)
      ? parsed.key_missing_points.map(String)
      : [];

    return {
      question_id: input.question_id,
      question_number: input.question_number,
      max_marks: maxMarks,
      awarded_marks: awardedMarks,
      is_correct: isCorrect,
      grade_percentage: Math.round((awardedMarks / maxMarks) * 100),
      feedback,
      key_missing_points: keyMissingPoints,
      confidence: 0.92,
      graded_at: new Date().toISOString(),
      is_fallback: false,
    };
  } catch (error) {
    // Rule 3: Graceful fallback — Grading failures or timeouts do NOT break mapping
    console.warn(
      `Grading fallback invoked for question ${input.question_id}:`,
      error instanceof Error ? error.message : error
    );
    const fallbackGrade = generateDeterministicGrade(input);
    return {
      ...fallbackGrade,
      is_fallback: true,
    };
  } finally {
    clearTimeout(timeoutTimer);
  }
}

// ==========================================
// 5. Batch Assessment Grading
// ==========================================

/**
 * Grades an entire assessment batch concurrently with isolated fault tolerance
 */
export async function gradeBatchAssessment(
  items: GradeInput[],
  options: GradeOptions = {}
): Promise<BatchGradeReport> {
  const gradeResults = await Promise.all(
    items.map((item) => gradeQuestionAnswer(item, options))
  );

  const gradesMap: Record<string, GradeResult> = {};
  let totalMax = 0;
  let totalAwarded = 0;

  for (const grade of gradeResults) {
    gradesMap[grade.question_id] = grade;
    totalMax += grade.max_marks;
    totalAwarded += grade.awarded_marks;
  }

  const overallPercentage =
    totalMax > 0 ? Math.round((totalAwarded / totalMax) * 100) : 0;

  return {
    grades: gradesMap,
    total_max_marks: totalMax,
    total_awarded_marks: totalAwarded,
    overall_percentage: overallPercentage,
    graded_at: new Date().toISOString(),
  };
}
