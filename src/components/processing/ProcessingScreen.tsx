"use client";

import React, { useEffect } from "react";

interface ProcessingScreenProps {
  onComplete: () => void;
  autoCompleteDurationMs?: number;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  onComplete,
  autoCompleteDurationMs = 2500,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, autoCompleteDurationMs);

    return () => clearTimeout(timer);
  }, [onComplete, autoCompleteDurationMs]);

  return (
    <div className="w-full h-full flex items-center justify-center select-none animate-in fade-in duration-300">
      {/* Expanded Sharp Extracting Card (Fills space till navbar & sidebar, sharp 8px radius) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFFFFF",
          borderRadius: "8px",
        }}
        className="flex flex-col justify-center items-center shadow-xs border border-slate-200/60 p-6"
      >
        {/* AnalysingLoader Container (Width: 140px, Gap: 10px) */}
        <div className="flex flex-col justify-center items-center gap-[10px]">
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
          <div className="flex flex-col items-center text-center gap-0.5">
            {/* Extracting... (22px Bold, Gradient Fill) */}
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

            {/* This may take a while (14px Regular) */}
            <p
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                letterSpacing: "-0.03em",
                color: "rgba(70, 70, 70, 0.75)",
              }}
            >
              This may take a while
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
