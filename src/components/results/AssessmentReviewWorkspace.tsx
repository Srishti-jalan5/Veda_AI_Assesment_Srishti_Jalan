"use client";

import React, { useState, useEffect } from "react";
import { QuestionPanel } from "./QuestionPanel";
import { AnswerViewer } from "@/components/viewer/AnswerViewer";
import { QuestionItem } from "@/types/assessment";
import { HandwrittenAnswerBlock } from "@/lib/ai/answer-extractor";
import { QuestionMapping } from "@/lib/ai/matcher";
import { ListOrdered, FileText, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentReviewWorkspaceProps {
  questions?: QuestionItem[];
  mappings?: QuestionMapping[];
  unmappedAnswers?: HandwrittenAnswerBlock[];
  pageImages?: string[];
  initialSelectedQuestionId?: string;
  onGoToUpload?: () => void;
}

export const AssessmentReviewWorkspace: React.FC<AssessmentReviewWorkspaceProps> = ({
  questions: propQuestions,
  pageImages,
  initialSelectedQuestionId,
  onGoToUpload,
}) => {
  const activeQuestions = React.useMemo(
    () => propQuestions || [],
    [propQuestions]
  );

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    initialSelectedQuestionId || activeQuestions[0]?.id || ""
  );

  // Synchronize selected question whenever new questions are loaded
  useEffect(() => {
    if (activeQuestions.length > 0) {
      setSelectedQuestionId(activeQuestions[0]?.id || "");
    }
  }, [activeQuestions]);

  // Mobile Top Tab: 'question' vs 'answer'
  const [mobileActiveToggle, setMobileActiveToggle] = useState<"question" | "answer">("question");

  const selectedQuestion =
    activeQuestions.find((q) => q.id === selectedQuestionId) || activeQuestions[0] || null;

  const handleSelectQuestion = (question: QuestionItem) => {
    setSelectedQuestionId(question.id);
  };

  const totalPages =
    pageImages && pageImages.length > 0
      ? pageImages.length
      : Math.max(...activeQuestions.map((q) => q.answerPage || 1), 1);

  // Empty / Unuploaded State Handling
  if (activeQuestions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-[#FF5623] shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "-0.03em",
                color: "#2B2B2B",
              }}
            >
              No Assessment Data Available
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
              Please upload both the Question Paper and Student Answer Sheet PDF to begin evaluation.
            </p>
          </div>
          {onGoToUpload && (
            <button
              onClick={onGoToUpload}
              className="mt-2 bg-[#303030] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-slate-900 active:scale-95 transition-all shadow-xs"
            >
              Upload Documents
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none">
      {/* Mobile Top Segmented Control */}
      <div className="lg:hidden px-3 py-2 bg-white/80 backdrop-blur-xs border-b border-slate-200 shrink-0">
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setMobileActiveToggle("question")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              mobileActiveToggle === "question"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Questions ({activeQuestions.length})</span>
          </button>

          <button
            onClick={() => setMobileActiveToggle("answer")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              mobileActiveToggle === "answer"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Answer Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Split-View Workspace (Left: QuestionPanel 480px, Right: AnswerViewer) */}
      <div className="flex-1 flex flex-row overflow-hidden p-1.5 gap-1.5">
        {/* Left Side: Question List & Rubric Panel */}
        <div
          className={cn(
            "w-full lg:w-[480px] h-full shrink-0 flex flex-col",
            mobileActiveToggle === "answer" ? "hidden lg:flex" : "flex"
          )}
        >
          <QuestionPanel
            questions={activeQuestions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={handleSelectQuestion}
          />
        </div>

        {/* Right Side: Interactive Answer Sheet Document Viewer with Highlights */}
        <div
          className={cn(
            "flex-1 h-full min-w-0 flex flex-col",
            mobileActiveToggle === "question" ? "hidden lg:flex" : "flex"
          )}
        >
          <AnswerViewer
            selectedQuestion={selectedQuestion}
            pageImages={pageImages}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
};
