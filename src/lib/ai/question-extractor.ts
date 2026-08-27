import { z } from "zod";

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
Your task is to extract every printed question and sub-question verbatim from the provided question paper images.

STRICT EXTRACTION RULES:
1. Extract EVERY printed question, sub-question, and multi-part clause verbatim in exact printed sequence.
2. Labeled sub-parts (e.g. "11(a)", "11(b)", "Q2.1", "Q2.2") MUST be extracted as separate independent question entries.
3. For sub-parts, populate "parent_question_number" (e.g., "11" for "11(a)"). For top-level questions, set "parent_question_number" to null.
4. Extract max_marks allocated if printed in brackets or margins (e.g., "[2 marks]" -> 2). If not specified, default to 2 or 5.
5. Provide a normalized bounding box [ymin, xmin, ymax, xmax] for each question (on 0-1000 coordinate scale).
6. Assign a confidence score between 0.0 and 1.0 for each question.
7. Return ONLY a valid JSON object strictly matching this schema:
{
  "assessment_title": string,
  "total_marks": number,
  "instructions": string[],
  "questions": [
    {
      "id": string,
      "question_number": string,
      "parent_question_number": string | null,
      "text": string,
      "max_marks": number,
      "page_number": number,
      "bounding_box": { "xmin": number, "ymin": number, "xmax": number, "ymax": number },
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
// 5. Main Extraction Pipeline Function
// ==========================================

export function validateExtractedQuestions(rawPayload: unknown): ExtractedQuestionPaper {
  try {
    const parsed = ExtractedQuestionPaperSchema.parse(rawPayload);
    const questionsWithHierarchy = normalizeSubQuestionHierarchy(parsed.questions);
    const totalMarks =
      parsed.total_marks !== undefined
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
 * Sends question paper page images/text to the LLM (Groq / Gemini / OpenAI)
 * and extracts verbatim questions and normalized bounding boxes.
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

  const groqApiKey =
    typeof process !== "undefined" ? process.env.GROQ_API_KEY : undefined;
  const geminiApiKey =
    options.apiKey ||
    (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
  const openaiApiKey =
    options.apiKey ||
    (typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined);

  if (!groqApiKey && !geminiApiKey && !openaiApiKey) {
    throw new QuestionExtractionError(
      "Question Extraction Failed: Missing API Key. Please set GEMINI_API_KEY or GROQ_API_KEY in your environment.",
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
            { role: "system", content: QUESTION_EXTRACTION_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Extract all questions and structure from this question paper:\n\n${combinedText}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.choices?.[0]?.message?.content;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          return validateExtractedQuestions(parsed);
        }
      }
    } catch (err) {
      console.warn("Groq text extraction fallback to Gemini:", (err as Error).message);
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
    const parts: Array<Record<string, unknown>> = [{ text: QUESTION_EXTRACTION_SYSTEM_PROMPT }];

    for (const p of pages) {
      let pageHasContent = false;

      if (p.extractedText && p.extractedText.trim().length > 10) {
        parts.push({
          text: `--- Question Paper Page ${p.pageNumber} Content ---\n${p.extractedText}`,
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
                text: `--- Question Paper Page ${p.pageNumber} Content ---\n${textMatches}`,
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
          text: `--- Question Paper Page ${p.pageNumber} ---`,
        });
      }
    }

    parts.push({
      text: `Extract all questions from the above ${pages.length} question paper pages in strict JSON format matching the schema.`,
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
              console.warn(`Model ${model} returned ${response.status}, retrying in 1.5s (attempt ${attempts}/${maxAttempts})...`);
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
          return validateExtractedQuestions(parsedJson);
        } catch (error) {
          lastError = error as Error;
          console.warn(`Model ${model} attempt ${attempts} failed:`, (error as Error).message);
          if (attempts >= maxAttempts) break;
        }
      }
    }

    throw new QuestionExtractionError(
      `Question Extraction Failed: ${lastError?.message || "All Gemini vision models failed."}`,
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
          { role: "system", content: QUESTION_EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract all questions from the above ${pages.length} question paper page images in strict JSON format.`,
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
    return validateExtractedQuestions(parsedJson);
  } catch (error) {
    if (error instanceof QuestionExtractionError) {
      throw error;
    }
    throw new QuestionExtractionError(
      `Question Extraction Failed: ${(error as Error).message}`,
      "LLM_PROVIDER_ERROR",
      error
    );
  }
}

export const extractQuestionsFromImages = extractQuestionsFromPages;
