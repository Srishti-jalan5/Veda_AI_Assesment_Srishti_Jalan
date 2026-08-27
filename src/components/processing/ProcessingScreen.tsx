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
      {/* Expanded Sharp Extracting Card */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFFFFF",
          borderRadius: "8px",
        }}
        className="flex flex-col justify-center items-center shadow-xs border border-slate-200/60 p-6"
      >
        {/* AnalysingLoader Container */}
        <div className="flex flex-col justify-center items-center gap-[14px] max-w-[420px] w-full">
          {/* Sparkle Vector Graphic Cluster (Width: 98px, Height: 104px) */}
          <div className="relative w-[98px] h-[104px] flex items-center justify-center">
            {/* Top-Right Primary Star (58px × 58px) */}
            <div
              style={{
                top: "0px",
                right: "0px",
                width: "58px",
                height: "58px",
              }}
              className="absolute animate-pulse"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/extracting-star.png"
                alt="Extracting Sparkle"
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,86,35,0.4)]"
              />
            </div>

            {/* Bottom-Left Secondary Star (38px × 38px) */}
            <div
              style={{
                bottom: "4px",
                left: "4px",
                width: "38px",
                height: "38px",
              }}
              className="absolute animate-pulse [animation-delay:200ms]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/extracting-star.png"
                alt="Extracting Sparkle"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,86,35,0.3)]"
              />
            </div>

            {/* Right Accent Small Star (18px × 18px) */}
            <div
              style={{
                bottom: "16px",
                right: "8px",
                width: "18px",
                height: "18px",
                opacity: 0.65,
              }}
              className="absolute animate-pulse [animation-delay:400ms]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/extracting-star.png"
                alt="Extracting Sparkle"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Left Orbiting Accent Dot */}
            <div
              style={{
                top: "36px",
                left: "10px",
                width: "6px",
                height: "6px",
                opacity: 0.85,
                boxShadow: "0px 0px 6px rgba(255, 86, 35, 0.6)",
              }}
              className="absolute rounded-full bg-[#FF5623] animate-ping"
            />
          </div>

          {/* Text Group */}
          <div className="flex flex-col items-center text-center gap-1 w-full">
            {/* Extracting... Title */}
            <h2
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 700,
                fontSize: "22px",
                lineHeight: "28px",
                letterSpacing: "-0.04em",
                backgroundImage:
                  "linear-gradient(90deg, #303030 20%, #606060 40%, #808080 50%, #606060 60%, #303030 80%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              className="animate-pulse"
            >
              Extracting...
            </h2>

            {/* Dynamic Step Description */}
            <p
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 500,
                fontSize: "13.5px",
                lineHeight: "20px",
                letterSpacing: "-0.03em",
                color: "#FF5623",
              }}
              className="transition-all duration-200"
            >
              {activeMessage}
            </p>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 400,
                fontSize: "12.5px",
                lineHeight: "18px",
                letterSpacing: "-0.03em",
                color: "rgba(70, 70, 70, 0.65)",
              }}
            >
              This may take a few moments
            </p>

            {/* Progress Bar Track */}
            <div className="w-full max-w-[280px] h-[5px] bg-slate-100 rounded-full overflow-hidden mt-3 border border-slate-200/60">
              <div
                style={{
                  width: `${activeProgress}%`,
                  background: "linear-gradient(90deg, #FF7B54 0%, #FF5623 100%)",
                  boxShadow: "0px 0px 8px rgba(255, 86, 35, 0.5)",
                }}
                className="h-full rounded-full transition-all duration-200 ease-out"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
