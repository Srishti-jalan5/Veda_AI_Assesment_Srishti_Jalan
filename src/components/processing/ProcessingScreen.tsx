"use client";

import React, { useState, useEffect } from "react";

interface ProcessingScreenProps {
  onComplete: () => void;
  autoCompleteDurationMs?: number;
  currentStageMessage?: string;
  progressPercent?: number;
}

const STAGES = [
  { message: "Ingesting & validating documents...", targetProgress: 25 },
  { message: "Extracting questions & rubric...", targetProgress: 55 },
  { message: "Reading handwriting & OCR...", targetProgress: 80 },
  { message: "Matching answers with questions...", targetProgress: 98 },
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  onComplete,
  autoCompleteDurationMs = 2800,
  currentStageMessage,
  progressPercent,
}) => {
  const [internalProgress, setInternalProgress] = useState(15);
  const [internalStageIndex, setInternalStageIndex] = useState(0);

  useEffect(() => {
    // Increment internal progress over duration
    const intervalTime = 120;
    const totalSteps = autoCompleteDurationMs / intervalTime;
    const increment = 100 / totalSteps;

    const timer = setInterval(() => {
      setInternalProgress((prev) => {
        const next = Math.min(prev + increment, 98);

        if (next >= 80) setInternalStageIndex(3);
        else if (next >= 55) setInternalStageIndex(2);
        else if (next >= 25) setInternalStageIndex(1);
        else setInternalStageIndex(0);

        return next;
      });
    }, intervalTime);

    const completionTimer = setTimeout(() => {
      setInternalProgress(100);
      onComplete();
    }, autoCompleteDurationMs);

    return () => {
      clearInterval(timer);
      clearTimeout(completionTimer);
    };
  }, [onComplete, autoCompleteDurationMs]);

  const activeProgress = progressPercent !== undefined ? progressPercent : internalProgress;
  const activeMessage = currentStageMessage || STAGES[internalStageIndex]?.message || "Extracting...";

  return (
    <div className="w-full h-full flex items-center justify-center select-none animate-in fade-in duration-300">
      {/* Frame 1984077862: Width 1343px (fluid w-full), Height 696px (fluid h-full), Background #FFFFFF, Radius 24px, Gap 12px */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFFFFF",
          borderRadius: "24px",
          gap: "12px",
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.02)",
        }}
        className="flex flex-col justify-center items-center border border-black/5 p-6"
      >
        {/* AnalysingLoader (Width: 177px, Height: 221.49px, Gap: 15px) */}
        <div
          style={{
            width: "177px",
            minHeight: "221.49px",
            gap: "15px",
          }}
          className="flex flex-col justify-center items-center"
        >
          {/* Sparkle Icon Container (Width: 128.15px, Height: 134.49px) */}
          <div
            style={{
              width: "128.15px",
              height: "134.49px",
            }}
            className="relative shrink-0"
          >
            {/* Vector 2: Primary Big Star (top-right: left 25.36%, top 0%, width 74.64%, height 71.38%) */}
            <div
              style={{
                position: "absolute",
                left: "25.36%",
                top: "0%",
                width: "74.64%",
                height: "71.38%",
                filter: "drop-shadow(0px 0px 8px rgba(255, 86, 35, 0.45))",
              }}
              className="animate-pulse"
            >
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d="M50 0 C50 27.614 27.614 50 0 50 C27.614 50 50 72.386 50 100 C50 72.386 72.386 50 100 50 C72.386 50 50 27.614 50 0 Z"
                  fill="#FF5623"
                />
              </svg>
            </div>

            {/* Vector 3: Secondary Medium Star (bottom-left: left 9.75%, top 46.47%, width 55.98%, height 53.53%) */}
            <div
              style={{
                position: "absolute",
                left: "9.75%",
                top: "46.47%",
                width: "55.98%",
                height: "53.53%",
                filter: "drop-shadow(0px 0px 6px rgba(255, 86, 35, 0.35))",
              }}
              className="animate-pulse [animation-delay:200ms]"
            >
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d="M50 0 C50 27.614 27.614 50 0 50 C27.614 50 50 72.386 50 100 C50 72.386 72.386 50 100 50 C72.386 50 50 27.614 50 0 Z"
                  fill="#FF5623"
                />
              </svg>
            </div>

            {/* Vector 4: Accent Small Star (bottom-right: left 70.22%, top 62.27%, width 22.4%, height 21.41%, opacity 0.52) */}
            <div
              style={{
                position: "absolute",
                left: "70.22%",
                top: "62.27%",
                width: "22.4%",
                height: "21.41%",
                opacity: 0.52,
              }}
              className="animate-pulse [animation-delay:400ms]"
            >
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d="M50 0 C50 27.614 27.614 50 0 50 C27.614 50 50 72.386 50 100 C50 72.386 72.386 50 100 50 C72.386 50 50 27.614 50 0 Z"
                  fill="#FF5623"
                />
              </svg>
            </div>

            {/* Ellipse 18: Accent Dot (left 13.65%, top 35.32%, width 9.76%, height 9.29%, opacity 0.83) */}
            <div
              style={{
                position: "absolute",
                left: "13.65%",
                top: "35.32%",
                width: "9.76%",
                height: "9.29%",
                opacity: 0.83,
                background: "#FF5623",
                borderRadius: "50%",
                boxShadow: "0px 0px 6px rgba(255, 86, 35, 0.6)",
              }}
              className="animate-ping"
            />
          </div>

          {/* Frame 1984078042: Text Container (Width: 177px, Height: 72px) */}
          <div
            style={{
              width: "177px",
              height: "72px",
            }}
            className="flex flex-col items-center justify-center text-center shrink-0"
          >
            {/* Extracting... (Width: 157px, Height: 36px, Font 30px 700, -1.2px) */}
            <h2
              style={{
                width: "159px",
                height: "36px",
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                lineHeight: "36px",
                letterSpacing: "-1.2px",
                background: "linear-gradient(90deg, #303030 20%, #606060 40%, #808080 50%, #606060 60%, #303030 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              className="whitespace-nowrap flex items-center justify-center"
            >
              Extracting...
            </h2>

            {/* This may take a while (Width: 177px, Height: 36px, Font 20px 400, -1.2px, color rgba(70, 70, 70, 0.75)) */}
            <p
              style={{
                width: "177px",
                height: "36px",
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 400,
                fontSize: "20px",
                lineHeight: "36px",
                letterSpacing: "-1.2px",
                color: "rgba(70, 70, 70, 0.75)",
              }}
              className="whitespace-nowrap flex items-center justify-center text-center"
            >
              This may take a while
            </p>
          </div>

          {/* Smooth Progress Indicator Bar */}
          <div className="w-[177px] flex flex-col items-center gap-1.5 mt-1">
            <div className="w-full h-[4px] bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div
                style={{
                  width: `${activeProgress}%`,
                  background: "linear-gradient(90deg, #FF7B54 0%, #FF5623 100%)",
                  boxShadow: "0px 0px 8px rgba(255, 86, 35, 0.5)",
                }}
                className="h-full rounded-full transition-all duration-200 ease-out"
              />
            </div>

            {/* Dynamic Stage Text */}
            <span
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                letterSpacing: "-0.02em",
                color: "#FF5623",
              }}
              className="text-center truncate"
            >
              {activeMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
