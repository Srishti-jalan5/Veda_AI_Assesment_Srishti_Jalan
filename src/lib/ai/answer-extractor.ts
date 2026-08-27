import { z } from "zod";
import { getResolvedGroqApiKey, getResolvedGeminiApiKey } from "./api-keys";

// ==========================================
// 1. Zod Schemas & Type Definitions
// ==========================================

export const AnswerBoundingBoxSchema = z
  .object({
    xmin: z.number().min(0).max(1000),
    ymin: z.number().min(0).max(1000),
    xmax: z.number().min(0).max(1000),
    ymax: z.number().min(0).max(1000),
  })
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

export type AnswerBoundingBox = z.infer<typeof AnswerBoundingBoxSchema>;

export const HandwrittenAnswerBlockSchema = z.object({
  id: z.string().min(1, "Answer block ID must not be empty"),
  detected_question_label: z.string().nullable().optional(),
  handwritten_text: z.string().min(1, "Transcribed handwritten text must not be empty"),
  page_number: z.number().int().positive("Page number must be positive (1-indexed)"),
  bounding_box: AnswerBoundingBoxSchema,
  confidence: z.number().min(0).max(1).optional().default(0.95),
  is_scratch_work: z.boolean().optional().default(false),
  diagram_detected: z.boolean().optional().default(false),
});

export type HandwrittenAnswerBlock = z.infer<typeof HandwrittenAnswerBlockSchema>;

export const AnswerExtractionMetadataSchema = z.object({
  total_blocks_detected: z.number().int().nonnegative(),
  page_count: z.number().int().positive(),
  extraction_timestamp: z.string(),
});

export type AnswerExtractionMetadata = z.infer<typeof AnswerExtractionMetadataSchema>;

export const ExtractedAnswerSheetSchema = z.object({
  student_identifier: z.string().nullable().optional().default(null),
  total_pages_scanned: z.number().int().positive().optional(),
  answers: z.array(HandwrittenAnswerBlockSchema),
  metadata: AnswerExtractionMetadataSchema.optional(),
});

export type ExtractedAnswerSheet = z.infer<typeof ExtractedAnswerSheetSchema>;

// ==========================================
// 2. Options & Error Classes
// ==========================================

export interface AnswerExtractionOptions {
  model?: "gemini-1.5-flash" | "gpt-4o-mini";
  apiKey?: string;
  maxRetries?: number;
  mockPayload?: unknown;
  fileName?: string;
}

export interface AnswerSheetPageInput {
  pageNumber: number;
  imageBase64?: string;
  dataUrl?: string;
  mimeType?: string;
  extractedText?: string;
}

export class AnswerExtractionError extends Error {
  public code: "INVALID_INPUT" | "SCHEMA_VALIDATION_ERROR" | "LLM_PROVIDER_ERROR" | "MISSING_API_KEY";
  public details?: unknown;

  constructor(
    message: string,
    code: "INVALID_INPUT" | "SCHEMA_VALIDATION_ERROR" | "LLM_PROVIDER_ERROR" | "MISSING_API_KEY",
    details?: unknown
  ) {
    super(message);
    this.name = "AnswerExtractionError";
    this.code = code;
    this.details = details;
  }
}

// ==========================================
// 3. System Prompt & Strict Vision Instructions
// ==========================================

export const HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT = `
You are an expert handwritten examination OCR analyzer and visual document parser.
Analyze this page of the student answer sheet and extract EVERY discrete student answer block.

Strict Bounding Box Instructions:
1. Bounding box coordinates must be normalized integers [0-1000] for [ymin, xmin, ymax, xmax].
2. ymin must align EXACTLY with the top of the written label (e.g., 'Ans 8.', 'Ans 2.', '11(a)', 'Q.1').
3. ymax must align EXACTLY with the baseline of the LAST sentence belonging to THAT answer.
4. DO NOT extend ymax into the next answer's header ('Ans 7.') or bottom page margins.
5. DO NOT enclose student headers, names, roll numbers, or unrelated text.
6. xmin and xmax should tightly wrap the horizontal line width of the written text.
7. If an answer starts on this page and continues, transcribe this page's segment.
8. If an answer is scratch calculation, flag "is_scratch_work": true.

Return strict JSON:
{
  "student_identifier": string | null,
  "answers": [
    {
      "id": string,
      "detected_question_label": string | null,
      "handwritten_text": string,
      "page_number": number,
      "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
      "confidence": number,
      "is_scratch_work": boolean,
      "diagram_detected": boolean
    }
  ]
}
`;

