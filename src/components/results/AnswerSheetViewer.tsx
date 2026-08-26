"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { QuestionItem } from "@/types/assessment";

interface AnswerSheetViewerProps {
  selectedQuestion: QuestionItem | null;
}

export const AnswerSheetViewer: React.FC<AnswerSheetViewerProps> = ({
  selectedQuestion,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const totalPages = 4;

  // Sync active page with the selected question's mapped answer page
  useEffect(() => {
    if (selectedQuestion) {
      setCurrentPage(selectedQuestion.answerPage);
    }
  }, [selectedQuestion]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 10, 150));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 10, 75));

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "20px",
        border: "1.25px solid rgba(0, 0, 0, 0.1)",
      }}
      className="w-full h-full flex flex-col overflow-hidden shadow-xs select-none"
    >
      {/* Dark Top Header Bar (Height: 48px, Background: #303030, Padding: 8px 16px) */}
      <div
        style={{
          height: "48px",
          background: "#303030",
          padding: "8px 16px",
        }}
        className="w-full flex items-center justify-between shrink-0 select-none z-10"
      >
        {/* Answer Sheet Title */}
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

        {/* Right Controls */}
        <div className="flex items-center gap-[10px]">
          {/* Zoom Controller */}
          <div
            style={{
              height: "32px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "7px",
              padding: "4px 8px",
              gap: "6px",
            }}
            className="flex items-center justify-center text-white"
          >
            <button
              onClick={handleZoomOut}
              title="Zoom out"
              className="hover:scale-110 active:scale-95 transition-transform"
            >
              <Minus className="w-[14px] h-[14px] text-white" strokeWidth={2} />
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
              className="min-w-[34px] text-center"
            >
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom in"
              className="hover:scale-110 active:scale-95 transition-transform"
            >
              <Plus className="w-[14px] h-[14px] text-white" strokeWidth={2} />
            </button>
          </div>

          {/* Page Pagination Controller */}
          <div
            style={{
              height: "32px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "7px",
              padding: "4px 8px",
              gap: "6px",
            }}
            className="flex items-center justify-between text-white"
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              title="Previous Page"
              className="disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-transform"
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
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              title="Next Page"
              className="disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-transform"
            >
              <ChevronRight className="w-[14px] h-[14px] text-white" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Paper Canvas Area (Frame 1984077828: 659px × 824px) */}
      <div className="flex-1 overflow-auto bg-[#E5E7EB]/60 p-4 flex justify-center items-start">
        {/* Rendered Notebook Paper */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
          }}
          className="relative w-full max-w-[658px] min-h-[824px] bg-[#FAF8F5] rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 font-serif select-none transition-transform duration-150"
        >
          {/* Lined Margin (Red Vertical Line) */}
          <div className="absolute top-0 bottom-0 left-12 w-[1.5px] bg-red-300/80 pointer-events-none" />

          {/* Ruled Horizontal Lines Background Layer */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 31px, #3B82F6 32px)",
              backgroundSize: "100% 32px",
            }}
          />

          {/* Page Content: Realistic Handwritten Answers per Page */}
          <div className="relative pl-8 space-y-8 text-slate-800 text-[15px] leading-[32px]">
            {currentPage === 1 && (
              <>
                {/* Q1 Handwritten Answer */}
                <div className="relative">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q1.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Photosynthesis is the process used by green plants and some other
                    organisms to convert light energy into chemical energy.
                  </p>

                  {/* Chemical Formula Box */}
                  <div className="my-3 mx-auto max-w-[400px] border-2 border-slate-700 bg-white/80 p-2 text-center text-xs font-mono font-semibold rounded-md">
                    6CO₂ + 6H₂O ⎯⎯(Light/Chlorophyll)⎯→ C₆H₁₂O₆ + 6O₂
                  </div>

                  {/* Plant Diagram Doodle */}
                  <div className="my-2 flex flex-col items-center">
                    <div className="w-24 h-24 relative flex items-center justify-center">
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full stroke-slate-800 fill-none"
                        strokeWidth="2"
                      >
                        {/* Sun */}
                        <circle cx="20" cy="20" r="10" />
                        <path d="M20 5v5M20 30v5M5 20h5M30 20h5M10 10l3 3M27 27l3 3M10 30l3-3M27 10l3 3" />
                        {/* Plant Stem */}
                        <path d="M50 80 Q50 50 50 40" />
                        {/* Leaves */}
                        <path d="M50 60 Q30 50 20 60 Q35 70 50 60" />
                        <path d="M50 50 Q70 40 80 50 Q65 60 50 50" />
                        {/* Roots */}
                        <path d="M50 80 L40 95 M50 80 L50 98 M50 80 L60 95" />
                      </svg>
                    </div>
                    <span className="text-[11px] text-slate-600 font-sans italic">
                      Fig: Light energy conversion in leaf
                    </span>
                  </div>
                </div>

                {/* Q2 Handwritten Answer with Green Active Bounding Box */}
                <div className="relative mt-6 pt-3">
                  <span className="font-bold text-slate-900 absolute -left-7 top-4 text-sm">
                    Q2.
                  </span>

                  {/* Frame 1984078206 / Frame 1984078205 (Green Active Bounding Box) */}
                  <div
                    style={{
                      background: "rgba(94, 255, 53, 0.1)",
                      border: "2px solid #3DD218",
                      borderRadius: "16px",
                      padding: "16px",
                    }}
                    className="relative shadow-xs"
                  >
                    {/* Frame 1984077331 — Q2 Green Top Tab Header */}
                    <div
                      style={{
                        background: "#34AC15",
                        borderRadius: "12px 12px 0px 0px",
                        padding: "4px 12px",
                      }}
                      className="absolute -top-[28px] left-[14px] flex items-center justify-center text-white"
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-bricolage), sans-serif",
                          fontWeight: 700,
                          fontSize: "16px",
                          lineHeight: "140%",
                          letterSpacing: "-0.04em",
                          color: "#FFFFFF",
                        }}
                      >
                        Q2
                      </span>
                    </div>

                    <p className="italic font-sans text-slate-900 font-medium leading-relaxed">
                      The process mainly occurs in the chloroplast of the plant cell. It has
                      two main stages:
                    </p>
                    <ol className="list-decimal pl-6 font-sans italic space-y-1 mt-1 text-slate-900 font-medium">
                      <li>
                        <strong>Light reaction</strong> — Captures light energy.
                      </li>
                      <li>
                        <strong>Dark reaction</strong> — Uses energy to make glucose.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Q3 Handwritten Answer preview */}
                <div className="relative mt-6">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q3.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Chloroplasts contain chlorophyll pigments which absorb blue and red light
                    while reflecting green light...
                  </p>
                </div>
              </>
            )}

            {currentPage === 2 && (
              <>
                <div className="relative">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q4.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Deoxygenated blood enters the Right Atrium via superior &amp; inferior vena cava.
                    Passes to Right Ventricle, pumped to lungs through Pulmonary Artery...
                  </p>
                </div>

                <div className="relative mt-8">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q5.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Alveoli are thin-walled sacs surrounded by dense capillary networks for rapid
                    diffusion of O₂ and CO₂ across concentration gradients.
                  </p>
                </div>
              </>
            )}

            {currentPage === 3 && (
              <>
                <div className="relative">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q6.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Human Digestive System begins at buccal cavity &rarr; esophagus &rarr; stomach &rarr; small intestine.
                    Most nutrient absorption occurs in the ileum lined with microvilli.
                  </p>
                </div>

                <div className="relative mt-8">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q7.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Nephron structure: Glomerulus filters blood under pressure &rarr; Bowman&apos;s Capsule &rarr;
                    Proximal Convoluted Tubule &rarr; Loop of Henle &rarr; Distal Tubule &rarr; Collecting Duct.
                  </p>
                </div>
              </>
            )}

            {currentPage === 4 && (
              <>
                <div className="relative">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q8.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Palisade mesophyll cells are vertically elongated and tightly packed near the upper epidermis
                    with high chloroplast density. Spongy mesophyll has large intercellular air spaces.
                  </p>
                </div>

                <div className="relative mt-8">
                  <span className="font-bold text-slate-900 absolute -left-7 top-0 text-sm">
                    Q9.
                  </span>
                  <p className="italic font-sans text-slate-900 font-medium">
                    Transpiration is the evaporative loss of water vapor from aerial plant parts, primarily through stomata.
                    Higher ambient temperature and increased wind velocity increase transpiration rates.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
