import { z } from "zod";

// ==========================================
// 1. Zod Schemas & Type Definitions
// ==========================================

/**
 * Normalized Bounding Box Schema (0.0 to 1.0 normalized coordinates)
 */
export const AnswerBoundingBoxSchema = z.object({
  xmin: z.number().min(0).max(1),
  ymin: z.number().min(0).max(1),
  xmax: z.number().min(0).max(1),
  ymax: z.number().min(0).max(1),
}).refine((box) => box.xmax >= box.xmin && box.ymax >= box.ymin, {
  message: "Invalid bounding box: xmax must be >= xmin and ymax must be >= ymin",
});

export type AnswerBoundingBox = z.infer<typeof AnswerBoundingBoxSchema>;

/**
 * Individual Handwritten Answer Block Schema
 */
export const HandwrittenAnswerBlockSchema = z.object({
  id: z.string().min(1, "Answer block ID must not be empty"),
  detected_question_label: z.string().nullable(), // e.g., "1", "Q2", "11(a)", "Ans 3", or null if unlabelled
  handwritten_text: z.string().min(1, "Transcribed handwritten text must not be empty"),
  page_number: z.number().int().positive("Page number must be positive (1-indexed)"),
  bounding_box: AnswerBoundingBoxSchema,
  confidence: z.number().min(0).max(1, "Confidence score must be between 0.0 and 1.0"),
  is_scratch_work: z.boolean().optional().default(false),
  diagram_detected: z.boolean().optional().default(false),
});

export type HandwrittenAnswerBlock = z.infer<typeof HandwrittenAnswerBlockSchema>;

/**
 * Answer Sheet Extraction Metadata Schema
 */
export const AnswerExtractionMetadataSchema = z.object({
  total_blocks_detected: z.number().int().nonnegative(),
  page_count: z.number().int().positive(),
  extraction_timestamp: z.string(),
});

export type AnswerExtractionMetadata = z.infer<typeof AnswerExtractionMetadataSchema>;

/**
 * Root Extracted Answer Sheet Schema
 */
export const ExtractedAnswerSheetSchema = z.object({
  student_identifier: z.string().nullable().optional(),
  total_pages_scanned: z.number().int().positive(),
  answers: z.array(HandwrittenAnswerBlockSchema),
  metadata: AnswerExtractionMetadataSchema,
});

export type ExtractedAnswerSheet = z.infer<typeof ExtractedAnswerSheetSchema>;

/**
 * Input Page Image Data Representation
 */
export interface AnswerSheetPageInput {
  pageNumber: number;
  imageBase64?: string;
  dataUrl?: string;
  imageBuffer?: Uint8Array;
  mimeType?: string;
}

export interface AnswerExtractionOptions {
  model?: "gemini-1.5-flash" | "gemini-1.5-pro" | "gpt-4o-mini" | "mock";
  apiKey?: string;
  mockPayload?: unknown;
  includeScratchWork?: boolean;
}

// ==========================================
// 2. Custom Typed Errors
// ==========================================

export class AnswerExtractionError extends Error {
  public code: "INVALID_INPUT" | "SCHEMA_VALIDATION_ERROR" | "LLM_PROVIDER_ERROR";
  public details?: unknown;

  constructor(
    message: string,
    code: "INVALID_INPUT" | "SCHEMA_VALIDATION_ERROR" | "LLM_PROVIDER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "AnswerExtractionError";
    this.code = code;
    this.details = details;
  }
}

// ==========================================
// 3. System Prompt & Instructions
// ==========================================

export const HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT = `
You are an expert OCR and handwritten examination script parser. Your task is to segment and transcribe all handwritten answer blocks from the provided student answer sheet images.

CRITICAL RULES:
1. DO NOT assume answers appear in numerical or printed order. Students frequently write answers out of order (e.g., answering Q3 on page 1, followed by Q1).
2. Segment and extract ALL answer sections on the page.
3. If an answer label is written by the student (e.g., "1", "Q.2", "Ans 3", "11a", "Section B Q1"), extract it into "detected_question_label". If no label is written, set "detected_question_label" to null.
4. Transcribe the full handwritten text faithfully into "handwritten_text". If diagrams/sketches/formulas are present, describe them concisely and set "diagram_detected" to true.
5. If a section is rough calculation or scratch work, flag "is_scratch_work": true.
6. Provide a normalized bounding box for each answer segment on its page:
   - xmin, ymin, xmax, ymax between 0.0 and 1.0.
7. Assign a confidence score between 0.0 and 1.0 for each block.
8. Return ONLY valid JSON adhering strictly to the schema.
`;

// ==========================================
// 4. Validation & Pipeline Functions
// ==========================================

/**
 * Validates and parses raw LLM output against the strict Zod schema
 */
