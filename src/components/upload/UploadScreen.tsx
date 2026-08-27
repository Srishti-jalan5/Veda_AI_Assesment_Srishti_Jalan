"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { HeroAvatar } from "./HeroAvatar";
import { FileDropzone } from "./FileDropzone";
import { ErrorModal } from "../common/ErrorModal";
import { UploadedFile } from "@/types/assessment";
import { cn } from "@/lib/utils";

interface UploadScreenProps {
  questionPaperFile: UploadedFile | null;
  answerSheetFile: UploadedFile | null;
  onQuestionPaperChange: (file: UploadedFile | null) => void;
  onAnswerSheetChange: (file: UploadedFile | null) => void;
  onStartMapping: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  questionPaperFile,
  answerSheetFile,
  onQuestionPaperChange,
  onAnswerSheetChange,
  onStartMapping,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReadyToMap = !!questionPaperFile && !!answerSheetFile;

  const handleStartMappingClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!isReadyToMap) {
      setErrorMessage("Please upload both PDF files to continue.");
      return;
    }
    onStartMapping();
  };

  return (
    <div className="w-full max-w-[1050px] flex flex-col items-center justify-start pt-3 sm:pt-4 pb-6 px-3 select-none gap-3.5 sm:gap-4 md:gap-5">
      <ErrorModal
        isOpen={!!errorMessage}
        message={errorMessage || ""}
        onClose={() => setErrorMessage(null)}
      />

      {/* Top Group: Title + Avatar + Dropzones */}
      <div className="w-full max-w-[760px] flex flex-col items-center gap-3 sm:gap-3.5 shrink-0">
        {/* Title Section */}
        <div className="w-full max-w-[720px] flex flex-col items-center gap-1.5 text-center shrink-0">
          {/* Header Row */}
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-2.5 max-w-[720px] w-full">
            {/* Upload Text */}
            <span
              style={{
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: "32px",
                lineHeight: "120%",
                letterSpacing: "-0.04em",
                color: "#2B2B2B",
              }}
              className="flex items-center shrink-0 select-none"
            >
              Upload
            </span>

            {/* Orange Highlight Badge */}
            <div
              style={{
                background: "rgba(255, 147, 80, 0.15)",
                borderRadius: "8px",
                padding: "2px 10px",
              }}
              className="flex items-center justify-center shrink-0"
            >
              <span
                style={{
                  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  fontSize: "32px",
                  lineHeight: "120%",
                  letterSpacing: "-0.04em",
                  color: "#FF5623",
                }}
                className="flex items-center text-center shrink-0"
              >
                Question Paper & Answer Sheets
              </span>
            </div>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
              letterSpacing: "-0.03em",
              color: "rgba(70, 70, 70, 0.75)",
            }}
            className="font-normal text-xs sm:text-[13px] leading-relaxed text-center"
          >
            Upload both files to get started
          </p>
        </div>

        {/* Central Card with Hero Avatar Cluster + Dual Dropzones inside Outer Rounded Rectangle */}
        <div className="w-full max-w-[740px] flex flex-col items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Avatar Graphic Cluster */}
          <div className="flex items-center justify-center pt-0.5 shrink-0">
            <HeroAvatar />
          </div>

          {/* Outer Rounded Rectangle Card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              borderRadius: "16px",
            }}
            className="w-full max-w-[720px] p-2.5 sm:p-3 shadow-2xs backdrop-blur-xs flex items-center justify-center shrink-0"
          >
            {/* Side-by-Side Dual Dropzones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 w-full">
              {/* Left Card: Question Paper Dropzone */}
              <FileDropzone
                type="question_paper"
                titlePrefix="Upload"
                highlightText="Question Paper"
                file={questionPaperFile}
                onFileSelect={onQuestionPaperChange}
                onFileRemove={() => onQuestionPaperChange(null)}
                onError={setErrorMessage}
              />

              {/* Right Card: Answer Sheet Dropzone */}
              <FileDropzone
                type="answer_sheet"
                titlePrefix="Upload"
                highlightText="Answer Sheet"
                file={answerSheetFile}
                onFileSelect={onAnswerSheetChange}
                onFileRemove={() => onAnswerSheetChange(null)}
                onError={setErrorMessage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="w-full max-w-[440px] flex flex-col items-center gap-2 text-center shrink-0">
        {/* Primary Action Button */}
        <button
          type="button"
          disabled={!isReadyToMap}
          onClick={handleStartMappingClick}
          style={{
            minWidth: "160px",
            height: "42px",
            borderRadius: "64px",
          }}
          className={cn(
            "px-[20px] py-[9px] flex items-center justify-center gap-[7px] transition-all select-none shadow-md",
            isReadyToMap
              ? "bg-[#303030] text-white border-2 border-white/15 cursor-pointer hover:bg-slate-900 active:scale-95 hover:scale-[1.02]"
              : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
          )}
        >
          <span
            style={{
              fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
              fontSize: "14px",
              lineHeight: "140%",
              letterSpacing: "-0.03em",
            }}
            className="font-medium flex items-center text-center shrink-0 pointer-events-none"
          >
            Start Mapping
          </span>

          <ArrowRight
            className="w-[15px] h-[15px] shrink-0 pointer-events-none"
            strokeWidth={2.2}
          />
        </button>

        {/* Prompt / Guidance */}
        <p
          style={{
            fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
            letterSpacing: "-0.03em",
            color: isReadyToMap ? "rgba(94, 94, 94, 0.85)" : "#D94A1F",
          }}
          className="font-normal text-xs sm:text-[13px] leading-tight text-center"
        >
          {isReadyToMap
            ? "Both files uploaded. Click Start Mapping to begin evaluation."
            : "Please upload both the Question Paper and Answer Sheet to begin."}
        </p>
      </div>
    </div>
  );
};
