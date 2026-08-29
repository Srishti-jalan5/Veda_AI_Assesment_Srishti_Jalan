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
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  type,
  titlePrefix,
  highlightText,
  file,
  onFileSelect,
  onFileRemove,
  onError,
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

    const sizeInMB = (fileItem.size / (1024 * 1024)).toFixed(1);
    const isImage = fileItem.type.startsWith("image/");
    const estimatedPages = isImage ? 1 : Math.max(1, Math.ceil(fileItem.size / (1.5 * 1024 * 1024)));

    const newUploadedFile: UploadedFile = {
      id: `${type}-${Date.now()}`,
      name: fileItem.name,
      sizeFormatted: `${sizeInMB === "0.0" ? "<0.1" : sizeInMB}MB`,
      sizeBytes: fileItem.size,
      pages: estimatedPages,
      type: type,
      uploadDate: new Date().toISOString().split("T")[0],
      fileBlob: fileItem,
    };

    onFileSelect(newUploadedFile);
  };

  const isImageFile = file?.name && /\.(png|jpe?g|webp)$/i.test(file.name);

  return (
    <div className="flex-1 w-full max-w-[375px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Dropzone Card (Width: ~374.5px, Height: 181px, Radius: 20px, Dashed Border) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        style={{
          width: "100%",
          maxWidth: "375px",
          height: "181px",
          borderRadius: "20px",
          border: "1.5px dashed #CECECE",
        }}
        className={cn(
          "relative bg-white p-4 flex items-center justify-center transition-all select-none",
          file
            ? "cursor-default"
            : "hover:border-[#FF5623] cursor-pointer hover:bg-orange-50/10 shadow-xs",
          isDragOver && "border-[#FF5623] bg-orange-50/20 scale-[1.01]"
        )}
      >
        {file ? (
          /* Filled State Card */
          <div className="relative flex items-center justify-center w-full animate-in fade-in zoom-in-95 duration-150">
            {/* Gray Pill Container (Height: 58px, Background: #F6F6F6, Radius: 12px) */}
            <div
              style={{
                width: "100%",
                maxWidth: "290px",
                height: "58px",
                background: "#F6F6F6",
                borderRadius: "12px",
                padding: "8px 14px",
                gap: "12px",
              }}
              className="flex flex-row items-center justify-center shrink-0 relative border border-black/5"
            >
              {/* Document/Image Badge Icon (32px × 38px) */}
              <div
                style={{
                  width: "32px",
                  height: "38px",
                }}
                className={cn(
                  "rounded-md text-white flex flex-col items-center justify-center shrink-0 shadow-2xs",
                  isImageFile ? "bg-blue-500" : "bg-[#EA4335]"
                )}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="mb-0.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-[7.5px] font-black tracking-tighter leading-none uppercase">
                  {isImageFile ? "IMG" : "PDF"}
                </span>
              </div>

              {/* File Info Group */}
              <div className="flex flex-col items-start min-w-0 flex-1">
                {/* Filename (14px font size) */}
                <p
                  title={file.name}
                  style={{
                    fontFamily: "var(--font-bricolage), sans-serif",
                    fontWeight: 700,
                    fontSize: "14px",
                    lineHeight: "130%",
                    letterSpacing: "-0.03em",
                    color: "#2B2B2B",
                  }}
                  className="truncate w-full text-left"
                >
                  {file.name}
                </p>

                {/* Subtext (12px) */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    style={{
                      fontFamily: "var(--font-bricolage), sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
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
                      fontSize: "12px",
                      lineHeight: "125%",
                      letterSpacing: "-0.03em",
                      color: "rgba(94, 94, 94, 0.8)",
                    }}
                  >
                    {file.pages} {file.pages === 1 ? "Page" : "Pages"}
                  </span>
                </div>
              </div>

              {/* Floating Dark Close Button (22px × 22px) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove();
                }}
                title="Remove file"
                style={{
                  width: "22px",
                  height: "22px",
                  background: "#2B2B2B",
                  boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.25)",
                  borderRadius: "100px",
                  right: "-7px",
                  top: "-7px",
                }}
                className="absolute flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform z-10 cursor-pointer"
              >
                <X className="w-3 h-3 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Dropzone State (Frame 1984077924 / Frame 1984077925: width ~198px, height 110px, gap 16px) */
          <div className="flex flex-col items-center justify-center gap-4 pointer-events-none text-center">
            {/* Upload Icon Box (Frame 1984078308: 48px × 48px, Background #F3F3F3, Radius 8px) */}
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#F3F3F3",
                borderRadius: "8px",
                padding: "4px",
              }}
              className="flex items-center justify-center shrink-0"
            >
              <Upload className="w-6 h-6 text-[#303030]" strokeWidth={2.2} />
            </div>

            {/* Text Group (Frame 1618872200: width ~198px, height 46px, gap 2px) */}
            <div className="flex flex-col items-center gap-0.5">
              {/* Title (20px, font-semibold 600, line-height 22px, letter-spacing -0.06em) */}
              <p
                style={{
                  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                  fontWeight: 600,
                  fontSize: "20px",
                  lineHeight: "22px",
                  letterSpacing: "-0.06em",
                  color: "#303030",
                }}
                className="whitespace-nowrap"
              >
                {titlePrefix}{" "}
                <span className="text-[#FF5623]">{highlightText}</span>
              </p>

              {/* Subtitle (14px, regular 400, line-height 22px, letter-spacing -0.06em) */}
              <p
                style={{
                  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "22px",
                  letterSpacing: "-0.06em",
                  color: "rgba(94, 94, 94, 0.55)",
                }}
              >
                Max 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
