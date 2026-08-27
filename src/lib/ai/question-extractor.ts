import { z } from "zod";
import { getResolvedGroqApiKey, getResolvedGeminiApiKey } from "./api-keys";

// ==========================================
// 1. Zod Schemas & Type Definitions
// ==========================================

/**
 * Normalized Bounding Box schema (0.0 to 1.0 or 0 to 1000 scale)
 */
export const BoundingBoxSchema = z
  .object({
    xmin: z.number().min(0),
    ymin: z.number().min(0),
    xmax: z.number().min(0),
    ymax: z.number().min(0),
  })
  .refine(
    (box) => {
      const is0To1 = box.xmin <= 1 && box.ymin <= 1 && box.xmax <= 1 && box.ymax <= 1;
      const is0To1000 =
        box.xmin <= 1000 &&
        box.ymin <= 1000 &&
        box.xmax <= 1000 &&
        box.ymax <= 1000 &&
        (box.xmax > 1.0 ? box.xmax >= 5 : true);
      return is0To1 || is0To1000;
    },
    { message: "Coordinates must either be normalized (0.0 - 1.0) or on a 0-1000 scale" }
  )
  .refine((box) => box.xmax >= box.xmin && box.ymax >= box.ymin, {
    message: "Invalid bounding box: xmax must be >= xmin and ymax must be >= ymin",
  })
  .transform((box) => {
    // Normalize 0-1000 scale to 0.0-1.0 scale if necessary
    if (box.xmax > 1 || box.ymax > 1 || box.xmin > 1 || box.ymin > 1) {
      return {
        xmin: Math.max(0, Math.min(1, Number((box.xmin / 1000).toFixed(4)))),
        ymin: Math.max(0, Math.min(1, Number((box.ymin / 1000).toFixed(4)))),
        xmax: Math.max(0, Math.min(1, Number((box.xmax / 1000).toFixed(4)))),
        ymax: Math.max(0, Math.min(1, Number((box.ymax / 1000).toFixed(4)))),
      };
    }
    return {
      xmin: Number(box.xmin.toFixed(4)),
      ymin: Number(box.ymin.toFixed(4)),
      xmax: Number(box.xmax.toFixed(4)),
      ymax: Number(box.ymax.toFixed(4)),
    };
  });

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

/**
 * Individual Extracted Question Item Schema
 */
export const ExtractedQuestionItemSchema = z.object({
  id: z.string().min(1, "Question ID must not be empty"),
  question_number: z.string().min(1, "Question number label is required"),
  parent_question_number: z.string().nullable().optional(),
  text: z.string().min(1, "Question text must not be empty"),
  max_marks: z.number().nullable().optional(),
  page_number: z.number().int().positive("Page number must be positive (1-indexed)"),
  bounding_box: BoundingBoxSchema,
  confidence: z.number().min(0).max(1).optional().default(0.95),
});

export type ExtractedQuestionItem = z.infer<typeof ExtractedQuestionItemSchema>;

/**
 * Assessment Metadata Schema
 */
export const ExtractionMetadataSchema = z.object({
  total_questions: z.number().int().nonnegative(),
  page_count: z.number().int().positive(),
  extraction_timestamp: z.string(),
});

export type ExtractionMetadata = z.infer<typeof ExtractionMetadataSchema>;

/**
 * Root Extracted Question Paper Schema
 */
export const ExtractedQuestionPaperSchema = z.object({
  assessment_title: z.string().nullable().optional(),
  total_marks: z.number().nullable().optional(),
  instructions: z.array(z.string()).optional().default([]),
  questions: z.array(ExtractedQuestionItemSchema).min(1, "At least one question must be extracted"),
  metadata: ExtractionMetadataSchema.optional(),
});

export type ExtractedQuestionPaper = z.infer<typeof ExtractedQuestionPaperSchema>;

// ==========================================
// 2. Options & Error Classes
// ==========================================

export interface QuestionExtractionOptions {
  model?: "gemini-1.5-flash" | "gpt-4o-mini";
  apiKey?: string;
  maxRetries?: number;
  mockPayload?: unknown;
  fileName?: string;
}

export interface QuestionPaperPageInput {
  pageNumber: number;
  imageBase64?: string;
  dataUrl?: string;
  mimeType?: string;
  extractedText?: string;
}

export class QuestionExtractionError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: "INVALID_INPUT" | "SCHEMA_VALIDATION_ERROR" | "LLM_PROVIDER_ERROR" | "MISSING_API_KEY" | "TIMEOUT",
    details?: unknown
  ) {
    super(message);
    this.name = "QuestionExtractionError";
    this.code = code;
    this.details = details;
  }
}

