"use client";

import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { UploadedFile } from "@/types/assessment";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  type: "question_paper" | "answer_sheet";
  titlePrefix: string;
  highlightText: string;
  file: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  onFileRemove: () => void;
  onError?: (errorMessage: string) => void;
  defaultMockFile?: UploadedFile;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  type,
  titlePrefix,
  highlightText,
  file,
  onFileSelect,
  onFileRemove,
  onError,
  defaultMockFile,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      processFile(selected);
    }
  };

  const processFile = (fileItem: File) => {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileItem.size > MAX_SIZE) {
      onError?.(
        `File size exceeds 10MB limit (${(fileItem.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`
      );
      return;
    }

    const sizeInMB = (fileItem.size / (1024 * 1024)).toFixed(0);
    const estimatedPages = Math.max(1, Math.ceil(fileItem.size / (1.5 * 1024 * 1024)));

    const newUploadedFile: UploadedFile = {
      id: `${type}-${Date.now()}`,
      name: fileItem.name,
      sizeFormatted: `${sizeInMB === "0" ? "<1" : sizeInMB}MB`,
      sizeBytes: fileItem.size,
      pages: estimatedPages,
      type: type,
      uploadDate: new Date().toISOString().split("T")[0],
    };

    onFileSelect(newUploadedFile);
  };

  const handlePresetSampleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (defaultMockFile) {
      onFileSelect(defaultMockFile);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[345px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Dropzone Card (Height: 146px, Radius: 12px, Scaled Compact Density) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        style={{
          width: "100%",
          maxWidth: "345px",
          height: "146px",
          borderRadius: "12px",
          border: "1.5px dashed #CECECE",
        }}
        className={cn(
          "relative bg-white p-[8px] flex items-center justify-center transition-all select-none",
          file
            ? "cursor-default"
            : "hover:border-[#FF5623] cursor-pointer hover:bg-orange-50/10 shadow-xs",
          isDragOver && "border-[#FF5623] bg-orange-50/20 scale-[1.01]"
        )}
      >
        {file ? (
          /* Filled State Card (Compact Gray Pill) */
          <div className="relative flex items-center justify-center w-full animate-in fade-in zoom-in-95 duration-150">
            {/* Gray Pill Container (Height: 52px, Background: #F6F6F6, Radius: 8px) */}
            <div
              style={{
                width: type === "question_paper" ? "270px" : "240px",
                height: "52px",
                background: "#F6F6F6",
                borderRadius: "8px",
                padding: "6px 12px 6px 10px",
                gap: "10px",
              }}
              className="flex flex-row items-center justify-center shrink-0 relative"
            >
              {/* Red PDF Badge Icon (28px × 34px) */}
              <div
                style={{
                  width: "28px",
                  height: "34px",
                }}
                className="bg-red-500 rounded-[5px] text-white flex flex-col items-center justify-center shrink-0 shadow-xs"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="mb-0.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-[7px] font-black tracking-tighter leading-none uppercase">
                  PDF
                </span>
              </div>

              {/* File Info Group */}
              <div className="flex flex-col items-start min-w-0 flex-1">
                {/* Filename (13.5px font size) */}
                <p
                  title={file.name}
                  style={{
                    fontFamily: "var(--font-bricolage), sans-serif",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    lineHeight: "130%",
                    letterSpacing: "-0.03em",
                    color: "#2B2B2B",
                  }}
                  className="truncate w-full text-left"
                >
                  {file.name}
                </p>

                {/* Subtext (11.5px) */}
                <div className="flex items-center gap-[5px]">
                  <span
                    style={{
                      fontFamily: "var(--font-bricolage), sans-serif",
                      fontWeight: 400,
                      fontSize: "11.5px",
                      lineHeight: "125%",
                      letterSpacing: "-0.03em",
                      color: "rgba(94, 94, 94, 0.8)",
                    }}
                  >
                    {file.sizeFormatted}
                  </span>

                  {/* Dot */}
                  <span
                    style={{
                      width: "3.5px",
                      height: "3.5px",
                      background: "rgba(94, 94, 94, 0.8)",
                    }}
                    className="rounded-full shrink-0"
                  />

                  {/* Pages */}
                  <span
                    style={{
                      fontFamily: "var(--font-bricolage), sans-serif",
                      fontWeight: 400,
                      fontSize: "11.5px",
                      lineHeight: "125%",
                      letterSpacing: "-0.03em",
                      color: "rgba(94, 94, 94, 0.8)",
                    }}
                  >
                    {file.pages} {file.pages === 1 ? "Page" : "Pages"}
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Dark Close Button (20px × 20px) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
              }}
              title="Remove file"
              style={{
                width: "20px",
                height: "20px",
                background: "rgba(43, 43, 43, 0.85)",
                boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.25)",
                borderRadius: "30px",
                right: "-5px",
                top: "-7px",
              }}
              className="absolute flex items-center justify-center text-[#EFE4DC] hover:scale-110 active:scale-95 transition-transform z-10"
            >
              <X className="w-[11px] h-[11px]" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          /* Empty Dropzone State */
          <div className="flex flex-col items-center justify-center gap-[8px] pointer-events-none text-center">
            {/* Upload Icon Box (36px × 36px) */}
            <div className="w-[36px] h-[36px] rounded-[7px] bg-[#F3F3F3] flex items-center justify-center p-[4px]">
              <Upload className="w-[18px] h-[18px] text-[#303030]" strokeWidth={2} />
            </div>

            {/* Text Group */}
            <div className="flex flex-col items-center gap-[1px]">
              {/* Title (15.5px) */}
              <p
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontSize: "15.5px",
                  lineHeight: "19px",
                  letterSpacing: "-0.04em",
                  color: "#303030",
                }}
                className="font-semibold whitespace-nowrap"
              >
                {titlePrefix}{" "}
                <span className="text-[#FF5623]">{highlightText}</span>
              </p>

              {/* Subtitle (11.5px) */}
              <p
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontSize: "11.5px",
                  lineHeight: "16px",
                  letterSpacing: "-0.04em",
                  color: "rgba(94, 94, 94, 0.55)",
                }}
                className="font-normal"
              >
                Max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preset sample quick-fill button */}
      {!file && defaultMockFile && (
        <div className="mt-1 text-center">
          <button
            onClick={handlePresetSampleClick}
            className="text-[10.5px] text-slate-400 hover:text-[#FF5623] hover:underline font-medium transition-colors"
          >
            + Use sample &quot;{defaultMockFile.name}&quot;
          </button>
        </div>
      )}
    </div>
  );
};
