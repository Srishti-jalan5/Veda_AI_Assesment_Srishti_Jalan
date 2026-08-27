"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Maximize2,
} from "lucide-react";
import { QuestionItem } from "@/types/assessment";
import { cn } from "@/lib/utils";

export interface AnswerViewerProps {
  selectedQuestion?: QuestionItem | null;
  pageImages?: string[];
  totalPages?: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export const AnswerViewer: React.FC<AnswerViewerProps> = ({
  selectedQuestion,
  pageImages = [],
  totalPages: propTotalPages,
  initialPage = 1,
  onPageChange,
  className,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(
    selectedQuestion?.answerPage ? selectedQuestion.answerPage - 1 : initialPage - 1
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(
    propTotalPages || 0,
    pageImages.length || 0,
    selectedQuestion?.answerPage || 1,
    1
  );

  // Synchronize active page when selected question changes
  useEffect(() => {
    if (
      selectedQuestion &&
      selectedQuestion.status === "matched" &&
      selectedQuestion.answerPage
    ) {
      const targetIndex = Math.max(0, selectedQuestion.answerPage - 1);
      setCurrentPageIndex(targetIndex);
      onPageChange?.(selectedQuestion.answerPage);
    }
  }, [selectedQuestion, onPageChange]);

  // Handle Zoom Controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 10, 180));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 10, 60));
  const handleResetZoom = () => setZoomLevel(100);
  const handleFitToWidth = () => setZoomLevel(110);

  // Handle Page Navigation
  const handlePrevPage = () => {
    setCurrentPageIndex((idx) => {
      const prev = Math.max(idx - 1, 0);
      onPageChange?.(prev + 1);
      return prev;
    });
  };

  const handleNextPage = () => {
    setCurrentPageIndex((idx) => {
      const next = Math.min(idx + 1, totalPages - 1);
      onPageChange?.(next + 1);
      return next;
    });
  };

  // Check if selected question belongs on current viewing page & is matched
  const isCurrentQuestionOnThisPage = Boolean(
    selectedQuestion &&
      selectedQuestion.status === "matched" &&
      selectedQuestion.boundingBox &&
      (selectedQuestion.answerPage || selectedQuestion.boundingBox.page) === currentPageIndex + 1
  );

  // Resolve bounding box style strictly for matched questions on this page
  const currentBoxStyle = useMemo(() => {
    if (!isCurrentQuestionOnThisPage || !selectedQuestion?.boundingBox) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b: any = selectedQuestion.boundingBox;

    // Check if xmin / ymin format is present
    if (typeof b.ymin === "number" && typeof b.xmin === "number") {
      if (b.ymin > 1 || b.ymax > 1 || b.xmin > 1 || b.xmax > 1) {
        // 0-1000 coordinate scale
        return {
          top: `${(b.ymin / 1000) * 100}%`,
          left: `${(b.xmin / 1000) * 100}%`,
          width: `${((b.xmax - b.xmin) / 1000) * 100}%`,
          height: `${((b.ymax - b.ymin) / 1000) * 100}%`,
        };
      } else {
        // 0-1 normalized unit scale
        return {
          top: `${b.ymin * 100}%`,
          left: `${b.xmin * 100}%`,
          width: `${(b.xmax - b.xmin) * 100}%`,
          height: `${(b.ymax - b.ymin) * 100}%`,
        };
      }
    }

    // Check if x, y, width, height (0-100 percentage) are present
    if (typeof b.y === "number" && typeof b.x === "number") {
      return {
        top: `${b.y}%`,
        left: `${b.x}%`,
        width: `${b.width}%`,
        height: `${b.height}%`,
      };
    }

    return null;
  }, [isCurrentQuestionOnThisPage, selectedQuestion]);

  const questionLabel =
    selectedQuestion?.boundingBox?.label ||
    (selectedQuestion?.subLabel
      ? `${selectedQuestion.questionNumber}${selectedQuestion.subLabel}`
      : selectedQuestion?.questionNumber
      ? `Q${selectedQuestion.questionNumber}`
      : "Q1");

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "6px",
        border: "1.25px solid rgba(0, 0, 0, 0.1)",
      }}
      className={cn(
        "w-full h-full flex flex-col overflow-hidden shadow-xs select-none",
        className
      )}
    >
      {/* Dark Top Header Bar */}
      <div
        style={{
          height: "48px",
          background: "#303030",
          padding: "8px 16px",
        }}
        className="w-full flex items-center justify-between shrink-0 select-none z-10"
      >
        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-bricolage), sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            lineHeight: "140%",
            letterSpacing: "-0.03em",
            color: "rgba(255, 255, 255, 0.85)",
          }}
        >
          Answer Sheet
        </h3>

        {/* Action Controls Group */}
        <div className="flex items-center gap-[8px] sm:gap-[10px]">
          {/* Fit to Width Button */}
          <button
            onClick={handleFitToWidth}
            title="Fit to Width"
            style={{
              height: "32px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              padding: "4px 8px",
            }}
            className="hidden sm:flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold gap-1"
          >
            <Maximize2 className="w-[13px] h-[13px]" />
            <span>Fit</span>
          </button>

          {/* Zoom Controller */}
          <div
            style={{
              height: "32px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              padding: "4px 8px",
              gap: "6px",
            }}
            className="flex items-center justify-center text-white"
          >
            <button
              onClick={handleZoomOut}
              title="Zoom out"
              className="hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Minus className="w-[14px] h-[14px] text-white" strokeWidth={2} />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: "140%",
                letterSpacing: "-0.03em",
                color: "#FFFFFF",
              }}
              className="min-w-[34px] text-center hover:underline cursor-pointer"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom in"
              className="hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Plus className="w-[14px] h-[14px] text-white" strokeWidth={2} />
            </button>
          </div>

          {/* Page Pagination Controller */}
          <div
            style={{
              height: "32px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              padding: "4px 8px",
              gap: "6px",
            }}
            className="flex items-center justify-between text-white"
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex <= 0}
              title="Previous Page"
              className="disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <ChevronLeft className="w-[14px] h-[14px] text-white" strokeWidth={2} />
            </button>
            <span
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: "140%",
                letterSpacing: "-0.03em",
                color: "#FFFFFF",
              }}
              className="whitespace-nowrap"
            >
              Page {currentPageIndex + 1} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPageIndex >= totalPages - 1}
              title="Next Page"
              className="disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <ChevronRight className="w-[14px] h-[14px] text-white" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Scroll Viewport */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-[#E5E7EB]/60 p-3 flex justify-center items-start relative scroll-smooth"
      >
        {/* Scaled Rendered Paper Page Container */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
          }}
          className="relative w-full max-w-[658px] min-h-[824px] bg-[#FAF8F5] rounded-sm shadow-lg border border-slate-300 overflow-hidden select-none transition-transform duration-150"
        >
          {/* Base Layer: Rendered PDF Page Image */}
          {pageImages && pageImages[currentPageIndex] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pageImages[currentPageIndex]}
              alt={`Answer Sheet Page ${currentPageIndex + 1}`}
              className="w-full h-auto block select-none"
            />
          ) : (
            <div className="w-full h-[824px] flex flex-col items-center justify-center p-8 text-center text-slate-500 font-sans">
              <p className="text-sm font-semibold text-slate-700">
                Answer Sheet Page {currentPageIndex + 1}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Document preview for Page {currentPageIndex + 1}
              </p>
            </div>
          )}

          {/* Overlay Layer: Dynamic Bounding Box */}
          {currentBoxStyle && isCurrentQuestionOnThisPage && (
            <div
              style={{
                position: "absolute",
                top: currentBoxStyle.top,
                left: currentBoxStyle.left,
                width: currentBoxStyle.width,
                height: currentBoxStyle.height,
              }}
              className="border-2 border-emerald-500 bg-emerald-500/15 rounded-xs pointer-events-none transition-all duration-200"
            >
              <span className="absolute -top-3 left-2 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-xs font-bold shadow-xs">
                {questionLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