// ==========================================
// 3. System Prompt & Vision Instructions
// ==========================================

export const QUESTION_EXTRACTION_SYSTEM_PROMPT = `
You are an expert AI exam analyzer and visual OCR parser.
Your task is to extract every printed question and sub-question verbatim from the provided question paper image.

STRICT EXTRACTION RULES:
1. Extract EVERY printed question, multipart sub-question (e.g., 11(a), 11(b), 12(a)), and section item on this page.
2. Read continuously from top (ymin=0) to bottom (ymax=1000). Do not omit or truncate any questions.
3. Treat every sub-clause/part as an independent item.
4. For sub-parts, populate "parent_question_number" (e.g., "11" for "11(a)"). For top-level questions, set "parent_question_number" to null.
5. Extract max_marks allocated if printed in brackets or margins (e.g., "[2 marks]" -> 2). If not specified, default to 2 or 5.
6. Provide a normalized bounding box [ymin, xmin, ymax, xmax] for each question (on 0-1000 coordinate scale).
7. Assign a confidence score between 0.0 and 1.0 for each question.
8. Return ONLY a valid JSON object strictly matching this schema:
{
  "assessment_title": string | null,
  "total_marks": number | null,
  "instructions": string[],
  "questions": [
    {
      "id": string,
      "question_number": string,
      "parent_question_number": string | null,
      "text": string,
      "max_marks": number,
      "page_number": number,
      "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
      "confidence": number
    }
  ]
}
`;

// ==========================================
// 4. Sub-Part & Hierarchy Parser Helper
// ==========================================

export function normalizeSubQuestionHierarchy(
  questions: Array<Omit<ExtractedQuestionItem, "id"> & { id?: string }>
): ExtractedQuestionItem[] {
  return questions.map((q, idx) => {
    let parentNum = q.parent_question_number;
    const rawNumber = q.question_number.trim();

    if (!parentNum) {
      const match = rawNumber.match(
        /(?:Q(?:uestion)?\s*)?(\d+)[\s._-]*\(([a-zA-Z0-9]+)\)|(?:Q(?:uestion)?\s*)?(\d+)[\s._-]+([a-zA-Z0-9]+)|(?:Q(?:uestion)?\s*)?(\d+)([a-zA-Z])/i
      );
      if (match) {
        parentNum = match[1] || match[3] || match[5];
      }
    }

    const id = q.id || `q_${rawNumber.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${idx + 1}`;

    return {
      ...q,
      id,
      parent_question_number: parentNum || null,
    };
  });
}

// ==========================================
// 5. Validation Helper
// ==========================================

