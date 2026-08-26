/**
 * Core type declarations for AI Assessment Analysis platform
 */

export interface AssessmentMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  status: "draft" | "submitted" | "evaluating" | "completed";
}

export interface AnalysisScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface AssessmentAnalysisResult {
  assessmentId: string;
  overallScore: number;
  maxPossibleScore: number;
  summary: string;
  breakdown: AnalysisScore[];
  strengths: string[];
  areasForImprovement: string[];
  generatedAt: string;
}
