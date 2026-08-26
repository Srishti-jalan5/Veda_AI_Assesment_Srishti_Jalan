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
  answerPage: number;
  boundingBox: BoundingBox;
}

export interface UploadedFile {
  id: string;
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  pages: number;
  type: "question_paper" | "answer_sheet";
  uploadDate: string;
}
