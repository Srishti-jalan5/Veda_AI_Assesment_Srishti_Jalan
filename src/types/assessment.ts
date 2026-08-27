import { ExtractedQuestionItem } from "@/lib/ai/question-extractor";
import { HandwrittenAnswerBlock } from "@/lib/ai/answer-extractor";
import { QuestionMapping, MappingSummary } from "@/lib/ai/matcher";

export interface BoundingBox {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  label: string;
  page: number;
}

export interface QuestionItem {
  id: string;
  questionNumber: number;
  subLabel?: string;
  questionText: string;
  maxMarks: number;
  awardedMarks: number;
  aiFeedback: string;
  answerPage?: number;
  boundingBox?: BoundingBox;
  status?: "matched" | "uncertain" | "unanswered";
  confidence?: number;
  matchedAnswerIds?: string[];
  handwrittenText?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  pages: number;
  type: "question_paper" | "answer_sheet";
  uploadDate: string;
  fileBlob?: File | Blob;
}

export interface AssessmentProcessResponse {
  success: boolean;
  questions: QuestionItem[];
  rawQuestions?: ExtractedQuestionItem[];
  answers: HandwrittenAnswerBlock[];
  mappings: QuestionMapping[];
  unmapped_answers: HandwrittenAnswerBlock[];
  page_images: {
    question_paper: string[];
    answer_sheet: string[];
  };
  summary: MappingSummary;
  overall_confidence: number;
}
