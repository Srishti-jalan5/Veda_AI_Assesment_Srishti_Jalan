"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Sparkles, Edit3 } from "lucide-react";
import { GradeResult } from "@/lib/ai/grader";
import { cn } from "@/lib/utils";

export interface GradePanelProps {
  grade?: GradeResult | null;
  maxMarks?: number;
  awardedMarks?: number;
  aiFeedback?: string;
  keyMissingPoints?: string[];
  status?: "matched" | "uncertain" | "unanswered";
  onTeacherOverride?: (newMarks: number, note: string) => void;
  className?: string;
}

export const GradePanel: React.FC<GradePanelProps> = ({
  grade,
  maxMarks = 5,
  awardedMarks: propAwarded,
  aiFeedback: propFeedback,
  keyMissingPoints: propMissing,
  status = "matched",
  onTeacherOverride,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const effectiveMax = grade?.max_marks ?? maxMarks;
  const effectiveAwarded = grade?.awarded_marks ?? propAwarded ?? (status === "matched" ? effectiveMax : status === "uncertain" ? Math.floor(effectiveMax * 0.7) : 0);
  const effectiveFeedback = grade?.feedback || propFeedback || "No feedback available.";
  const effectiveMissing = grade?.key_missing_points || propMissing || [];

  const [overrideMarks, setOverrideMarks] = useState<number>(effectiveAwarded);
  const [teacherNote, setTeacherNote] = useState<string>("");

  const isFullMarks = effectiveAwarded >= effectiveMax;
  const isZeroMarks = effectiveAwarded === 0;

  const handleSaveOverride = () => {
    onTeacherOverride?.(overrideMarks, teacherNote);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "6px",
        border: "1px solid rgba(0, 0, 0, 0.08)",
      }}
      className={cn("w-full overflow-hidden shadow-2xs select-none transition-all", className)}
    >
      {/* Top Header Card */}
      <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
        {/* Left: Score Badge & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Status Icon */}
          {isFullMarks ? (
            <div className="w-6 h-6 rounded-xs bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          ) : isZeroMarks ? (
            <div className="w-6 h-6 rounded-xs bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-xs bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Score Badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  letterSpacing: "-0.03em",
                }}
                className={cn(
                  isFullMarks
                    ? "text-emerald-700"
                    : isZeroMarks
                    ? "text-red-700"
                    : "text-amber-700"
                )}
              >
                {effectiveAwarded} / {effectiveMax} Marks
              </span>

              {/* Pill percentage */}
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-xs text-[10px] font-bold uppercase tracking-wider",
                  isFullMarks
                    ? "bg-emerald-100 text-emerald-700"
                    : isZeroMarks
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {Math.round((effectiveAwarded / effectiveMax) * 100)}%
              </span>
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              {status === "matched"
                ? "Verified AI Evaluation"
                : status === "uncertain"
                ? "Needs Verification"
                : "Unattempted Question"}
            </span>
          </div>
        </div>

        {/* Right: Actions (Edit & Expand Toggle) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Edit score"
            className="p-1 rounded-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable AI Feedback Notes Body */}
      {isExpanded && (
        <div className="p-3 space-y-2.5 animate-in fade-in duration-150">
          {/* AI Feedback Box */}
          <div className="bg-[#FFF9F5] border border-[#FFE8D6] rounded-xs p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#FF5623]">
              <Sparkles className="w-3.5 h-3.5" />
              <span
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "-0.02em",
                }}
              >
                AI Grading Feedback
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {effectiveFeedback}
            </p>
          </div>

          {/* Key Missing Points (if present) */}
          {effectiveMissing.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/70 rounded-xs p-2.5">
              <span className="text-[11.5px] font-bold text-slate-700 block mb-1.5">
                Key Missing Points / Suggestions:
              </span>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                {effectiveMissing.map((point, idx) => (
                  <li key={idx} className="leading-snug">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Teacher Override Editor (Inline) */}
          {isEditing && (
            <div className="bg-slate-100/80 border border-slate-300/80 rounded-xs p-2.5 space-y-2 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-800">
                Teacher Score Override
              </span>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium">Marks:</label>
                <input
                  type="number"
                  min={0}
                  max={effectiveMax}
                  step={0.5}
                  value={overrideMarks}
                  onChange={(e) => setOverrideMarks(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-xs bg-white font-bold"
                />
                <span className="text-xs text-slate-500">/ {effectiveMax}</span>
              </div>

              <input
                type="text"
                placeholder="Optional teacher feedback note..."
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xs bg-white text-slate-800 placeholder:text-slate-400"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOverride}
                  className="px-3 py-1 text-xs font-bold bg-[#303030] text-white rounded-xs hover:bg-black transition-colors"
                >
                  Save Override
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
