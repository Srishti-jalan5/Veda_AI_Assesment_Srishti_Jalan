"use client";

import React, { useState } from "react";
import { Edit3 } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);

  const effectiveMax = grade?.max_marks ?? maxMarks;
  const effectiveAwarded = grade?.awarded_marks ?? propAwarded ?? (status === "matched" ? effectiveMax : status === "uncertain" ? Math.floor(effectiveMax * 0.7) : 0);
  const effectiveFeedback = grade?.feedback || propFeedback || "No feedback available.";
  const effectiveMissing = grade?.key_missing_points || propMissing || [];

  const [overrideMarks, setOverrideMarks] = useState<number>(effectiveAwarded);
  const [teacherNote, setTeacherNote] = useState<string>("");

  const handleSaveOverride = () => {
    onTeacherOverride?.(overrideMarks, teacherNote);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        background: "#F6F6F6",
        borderRadius: "16px",
        padding: "16px 24px",
        gap: "10px",
      }}
      className={cn("w-full select-none transition-all flex flex-col border border-black/5", className)}
    >
      {/* Frame 1984077393: Top Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#303030]">
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
            AI Feedback
          </span>
        </div>

        {/* Score edit action */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          title="Edit score"
          className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{effectiveAwarded}/{effectiveMax} Marks</span>
        </button>
      </div>

      {/* Feedback Body */}
      <p
        style={{
          fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: "140%",
          letterSpacing: "-0.04em",
          color: "#303030",
        }}
      >
        {effectiveFeedback}
      </p>

      {/* Key Missing Points (if present) */}
      {effectiveMissing.length > 0 && (
        <div className="bg-white/80 border border-slate-200/70 rounded-lg p-2.5 mt-1">
          <span className="text-[12px] font-bold text-slate-800 block mb-1">
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
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 mt-1 animate-in fade-in duration-150">
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
              className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-bold"
            />
            <span className="text-xs text-slate-500">/ {effectiveMax}</span>
          </div>

          <input
            type="text"
            placeholder="Optional teacher feedback note..."
            value={teacherNote}
            onChange={(e) => setTeacherNote(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-800 placeholder:text-slate-400"
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
              className="px-3 py-1 text-xs font-bold bg-[#303030] text-white rounded-md hover:bg-black transition-colors"
            >
              Save Override
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
