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
          height: "30px",
          borderRadius: "100px",
          padding: "4px 12px",
          gap: "4px",
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
            fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            lineHeight: "140%",
            letterSpacing: "-0.04em",
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
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "20px",
        padding: "16px",
        gap: "16px",
        boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.02)",
      }}
      className="relative w-full h-full flex flex-col overflow-hidden select-none border border-black/5"
    >
      {/* Floating Scroll Indicator Handle Pill (Figma: Primary Button - White / Scroll Bar Handle) */}
      <div
        style={{
          position: "absolute",
          right: "-6px",
          top: "42%",
          width: "12px",
          height: "58px",
          background: "rgba(255, 255, 255, 0.85)",
          boxShadow: "0px 4px 22.5px rgba(0, 0, 0, 0.25)",
          borderRadius: "48px",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          zIndex: 20,
        }}
        className="hidden lg:flex pointer-events-none"
      />

      {/* Frame 1984077861: Width 672px (fluid), Background rgba(255, 255, 255, 0.5), Radius 20px, Padding 16px, Gap 16px */}
      {/* Frame 1984078209: Header Bar (Height: 44px, Gap: 16px) */}
      <div className="w-full h-[44px] flex items-center justify-between shrink-0">
        {/* Extracted Questions Title (Font: 16px, 700 bold, line-height: 140%, -0.04em, #303030) */}
        <h2
          style={{
            fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            lineHeight: "140%",
            letterSpacing: "-0.04em",
            color: "#303030",
          }}
        >
          Extracted Questions (from question paper)
        </h2>

        {/* Primary Button - White (Width: 101px, Height: 44px, Padding: 12px 20px 12px 16px, Radius: 64px) */}
        <button
          onClick={handleToggleExpandAll}
          style={{
            height: "44px",
            minWidth: "101px",
            background: "#FFFFFF",
            borderRadius: "64px",
            padding: "12px 20px 12px 16px",
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
          }}
          className="flex items-center justify-center border border-black/5 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span
            style={{
              fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "140%",
              letterSpacing: "-0.04em",
              color: "#181818",
            }}
          >
            {isAllExpanded ? "Collapse All" : "Expand All"}
          </span>
        </button>
      </div>

      {/* Scrollable Questions Column */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {questions.map((q) => {
          const isSelected = q.id === selectedQuestionId;
          const isExpanded = expandedMap[q.id] || isSelected;

          return (
            <div
              key={q.id}
              onClick={() => handleCardClick(q)}
              style={{
                borderRadius: "16px",
                padding: "12px",
                gap: "12px",
                background: "#FFFFFF",
              }}
              className={cn(
                "w-full transition-all cursor-pointer select-none text-left flex flex-col shadow-xs",
                isSelected
                  ? "border-2 border-[#FF8D36]"
                  : "border border-slate-200/60 hover:border-slate-300"
              )}
            >
              {/* Question Row Header (Frame 1618872464) */}
              <div className="flex items-center justify-between gap-3 w-full">
                {/* Left: Number badge + Question Text */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Frame 1618872464: Circular Number Badge (32px × 32px, Radius: 100px) */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "100px",
                      background: isSelected ? "#FF5623" : "rgba(43, 43, 43, 0.8)",
                      border: "2px solid rgba(255, 255, 255, 0.25)",
                      boxShadow: isSelected
                        ? "0px 8px 8.8px rgba(255, 121, 80, 0.1)"
                        : "0px 8px 8.8px rgba(134, 134, 134, 0.1), 0px 4px 16px rgba(67, 67, 67, 0.1)",
                    }}
                    className="flex items-center justify-center text-white shrink-0"
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                        fontWeight: 800,
                        fontSize: "20px",
                        lineHeight: "24px",
                        letterSpacing: "-0.04em",
                        color: "#FFFFFF",
                      }}
                    >
                      {q.questionNumber}
                    </span>
                  </div>

                  {/* Frame 1984077331: Sub-label for parts like a. / b. */}
                  {q.subLabel && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "#F6F6F6",
                        borderRadius: "100px",
                        padding: "4px 9px",
                      }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                          fontWeight: 700,
                          fontSize: "16px",
                          lineHeight: "140%",
                          letterSpacing: "-0.04em",
                          color: "#303030",
                        }}
                      >
                        {q.subLabel}
                      </span>
                    </div>
                  )}

                  {/* Question Text (16px, 400 regular, line-height 140%, -0.04em, #303030) */}
                  <p
                    style={{
                      fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "140%",
                      letterSpacing: "-0.04em",
                      color: "#303030",
                    }}
                    className="flex-1 line-clamp-3"
                  >
                    {q.questionText}
                  </p>
                </div>

                {/* Right: Score pill + Chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  {renderScoreBadge(q.awardedMarks, q.maxMarks)}

                  {/* Chevron Button (28px × 28px, Background #F6F6F6, Radius 8px) */}
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "#F6F6F6",
                      borderRadius: "8px",
                      padding: "4px",
                    }}
                    className="flex items-center justify-center text-[#1E1E1E]"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#1E1E1E]" strokeWidth={1.8} />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#1E1E1E]" strokeWidth={1.8} />
                    )}
                  </div>
                </div>
              </div>

              {/* AI Feedback & Grading Card (Expanded State) */}
              {isExpanded && (
                <div className="mt-1 animate-in fade-in zoom-in-95 duration-150">
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