// ==========================================
// 4. Validation Helper
// ==========================================

export function validateExtractedAnswers(rawPayload: unknown): ExtractedAnswerSheet {
  try {
    const parsed = ExtractedAnswerSheetSchema.parse(rawPayload);
    const maxPage = Math.max(1, ...parsed.answers.map((a) => a.page_number));

    return {
      student_identifier: parsed.student_identifier || null,
      total_pages_scanned: parsed.total_pages_scanned || maxPage,
      answers: parsed.answers,
      metadata: {
        total_blocks_detected: parsed.answers.length,
        page_count: parsed.metadata?.page_count || maxPage,
        extraction_timestamp: parsed.metadata?.extraction_timestamp || new Date().toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AnswerExtractionError(
        `Answer Extraction Failed: Schema validation error - ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
        "SCHEMA_VALIDATION_ERROR",
        error.issues
      );
    }
    throw new AnswerExtractionError(
      `Answer Extraction Failed: ${(error as Error).message}`,
      "SCHEMA_VALIDATION_ERROR",
      error
    );
  }
}

/**
 * Extracts discrete handwritten answer blocks from a single page with tight bounding box isolation.
 */
async function extractAnswersFromSinglePage(
  page: AnswerSheetPageInput,
  options: AnswerExtractionOptions = {}
): Promise<HandwrittenAnswerBlock[]> {
  const groqApiKey = getResolvedGroqApiKey(options.apiKey);
  const geminiApiKey = getResolvedGeminiApiKey(options.apiKey);

  // 1. Text-only path via Groq if digital text exists and no image available
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
            { role: "system", content: HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Extract all student answers from Page ${page.pageNumber} text:\n\n${page.extractedText}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.choices?.[0]?.message?.content;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          const validated = validateExtractedAnswers(parsed);
          return validated.answers.map((a, idx) => ({
            ...a,
            id: `ans_p${page.pageNumber}_${idx + 1}`,
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
      { text: HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT },
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
        text: `--- Page ${page.pageNumber} Extracted Text Context ---\n${page.extractedText}`,
      });
    }

    parts.push({
      text: `Extract every discrete answer block from this student answer sheet Page ${page.pageNumber}. Return strict JSON.`,
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
            const validated = validateExtractedAnswers(parsed);
            return validated.answers.map((a, idx) => ({
              ...a,
              id: a.id || `ans_p${page.pageNumber}_${idx + 1}`,
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
 * Dynamically iterates through every page image (1...N) and extracts tight bounding boxes per answer block.
 * Flattens all extracted answers into a single unified array.
 */
export async function extractAnswersFromPages(
  pages: AnswerSheetPageInput[],
  options: AnswerExtractionOptions = {}
): Promise<ExtractedAnswerSheet> {
  if (!pages || pages.length === 0) {
    throw new AnswerExtractionError(
      "Answer Extraction Failed: No answer sheet pages provided.",
      "INVALID_INPUT"
    );
  }

  // Allow explicit mockPayload for unit test schema assertions
  if (options.mockPayload) {
    return validateExtractedAnswers(options.mockPayload);
  }

  const groqApiKey = getResolvedGroqApiKey(options.apiKey);
  const geminiApiKey = getResolvedGeminiApiKey(options.apiKey);

  if (!groqApiKey && !geminiApiKey) {
    throw new AnswerExtractionError(
      "Answer Extraction Failed: Missing API Key.",
      "MISSING_API_KEY"
    );
  }

  // Process all N pages dynamically in parallel
  const pagePromises = pages.map((page) => extractAnswersFromSinglePage(page, options));
  const pageBlockArrays = await Promise.all(pagePromises);
  const allAnswers = pageBlockArrays.flat();

  // If extraction yielded answers, return validated result
  if (allAnswers.length > 0) {
    return {
      student_identifier: null,
      total_pages_scanned: pages.length,
      answers: allAnswers,
      metadata: {
        total_blocks_detected: allAnswers.length,
        page_count: pages.length,
        extraction_timestamp: new Date().toISOString(),
      },
    };
  }

  throw new AnswerExtractionError(
    "Answer Extraction Failed: No answers could be detected in the provided document pages.",
    "LLM_PROVIDER_ERROR"
  );
}

// Clean alias export
export const extractAnswersFromImages = extractAnswersFromPages;
