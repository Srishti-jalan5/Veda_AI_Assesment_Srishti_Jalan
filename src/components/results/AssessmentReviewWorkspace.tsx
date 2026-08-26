"use client";

import React, { useState } from "react";
import { QuestionPanel } from "./QuestionPanel";
import { AnswerSheetViewer } from "./AnswerSheetViewer";
import { REFERENCE_QUESTIONS } from "@/lib/mockData";
import { QuestionItem } from "@/types/assessment";
import { ListOrdered, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentReviewWorkspaceProps {
  initialSelectedQuestionId?: string;
}

export const AssessmentReviewWorkspace: React.FC<AssessmentReviewWorkspaceProps> = ({
  initialSelectedQuestionId = "q-2",
}) => {
  const [questions] = useState<QuestionItem[]>(REFERENCE_QUESTIONS);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    initialSelectedQuestionId
  );

  // Phone Frame State: 'question_toggle' vs 'answer_toggle'
  const [mobileActiveToggle, setMobileActiveToggle] = useState<"question" | "answer">("question");

  const selectedQuestion =
    questions.find((q) => q.id === selectedQuestionId) || questions[1] || questions[0];

  const handleSelectQuestion = (question: QuestionItem) => {
    setSelectedQuestionId(question.id);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none">
      {/* Mobile Top Segmented Control (Phone Frames: Question Toggle vs Answer Toggle) */}
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
            <span>Questions ({questions.length})</span>
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
            <span>Answer Sheet (Q{selectedQuestion.questionNumber})</span>
          </button>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 flex flex-col lg:flex-row gap-3 md:gap-4 overflow-hidden">
        {/* Left Column: Extracted Questions List Panel (~42% on desktop, visible on phone when question toggle is active) */}
        <div
          className={cn(
            "w-full lg:w-[42%] xl:w-[40%] h-full shrink-0 overflow-hidden",
            mobileActiveToggle === "question" ? "flex" : "hidden lg:flex"
          )}
        >
          <QuestionPanel
            questions={questions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={handleSelectQuestion}
          />
        </div>

        {/* Right Column: Large Student Answer Sheet Viewer (~58% on desktop, visible on phone when answer toggle is active) */}
        <div
          className={cn(
            "w-full lg:w-[58%] xl:w-[60%] h-full flex-1 overflow-hidden",
            mobileActiveToggle === "answer" ? "flex" : "hidden lg:flex"
          )}
        >
          <AnswerSheetViewer selectedQuestion={selectedQuestion} />
        </div>
      </div>
    </div>
  );
};