export function validateExtractedAnswers(rawPayload: unknown): ExtractedAnswerSheet {
  try {
    return ExtractedAnswerSheetSchema.parse(rawPayload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AnswerExtractionError(
        `Answer extraction schema validation failed: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
        "SCHEMA_VALIDATION_ERROR",
        error.issues
      );
    }
    throw new AnswerExtractionError(
      "Failed to parse answer extraction output",
      "SCHEMA_VALIDATION_ERROR",
      error
    );
  }
}

/**
 * Executes the full handwritten answer extraction pipeline on answer sheet page images
 */
export async function extractAnswersFromPages(
  pages: AnswerSheetPageInput[],
  options: AnswerExtractionOptions = {}
): Promise<ExtractedAnswerSheet> {
  // 1. Validate Input
  if (!pages || pages.length === 0) {
    throw new AnswerExtractionError(
      "Cannot extract answers: No answer sheet pages provided.",
      "INVALID_INPUT"
    );
  }

  // 2. Return mock payload if provided
  if (options.mockPayload) {
    return validateExtractedAnswers(options.mockPayload);
  }

  // 3. Fallback / Mock Generator if no live API key is supplied
  const apiKey = options.apiKey || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY : undefined);

  if (!apiKey || options.model === "mock") {
    const mockOutput = generateSampleExtractedAnswers(pages.length);
    return validateExtractedAnswers(mockOutput);
  }

  // 4. Live LLM Integration (e.g. Gemini 1.5 Flash via REST)
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: HANDWRITTEN_ANSWER_EXTRACTION_SYSTEM_PROMPT },
                ...pages.map((p) => ({
                  inlineData: {
                    mimeType: p.mimeType || "image/jpeg",
                    data: p.imageBase64 || p.dataUrl?.split(",")[1] || "",
                  },
                })),
                {
                  text: `Segment and extract all handwritten answer blocks from the above ${pages.length} answer sheet page images in strict JSON format.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJsonText) {
      throw new Error("LLM response did not contain text content.");
    }

    const parsedJson = JSON.parse(rawJsonText);
    return validateExtractedAnswers(parsedJson);
  } catch (error) {
    if (error instanceof AnswerExtractionError) {
      throw error;
    }
    throw new AnswerExtractionError(
      `LLM Answer Extraction failed: ${(error as Error).message}`,
      "LLM_PROVIDER_ERROR",
      error
    );
  }
}

/**
 * Deterministic sample payload generator for tests and fallbacks
 * (Demonstrating out-of-order answer ordering and unlabelled/scratch blocks)
 */
export function generateSampleExtractedAnswers(pageCount: number = 4): ExtractedAnswerSheet {
  const sampleAnswers: HandwrittenAnswerBlock[] = [
    // Page 1: Student answered Q1 first, then Q2 with a diagram
    {
      id: "ans_block_1",
      detected_question_label: "Q1",
      handwritten_text: "Photosynthesis is the process used by green plants to convert light energy into chemical energy. 6CO2 + 6H2O -> C6H12O6 + 6O2",
      page_number: 1,
      bounding_box: { xmin: 0.05, ymin: 0.05, xmax: 0.95, ymax: 0.38 },
      confidence: 0.98,
      diagram_detected: true,
      is_scratch_work: false,
    },
    {
      id: "ans_block_2",
      detected_question_label: "Q2",
      handwritten_text: "The process mainly occurs in the chloroplast of the plant cell. It has two main stages: 1. Light reaction (captures light) 2. Dark reaction (makes glucose).",
      page_number: 1,
      bounding_box: { xmin: 0.05, ymin: 0.42, xmax: 0.95, ymax: 0.68 },
      confidence: 0.99,
      diagram_detected: false,
      is_scratch_work: false,
    },
    // Page 1: Unlabelled scratch calculations at bottom
    {
      id: "ans_block_3",
      detected_question_label: null,
      handwritten_text: "Rough: 12 * (0.5 - 0.15) = 12 * 0.35 = 4.2",
      page_number: 1,
      bounding_box: { xmin: 0.6, ymin: 0.85, xmax: 0.95, ymax: 0.98 },
      confidence: 0.91,
      diagram_detected: false,
      is_scratch_work: true,
    },
    // Page 2: Student answered Q4 (out of order, skipping Q3 initially)
    {
      id: "ans_block_4",
      detected_question_label: "Ans 4",
      handwritten_text: "Deoxygenated blood enters the Right Atrium via vena cava -> Right Ventricle -> Pulmonary Artery -> Lungs.",
      page_number: Math.min(2, pageCount),
      bounding_box: { xmin: 0.05, ymin: 0.08, xmax: 0.95, ymax: 0.35 },
      confidence: 0.96,
      diagram_detected: false,
      is_scratch_work: false,
    },
  ];

  return {
    student_identifier: "Student_1",
    total_pages_scanned: pageCount,
    answers: sampleAnswers,
    metadata: {
      total_blocks_detected: sampleAnswers.length,
      page_count: pageCount,
      extraction_timestamp: new Date().toISOString(),
    },
  };
}
