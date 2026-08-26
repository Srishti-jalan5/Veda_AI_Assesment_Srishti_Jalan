"use client";

import React from "react";
import Image from "next/image";

export const HeroAvatar: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center select-none w-[118px] h-[118px]">
      {/* Ellipse 6 (Outer circle: 118px × 118px, rgba(255, 86, 35, 0.1), blur 1.7px) */}
      <div className="absolute inset-0 rounded-full bg-[rgba(255,86,35,0.1)] backdrop-blur-[1.7px] flex items-center justify-center">
        {/* Ellipse 7 (Middle circle: 92px × 92px, rgba(255, 86, 35, 0.26)) */}
        <div className="w-[92px] h-[92px] rounded-full bg-[rgba(255,86,35,0.26)] flex items-center justify-center">
          {/* Inner Circle / Center Teacher Image Container (68px × 84px) */}
          <div className="relative w-[68px] h-[84px] rounded-[44px] overflow-hidden flex items-end justify-center shadow-xs">
            <Image
              src="/teacher-avatar.png"
              alt="Teacher with book"
              fill
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </div>

      {/* Orbiting Badges */}
      {/* Frame 3 (Left): Task Square */}
      <div
        style={{ top: "28px", left: "0px" }}
        className="absolute w-[11px] h-[11px] rounded-full bg-gradient-to-br from-[#FB975D] to-[#FC5E24] flex items-center justify-center shadow-xs"
      >
        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>

      {/* Frame 2 (Top): Clock */}
      <div
        style={{ top: "0px", left: "60px" }}
        className="absolute w-[11px] h-[11px] rounded-full bg-gradient-to-br from-[#FB975D] to-[#FC5E24] flex items-center justify-center shadow-xs"
      >
        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      {/* Frame 4 (Right): Cloud Lightning */}
      <div
        style={{ top: "60px", left: "86px" }}
        className="absolute w-[11px] h-[11px] rounded-full bg-gradient-to-br from-[#FB975D] to-[#FC5E24] flex items-center justify-center shadow-xs"
      >
        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="m13 12-3 5h4l-3 5" />
        </svg>
      </div>

      {/* Frame 5 (Bottom-Left): Settings */}
      <div
        style={{ top: "84px", left: "24px" }}
        className="absolute w-[11px] h-[11px] rounded-full bg-gradient-to-br from-[#FB975D] to-[#FC5E24] flex items-center justify-center shadow-xs"
      >
        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>
    </div>
  );
};
