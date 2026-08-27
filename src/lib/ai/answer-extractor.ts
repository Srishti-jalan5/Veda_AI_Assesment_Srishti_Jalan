import { z } from "zod";

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
// 3. System Prompt & Vision Instructions
// ==========================================

export const HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT = `
You are an expert handwritten examination OCR analyzer and transcription model.
Your task is to transcribe all handwritten answers from the provided student answer sheet images.

CRITICAL EXTRACTION RULES:
1. Students may answer questions out of sequence (e.g. Q3 on page 1, followed by Q1).
2. Segment and extract ALL answer sections on each page.
3. If an answer label is written by the student (e.g., "1", "Q.2", "Ans 3", "11a", "Section B Q1"), extract it into "detected_question_label". If no label is written, set "detected_question_label" to null.
4. Transcribe the full handwritten text faithfully into "handwritten_text". If diagrams/formulas are present, describe them concisely and set "diagram_detected" to true.
5. If a section is rough calculation or scratch work, flag "is_scratch_work": true.
6. Provide a normalized bounding box [ymin, xmin, ymax, xmax] (on a 0-1000 coordinate scale) enclosing each answer segment.
7. Assign a confidence score between 0.0 and 1.0 for each block.
8. Return ONLY valid JSON adhering strictly to this schema:
{
  "student_identifier": string | null,
  "answers": [
    {
      "id": string,
      "detected_question_label": string | null,
      "handwritten_text": string,
      "page_number": number,
      "bounding_box": { "xmin": number, "ymin": number, "xmax": number, "ymax": number },
      "confidence": number,
      "is_scratch_work": boolean,
      "diagram_detected": boolean
    }
  ]
}
`;

// ==========================================
// 4. Validation & Pipeline Functions
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
 * Sends student answer sheet page images/text to the LLM (Groq / Gemini / OpenAI)
 * and extracts transcribed handwriting, question labels, and normalized bounding boxes.
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

  const groqApiKey =
    typeof process !== "undefined" ? process.env.GROQ_API_KEY : undefined;
  const geminiApiKey =
    options.apiKey ||
    (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
  const openaiApiKey =
    options.apiKey ||
    (typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined);

  if (!groqApiKey && !geminiApiKey && !openaiApiKey) {
    throw new AnswerExtractionError(
      "Answer Extraction Failed: Missing API Key. Please set GEMINI_API_KEY or GROQ_API_KEY in your environment.",
      "MISSING_API_KEY"
    );
  }

  // Has extracted text from PDF
  const combinedText = pages
    .map((p) => p.extractedText?.trim())
    .filter(Boolean)
    .join("\n\n");

  // 1. If Groq API Key is available and we have extracted text from PDF, use fast Groq inference
  if (groqApiKey && combinedText.length > 20) {
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
              content: `Segment and extract all student answers from this text:\n\n${combinedText}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.choices?.[0]?.message?.content;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          return validateExtractedAnswers(parsed);
        }
      }
    } catch (err) {
      console.warn("Groq answer extraction fallback to Gemini:", (err as Error).message);
    }
  }

  // 2. If Gemini API Key is available (Multimodal Vision / Text)
  if (geminiApiKey) {
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-3-flash-preview",
      "gemini-pro-latest",
      "gemini-3.1-pro-preview",
    ];

    let lastError: Error | null = null;

    // Build Gemini contents parts
    const parts: Array<Record<string, unknown>> = [{ text: HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT }];

    for (const p of pages) {
      let pageHasContent = false;

      if (p.extractedText && p.extractedText.trim().length > 10) {
        parts.push({
          text: `--- Student Answer Sheet Page ${p.pageNumber} Content ---\n${p.extractedText}`,
        });
        pageHasContent = true;
      } else {
        const base64Data = p.imageBase64 || p.dataUrl?.split(",")[1] || "";
        let mime = p.mimeType || "image/jpeg";
        if (p.dataUrl?.startsWith("data:")) {
          const match = p.dataUrl.match(/^data:([^;]+);/);
          if (match) mime = match[1];
        }

        // 1. If real binary raster image (JPEG/PNG/WebP), send as inlineData
        if (mime.startsWith("image/") && !mime.includes("svg") && base64Data.length > 50) {
          parts.push({
            inlineData: {
              mimeType: mime === "image/png" ? "image/png" : "image/jpeg",
              data: base64Data,
            },
          });
          pageHasContent = true;
        } else if (mime.includes("svg") && base64Data.length > 0) {
          // 2. If SVG, extract text tags
          try {
            const decodedSvg = Buffer.from(base64Data, "base64").toString("utf-8");
            const textMatches = Array.from(decodedSvg.matchAll(/<text[^>]*>([^<]+)<\/text>/g))
              .map((m) => m[1])
              .join(" ");
            if (textMatches.trim().length > 0) {
              parts.push({
                text: `--- Student Answer Sheet Page ${p.pageNumber} Content ---\n${textMatches}`,
              });
              pageHasContent = true;
            }
          } catch {
            // Continue
          }
        }
      }

      if (!pageHasContent) {
        parts.push({
          text: `--- Student Answer Sheet Page ${p.pageNumber} ---`,
        });
      }
    }

    parts.push({
      text: `Segment and extract all answer blocks from the above ${pages.length} answer sheet pages in strict JSON format.`,
    });

    for (const model of candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
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

          if (!response.ok) {
            const errText = await response.text();
            if ((response.status === 503 || response.status === 429) && attempts < maxAttempts) {
              console.warn(`Answer extractor model ${model} returned ${response.status}, retrying in 1.5s (attempt ${attempts}/${maxAttempts})...`);
              await new Promise((resolve) => setTimeout(resolve, 1500));
              continue;
            }
            throw new Error(`LLM API returned HTTP ${response.status}: ${errText}`);
          }

          const data = await response.json();
          const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawJsonText) {
            throw new Error("LLM response did not contain text content.");
          }

          const parsedJson = JSON.parse(rawJsonText);
          return validateExtractedAnswers(parsedJson);
        } catch (error) {
          lastError = error as Error;
          console.warn(`Answer extractor model ${model} attempt ${attempts} failed:`, (error as Error).message);
          if (attempts >= maxAttempts) break;
        }
      }
    }

    throw new AnswerExtractionError(
      `Answer Extraction Failed: ${lastError?.message || "All Gemini vision models failed."}`,
      "LLM_PROVIDER_ERROR",
      lastError
    );
  }

  // 2. If OpenAI API Key is available (GPT-4o-mini Vision)
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Segment and extract all handwritten answer blocks from the above ${pages.length} answer sheet page images in strict JSON format.`,
              },
              ...pages.map((p) => ({
                type: "image_url",
                image_url: {
                  url: p.dataUrl || `data:image/png;base64,${p.imageBase64}`,
                },
              })),
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Vision API returned HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawJsonText = data.choices?.[0]?.message?.content;
    if (!rawJsonText) {
      throw new Error("OpenAI Vision response did not contain text content.");
    }

    const parsedJson = JSON.parse(rawJsonText);
    return validateExtractedAnswers(parsedJson);
  } catch (error) {
    if (error instanceof AnswerExtractionError) {
      throw error;
    }
    throw new AnswerExtractionError(
      `Answer Extraction Failed: ${(error as Error).message}`,
      "LLM_PROVIDER_ERROR",
      error
    );
  }
}

export const extractAnswersFromImages = extractAnswersFromPages;
