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
  activeMapping?: {
    question_id?: string;
    question_number?: string | number;
    status?: string;
    page_number?: number | null;
    boundingBox?: any;
  } | null;
  pageImages?: string[];
  totalPages?: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export const AnswerViewer: React.FC<AnswerViewerProps> = ({
  selectedQuestion,
  activeMapping: propActiveMapping,
  pageImages = [],
  totalPages: propTotalPages,
  initialPage = 1,
  onPageChange,
  className,
}) => {
  const activeMapping = propActiveMapping || (selectedQuestion ? {
    question_id: selectedQuestion.id,
    question_number: selectedQuestion.subLabel || selectedQuestion.questionNumber,
    status: selectedQuestion.status,
    page_number: selectedQuestion.answerPage || selectedQuestion.boundingBox?.page,
    boundingBox: selectedQuestion.boundingBox,
  } : null);

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(
    activeMapping?.page_number ? activeMapping.page_number - 1 : initialPage - 1
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(
    propTotalPages || 0,
    pageImages.length || 0,
    activeMapping?.page_number || 1,
    1
  );

  // Synchronize active page when selected question / active mapping changes
  useEffect(() => {
    if (
      activeMapping &&
      activeMapping.status === "matched" &&
      activeMapping.page_number
    ) {
      const targetIndex = Math.max(0, activeMapping.page_number - 1);
      setCurrentPageIndex(targetIndex);
      onPageChange?.(activeMapping.page_number);
    }
  }, [activeMapping?.page_number, activeMapping?.status, onPageChange]);

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
    activeMapping &&
      activeMapping.status === "matched" &&
      activeMapping.boundingBox &&
      activeMapping.page_number === currentPageIndex + 1
  );

  // Resolve bounding box style strictly for matched questions on this page
  const currentBoxStyle = useMemo(() => {
    if (!isCurrentQuestionOnThisPage || !activeMapping?.boundingBox) return null;
    const b: any = activeMapping.boundingBox;

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
  }, [isCurrentQuestionOnThisPage, activeMapping]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "20px",
        border: "1.25px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.02)",
      }}
      className={cn(
        "w-full h-full flex flex-col overflow-hidden select-none isolate",
        className
      )}
    >
      {/* Frame 1984077825: Width 659px (fluid), Background #FFFFFF, Border 1.25px rgba(0,0,0,0.1), Radius 20px */}
      {/* Frame 1984077826: Dark Top Header Bar (Height: 64px, Padding: 12px 24px, Gap: 10px, Background: #303030) */}
      <div
        style={{
          height: "64px",
          background: "#303030",
          padding: "12px 24px",
          borderBottom: "1.25px solid rgba(0, 0, 0, 0.1)",
        }}
        className="w-full flex items-center justify-between shrink-0 select-none z-10"
      >
        {/* Title: Answer Sheet (Font: 16px, 700 bold, line-height 140%, -0.04em, rgba(255,255,255,0.8)) */}
        <h3
          style={{
            fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            lineHeight: "140%",
            letterSpacing: "-0.04em",
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          Answer Sheet
        </h3>

        {/* Frame 1984077851: Action Controls Group (Gap: 12px, Height: 36px) */}
        <div className="flex items-center gap-3">
          {/* Fit to Width Button */}
          <button
            onClick={handleFitToWidth}
            title="Fit to Width"
            style={{
              height: "36px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            className="hidden sm:flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold gap-1 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Fit</span>
          </button>

          {/* Frame 1984077844: Zoom Controller Pill (Width: 108px, Height: 36px, Padding: 8px 12px, Radius: 8px, Background rgba(255,255,255,0.1)) */}
          <div
            style={{
              height: "36px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "8px 12px",
              gap: "8px",
            }}
            className="flex items-center justify-center text-white"
          >
            <button
              onClick={handleZoomOut}
              title="Zoom out"
              className="hover:scale-110 active:scale-95 transition-transform cursor-pointer text-white/80 hover:text-white"
            >
              <Minus style={{ width: "16px", height: "16px" }} strokeWidth={2} />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              style={{
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "140%",
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
              }}
              className="min-w-[36px] text-center hover:underline cursor-pointer"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom in"
              className="hover:scale-110 active:scale-95 transition-transform cursor-pointer text-white/80 hover:text-white"
            >
              <Plus style={{ width: "16px", height: "16px" }} strokeWidth={2} />
            </button>
          </div>

          {/* Frame 1984077842: Page Pagination Pill (Width: 138px, Height: 36px, Padding: 8px 12px, Radius: 8px, Background rgba(255,255,255,0.1)) */}
          <div
            style={{
              height: "36px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "8px 12px",
              gap: "8px",
            }}
            className="flex items-center justify-between text-white"
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex <= 0}
              title="Previous Page"
              className="disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-transform cursor-pointer text-white/80 hover:text-white"
            >
              <ChevronLeft style={{ width: "16px", height: "16px" }} strokeWidth={2} />
            </button>
            <span
              style={{
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "140%",
                letterSpacing: "-0.04em",
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
              className="disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-transform cursor-pointer text-white/80 hover:text-white"
            >
              <ChevronRight style={{ width: "16px", height: "16px" }} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Scroll Viewport */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-[#E5E7EB]/50 p-4 flex justify-center items-start relative scroll-smooth"
      >
        {/* Scaled Rendered Paper Page Container */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
          }}
          className="relative inline-block w-full max-w-3xl mx-auto select-none transition-transform duration-150"
        >
          {/* Base Layer: Rendered PDF Page Image */}
          {pageImages && pageImages[currentPageIndex] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pageImages[currentPageIndex]}
              alt={`Answer Sheet Page ${currentPageIndex + 1}`}
              className="w-full h-auto block select-none rounded shadow"
            />
          ) : (
            <div className="w-full min-h-[824px] bg-[#FAF8F5] rounded shadow border border-slate-300 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-sans">
              <p className="text-sm font-semibold text-slate-700">
                Answer Sheet Page {currentPageIndex + 1}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Document preview for Page {currentPageIndex + 1}
              </p>
            </div>
          )}

          {/* Render Highlight only if matched and currently on the answer's page */}
          {activeMapping &&
            activeMapping.status === "matched" &&
            activeMapping.boundingBox &&
            activeMapping.page_number === currentPageIndex + 1 &&
            currentBoxStyle && (
              <div
                style={{
                  position: "absolute",
                  top: currentBoxStyle.top,
                  left: currentBoxStyle.left,
                  width: currentBoxStyle.width,
                  height: currentBoxStyle.height,
                  background: "rgba(94, 255, 53, 0.1)",
                  border: "2px solid #3DD218",
                  borderRadius: "16px",
                  boxShadow: "0px 0px 12px rgba(61, 210, 24, 0.2)",
                }}
                className="pointer-events-none transition-all duration-200 z-10"
              >
                {/* Frame 1984077331: Top-Left Question Tag Badge (Height: 30px, Background: #34AC15, Radius: 12px 12px 0 0) */}
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "-28px",
                    height: "30px",
                    background: "#34AC15",
                    borderRadius: "12px 12px 0px 0px",
                    padding: "4px 12px",
                    gap: "4px",
                  }}
                  className="flex items-center justify-center shadow-xs"
                >
                  <span
                    style={{
                      fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                      fontWeight: 700,
                      fontSize: "16px",
                      lineHeight: "140%",
                      letterSpacing: "-0.04em",
                      color: "#FFFFFF",
                    }}
                  >
                    {activeMapping.boundingBox?.label || (typeof activeMapping.question_number === "number" || !isNaN(Number(activeMapping.question_number)) ? `Q${activeMapping.question_number}` : `Ans ${activeMapping.question_number}`)}
                  </span>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
