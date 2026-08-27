"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { QuestionItem } from "@/types/assessment";
import { GradePanel } from "@/components/grading/GradePanel";
import { cn } from "@/lib/utils";

interface QuestionPanelProps {
  questions: QuestionItem[];
  selectedQuestionId: string;
  onSelectQuestion: (question: QuestionItem) => void;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  questions,
  selectedQuestionId,
  onSelectQuestion,
}) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({
    [selectedQuestionId || "q-2"]: true,
  });

  const isAllExpanded = questions.every((q) => expandedMap[q.id]);

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedMap({ [selectedQuestionId]: true });
    } else {
      const all: Record<string, boolean> = {};
      questions.forEach((q) => (all[q.id] = true));
      setExpandedMap(all);
    }
  };

  const handleCardClick = (question: QuestionItem) => {
    onSelectQuestion(question);
    setExpandedMap((prev) => ({
      ...prev,
      [question.id]: !prev[question.id],
    }));
  };

  const renderScoreBadge = (awarded: number, max: number) => {
    const isZero = awarded === 0;
    const isFull = awarded === max;

    return (
      <div
        style={{
          borderRadius: "4px",
          padding: "3px 8px",
        }}
        className={cn(
          "flex items-center justify-center shrink-0 select-none",
          isZero
            ? "bg-[#FFE9E2] text-[#C0350A]"
            : isFull
            ? "bg-[rgba(69,181,41,0.1)] text-[#34AC15]"
            : "bg-[rgba(255,153,0,0.1)] text-[#E3600F]"
        )}
      >
        <span
          style={{
            fontFamily: "var(--font-bricolage), sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            lineHeight: "140%",
            letterSpacing: "-0.03em",
          }}
        >
          {awarded} / {max}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.5)",
        borderRadius: "6px",
        padding: "12px",
      }}
      className="w-full h-full flex flex-col gap-[10px] overflow-hidden select-none border border-white/60 shadow-xs"
    >
      {/* Top Header Bar */}
      <div className="w-full h-[38px] flex items-center justify-between shrink-0 px-1">
        {/* Extracted Questions Title */}
        <h2
          style={{
            fontFamily: "var(--font-bricolage), sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            lineHeight: "140%",
            letterSpacing: "-0.03em",
            color: "#303030",
          }}
        >
          Extracted Questions (from question paper)
        </h2>

        {/* Primary Button - White */}
        <button
          onClick={handleToggleExpandAll}
          style={{
            height: "32px",
            background: "#FFFFFF",
            borderRadius: "5px",
            padding: "0px 12px",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.06)",
          }}
          className="flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
        >
          <span
            style={{
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 500,
              fontSize: "13px",
              lineHeight: "140%",
              letterSpacing: "-0.03em",
              color: "#181818",
            }}
          >
            {isAllExpanded ? "Collapse All" : "Expand All"}
          </span>
        </button>
      </div>

      {/* Scrollable Questions Column */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-[8px]">
        {questions.map((q) => {
          const isSelected = q.id === selectedQuestionId;
          const isExpanded = expandedMap[q.id] || isSelected;

          return (
            <div
              key={q.id}
              onClick={() => handleCardClick(q)}
              style={{
                borderRadius: "6px",
                padding: "10px 12px",
                gap: "10px",
              }}
              className={cn(
                "w-full bg-white transition-all cursor-pointer select-none text-left flex flex-col shadow-xs",
                isSelected
                  ? "border-2 border-[#FF8D36]"
                  : "border border-slate-100 hover:border-slate-200"
              )}
            >
              {/* Question Row Header */}
              <div className="flex items-center justify-between gap-[12px] w-full">
                {/* Left: Number badge + Question Text */}
                <div className="flex items-center gap-[10px] flex-1 min-w-0">
                  {/* Number Badge */}
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "5px",
                      background: isSelected
                        ? "#FF5623"
                        : "rgba(43, 43, 43, 0.8)",
                      border: "1.5px solid rgba(255, 255, 255, 0.25)",
                    }}
                    className="flex items-center justify-center text-white font-extrabold text-[15px] shrink-0"
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-bricolage), sans-serif",
                        fontWeight: 800,
                        fontSize: "15px",
                      }}
                    >
                      {q.questionNumber}
                    </span>
                  </div>

                  {/* Sub-label for parts like 11a / 11b */}
                  {q.subLabel && (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        background: "#F6F6F6",
                        borderRadius: "5px",
                      }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-bricolage), sans-serif",
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "#303030",
                        }}
                      >
                        {q.subLabel}
                      </span>
                    </div>
                  )}

                  {/* Question Text */}
                  <p
                    style={{
                      fontFamily: "var(--font-bricolage), sans-serif",
                      fontWeight: 400,
                      fontSize: "14.5px",
                      lineHeight: "135%",
                      letterSpacing: "-0.03em",
                      color: "#303030",
                    }}
                    className="flex-1 line-clamp-2"
                  >
                    {q.questionText}
                  </p>
                </div>

                {/* Right: Score pill + Chevron */}
                <div className="flex items-center gap-[10px] shrink-0">
                  {renderScoreBadge(q.awardedMarks, q.maxMarks)}

                  {/* Chevron Square */}
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "#F6F6F6",
                      borderRadius: "6px",
                    }}
                    className="flex items-center justify-center text-[#1E1E1E]"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-[15px] h-[15px]" strokeWidth={2} />
                    ) : (
                      <ChevronDown className="w-[15px] h-[15px]" strokeWidth={2} />
                    )}
                  </div>
                </div>
              </div>

              {/* AI Feedback & Grading Card (Expanded State) */}
              {isExpanded && (
                <div className="mt-2 animate-in fade-in zoom-in-95 duration-150">
                  <GradePanel
                    maxMarks={q.maxMarks}
                    awardedMarks={q.awardedMarks}
                    aiFeedback={q.aiFeedback}
                    status={q.status || (q.awardedMarks === q.maxMarks ? "matched" : q.awardedMarks > 0 ? "uncertain" : "unanswered")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
