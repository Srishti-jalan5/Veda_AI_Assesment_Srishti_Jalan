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
    <div className="w-full max-w-[1050px] flex flex-col items-center justify-start pt-4 sm:pt-6 pb-8 px-4 select-none gap-5 sm:gap-6">
      <ErrorModal
        isOpen={!!errorMessage}
        message={errorMessage || ""}
        onClose={() => setErrorMessage(null)}
      />

      {/* Top Group: Title + Avatar + Dropzones */}
      <div className="w-full max-w-[820px] flex flex-col items-center gap-4 sm:gap-5 shrink-0">
        {/* Title Section (Frame 1984078307: width 755px, height 92px, gap 8px) */}
        <div className="w-full max-w-[755px] flex flex-col items-center gap-2 text-center shrink-0">
          {/* Header Row (Frame 1984078197: height 56px, gap 12px) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
            {/* Upload Text (40px, font-bold, #2B2B2B, line-height: 120%) */}
            <span
              style={{
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                lineHeight: "120%",
                letterSpacing: "-0.04em",
                color: "#2B2B2B",
              }}
              className="text-[24px] sm:text-[34px] md:text-[40px] flex items-center shrink-0 select-none"
            >
              Upload
            </span>

            {/* Orange Highlight Badge (Frame 1984078306: bg rgba(255, 147, 80, 0.15), radius 8px, padding 4px 8px) */}
            <div
              style={{
                background: "rgba(255, 147, 80, 0.15)",
                borderRadius: "8px",
                padding: "4px 8px",
              }}
              className="flex items-center justify-center shrink-0"
            >
              <span
                style={{
                  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  lineHeight: "120%",
                  letterSpacing: "-0.04em",
                  color: "#FF5623",
                }}
                className="text-[24px] sm:text-[34px] md:text-[40px] flex items-center text-center shrink-0"
              >
                Question Paper & Answer Sheets
              </span>
            </div>
          </div>

          {/* Subtitle (Frame 1984078043: 20px, #303030, 400 regular, letter-spacing -0.04em) */}
          <p
            style={{
              fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
              fontWeight: 400,
              lineHeight: "140%",
              letterSpacing: "-0.04em",
              color: "#303030",
            }}
            className="text-[14px] sm:text-[17px] md:text-[20px] text-center"
          >
            Upload both files to get started
          </p>
        </div>

        {/* Central Card with Hero Avatar Cluster + Dual Dropzones */}
        <div className="w-full max-w-[789px] flex flex-col items-center gap-3 sm:gap-4 shrink-0">
          {/* Avatar Graphic Cluster */}
          <div className="flex items-center justify-center shrink-0">
            <HeroAvatar />
          </div>

          {/* Frame 1984077806: Semi-transparent White Rectangle Container (789px × 205px, Radius 24px, Padding 12px) */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.5)",
              borderRadius: "24px",
              padding: "12px",
              boxShadow: "0px 2px 12px rgba(0, 0, 0, 0.02)",
            }}
            className="w-full flex items-center justify-center border border-white/80 shrink-0"
          >
            {/* Frame 1984078305: Side-by-Side Dual Dropzones (Width 765px, Gap 16px) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full justify-items-center">
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

      {/* Bottom Action Section (Frame 1984078309: width 410px, height 78px, gap 12px) */}
      <div className="w-full max-w-[410px] flex flex-col items-center gap-3 text-center shrink-0">
        {/* Primary Action Button (Width: 161px, Height: 44px, Padding: 12px 20px 12px 24px, Radius: 64px) */}
        <button
          type="button"
          disabled={!isReadyToMap}
          onClick={handleStartMappingClick}
          style={{
            width: "161px",
            height: "44px",
            background: "#303030",
            border: "2px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "64px",
            padding: "12px 20px 12px 24px",
            gap: "8px",
            opacity: isReadyToMap ? 1 : 0.25,
          }}
          className={cn(
            "flex items-center justify-center transition-all select-none box-border",
            isReadyToMap
              ? "cursor-pointer hover:bg-black active:scale-95 hover:scale-[1.02] shadow-sm"
              : "cursor-not-allowed"
          )}
        >
          <span
            style={{
              fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "140%",
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
            }}
            className="flex items-center text-center shrink-0 pointer-events-none"
          >
            Start Mapping
          </span>

          <ArrowRight
            style={{ width: "20px", height: "20px" }}
            className="text-white shrink-0 pointer-events-none"
            strokeWidth={2}
          />
        </button>

        {/* Prompt / Helper Guidance Text (Width: 410px, Height: 22px, Typography: 14px, -0.06em, color: rgba(94, 94, 94, 0.8)) */}
        <p
          style={{
            fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "22px",
            letterSpacing: "-0.06em",
            color: "rgba(94, 94, 94, 0.8)",
          }}
          className="text-center whitespace-nowrap"
        >
          Once both files are uploaded, you&apos;ll able to map answers with questions
        </p>
      </div>
    </div>
  );
};