export function validateExtractedQuestions(rawPayload: unknown): ExtractedQuestionPaper {
  try {
    const parsed = ExtractedQuestionPaperSchema.parse(rawPayload);
    const questionsWithHierarchy = normalizeSubQuestionHierarchy(parsed.questions);
    const totalMarks =
      parsed.total_marks !== undefined && parsed.total_marks !== null
        ? parsed.total_marks
        : questionsWithHierarchy.reduce((sum, q) => sum + (q.max_marks || 0), 0);

    const maxPage = Math.max(1, ...questionsWithHierarchy.map((q) => q.page_number));

    return {
      assessment_title: parsed.assessment_title !== undefined ? parsed.assessment_title : null,
      total_marks: totalMarks,
      instructions: parsed.instructions || [],
      questions: questionsWithHierarchy,
      metadata: {
        total_questions: questionsWithHierarchy.length,
        page_count: parsed.metadata?.page_count || maxPage,
        extraction_timestamp: parsed.metadata?.extraction_timestamp || new Date().toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new QuestionExtractionError(
        `Question Extraction Failed: Schema validation error - ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
        "SCHEMA_VALIDATION_ERROR",
        error.issues
      );
    }
    throw new QuestionExtractionError(
      `Question Extraction Failed: ${(error as Error).message}`,
      "SCHEMA_VALIDATION_ERROR",
      error
    );
  }
}

/**
 * Extracts all questions and clauses from a single Question Paper page.
 */
async function extractQuestionsFromSinglePage(
  page: QuestionPaperPageInput,
  options: QuestionExtractionOptions = {}
): Promise<ExtractedQuestionItem[]> {
  const groqApiKey = getResolvedGroqApiKey(options.apiKey);
  const geminiApiKey = getResolvedGeminiApiKey(options.apiKey);

  // 1. Text-only path via Groq if digital text is present
  if (groqApiKey && page.extractedText && page.extractedText.trim().length > 30 && !page.dataUrl?.startsWith("data:image/png")) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: QUESTION_EXTRACTION_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Extract all questions from Question Paper Page ${page.pageNumber} text:\n\n${page.extractedText}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.choices?.[0]?.message?.content;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          const validated = validateExtractedQuestions(parsed);
          return validated.questions.map((q, idx) => ({
            ...q,
            id: `q_p${page.pageNumber}_${idx + 1}`,
            page_number: page.pageNumber,
          }));
        }
      }
    } catch {
      // Fallback to Vision
    }
  }

  // 2. Multimodal Vision Path via Gemini
  if (geminiApiKey) {
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
      "gemini-flash-latest",
    ];

    const parts: Array<Record<string, unknown>> = [
      { text: QUESTION_EXTRACTION_SYSTEM_PROMPT },
    ];

    const base64Data = page.imageBase64 || page.dataUrl?.split(",")[1] || "";
    let mime = page.mimeType || "image/png";
    if (page.dataUrl?.startsWith("data:")) {
      const match = page.dataUrl.match(/^data:([^;]+);/);
      if (match) mime = match[1];
    }

    if (mime.startsWith("image/") && !mime.includes("svg") && base64Data.length > 50) {
      parts.push({
        inlineData: {
          mimeType: mime === "image/png" ? "image/png" : "image/jpeg",
          data: base64Data,
        },
      });
    }

    if (page.extractedText && page.extractedText.trim().length > 10) {
      parts.push({
        text: `--- Question Paper Page ${page.pageNumber} Text Content ---\n${page.extractedText}`,
      });
    }

    parts.push({
      text: `Extract every question, multipart sub-clause, and question label on Page ${page.pageNumber}. Return strict JSON.`,
    });

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJsonText) {
            const parsed = JSON.parse(rawJsonText);
            const validated = validateExtractedQuestions(parsed);
            return validated.questions.map((q, idx) => ({
              ...q,
              id: q.id || `q_p${page.pageNumber}_${idx + 1}`,
              page_number: page.pageNumber,
            }));
          }
        }
      } catch {
        // Try next candidate model
      }
    }
  }

  return [];
}

/**
 * Dynamically iterates through every Question Paper page (1...N) and extracts all questions.
 * Flattens all extracted questions into a unified array.
 */
export async function extractQuestionsFromPages(
  pages: QuestionPaperPageInput[],
  options: QuestionExtractionOptions = {}
): Promise<ExtractedQuestionPaper> {
  if (!pages || pages.length === 0) {
    throw new QuestionExtractionError(
      "Question Extraction Failed: No question paper pages provided.",
      "INVALID_INPUT"
    );
  }

  // Allow explicit mockPayload for unit test schema assertions
  if (options.mockPayload) {
    return validateExtractedQuestions(options.mockPayload);
  }

  const groqApiKey = getResolvedGroqApiKey(options.apiKey);
  const geminiApiKey = getResolvedGeminiApiKey(options.apiKey);

  if (!groqApiKey && !geminiApiKey) {
    throw new QuestionExtractionError(
      "Question Extraction Failed: Missing API Key.",
      "MISSING_API_KEY"
    );
  }

  // Process all N pages dynamically in parallel
  const pagePromises = pages.map((page) => extractQuestionsFromSinglePage(page, options));
  const pageQuestionsArrays = await Promise.all(pagePromises);
  const allQuestions = pageQuestionsArrays.flat();

  if (allQuestions.length > 0) {
    const questionsWithHierarchy = normalizeSubQuestionHierarchy(allQuestions);
    const totalMarks = questionsWithHierarchy.reduce((sum, q) => sum + (q.max_marks || 0), 0);

    return {
      assessment_title: null,
      total_marks: totalMarks,
      instructions: [],
      questions: questionsWithHierarchy,
      metadata: {
        total_questions: questionsWithHierarchy.length,
        page_count: pages.length,
        extraction_timestamp: new Date().toISOString(),
      },
    };
  }

  throw new QuestionExtractionError(
    "Question Extraction Failed: No questions could be detected in the provided question paper pages.",
    "LLM_PROVIDER_ERROR"
  );
}

/**
 * Scale-agnostic helper to extract all questions from an array of base64 page images.
 */
export async function extractAllQuestions(
  questionPaperImages: string[],
  options: QuestionExtractionOptions = {}
): Promise<ExtractedQuestionItem[]> {
  const pages: QuestionPaperPageInput[] = questionPaperImages.map((img, idx) => ({
    pageNumber: idx + 1,
    dataUrl: img,
    imageBase64: img.startsWith("data:") ? img.split(",")[1] : img,
    mimeType: img.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png",
  }));

  const res = await extractQuestionsFromPages(pages, options);
  return res.questions;
}

// Clean alias export
export const extractQuestionsFromImages = extractQuestionsFromPages;
