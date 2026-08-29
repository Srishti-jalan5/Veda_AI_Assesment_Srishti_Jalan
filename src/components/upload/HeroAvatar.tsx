"use client";

import React from "react";
import Image from "next/image";

export const HeroAvatar: React.FC = () => {
  return (
    /* Frame 1618872259 (137.03px × 138.03px, isolation: isolate) */
    <div
      style={{
        width: "138.03px",
        height: "138.03px",
        isolation: "isolate",
      }}
      className="relative flex flex-col justify-center items-center select-none"
    >
      {/* Frame 1618872256 (Base Layer with concentric ellipses) */}
      <div
        style={{
          width: "138.03px",
          height: "138.03px",
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Ellipse 6 (Outer circle: 138.03px × 138.03px, top: 0px) */}
        <div
          style={{
            position: "absolute",
            width: "138.03px",
            height: "138.03px",
            left: "0px",
            top: "0px",
            borderRadius: "50%",
            background: "rgba(255, 86, 35, 0.1)",
            backdropFilter: "blur(1.7px)",
            WebkitBackdropFilter: "blur(1.7px)",
          }}
        />

        {/* Ellipse 7 (Middle circle: 108.02px × 108.02px, top: 15.6px, left: 15px) */}
        <div
          style={{
            position: "absolute",
            width: "108.02px",
            height: "108.02px",
            left: "15px",
            top: "15.6px",
            borderRadius: "50%",
            background: "rgba(255, 86, 35, 0.26)",
          }}
        />

        {/* Ellipse 3 (White backdrop circle: 78.62px × 77.78px, top: 30.33px, left: 30.21px) */}
        <div
          style={{
            position: "absolute",
            width: "78.62px",
            height: "77.78px",
            left: "30.21px",
            top: "30.33px",
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        />

        {/* Teacher Avatar Image (Group 4 / WhatsApp Image: top: 11.4px, left: 30.21px - Extends above white circle) */}
        <div
          style={{
            position: "absolute",
            width: "78.62px",
            height: "96.82px",
            left: "30.21px",
            top: "11.4px",
            borderRadius: "52.75px",
            overflow: "hidden",
            zIndex: 5,
          }}
          className="flex items-end justify-center"
        >
          <Image
            src="/teacher-avatar.png"
            alt="Teacher with book"
            fill
            className="object-contain object-bottom select-none"
            priority
          />
        </div>
      </div>

      {/* Frame 1618872257 (Orbiting Badges Container: 113.03px × 111.42px) */}
      <div
        style={{
          width: "113.03px",
          height: "111.42px",
        }}
        className="relative z-10 pointer-events-none"
      >
        {/* Frame 3 (Left: Task List / Checkbox, left: 0px, top: 32.41px) */}
        <div
          style={{
            left: "0px",
            top: "32.41px",
            width: "12.8px",
            height: "12.8px",
            background: "linear-gradient(121.62deg, #FB975D 30.95%, #FC5E24 69.77%)",
            borderRadius: "175px",
            boxShadow: "0px 1px 3px rgba(252, 94, 36, 0.35)",
          }}
          className="absolute flex items-center justify-center shrink-0"
        >
          <svg
            width="7"
            height="7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        {/* Frame 2 (Top: Clock, left: 70.82px, top: 0px) */}
        <div
          style={{
            left: "70.82px",
            top: "0px",
            width: "12.8px",
            height: "12.8px",
            background: "linear-gradient(121.62deg, #FB975D 30.95%, #FC5E24 69.77%)",
            borderRadius: "175px",
            boxShadow: "0px 1px 3px rgba(252, 94, 36, 0.35)",
          }}
          className="absolute flex items-center justify-center shrink-0"
        >
          <svg
            width="7"
            height="7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
        </div>

        {/* Frame 4 (Right: Cloud Lightning / Spark, left: 100.22px, top: 69.82px) */}
        <div
          style={{
            left: "100.22px",
            top: "69.82px",
            width: "12.8px",
            height: "12.8px",
            background: "linear-gradient(121.62deg, #FB975D 30.95%, #FC5E24 69.77%)",
            borderRadius: "175px",
            boxShadow: "0px 1px 3px rgba(252, 94, 36, 0.35)",
          }}
          className="absolute flex items-center justify-center shrink-0"
        >
          <svg
            width="7"
            height="7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="m13 12-3 5h4l-3 5" />
          </svg>
        </div>

        {/* Frame 5 (Bottom-Left: Settings Gear, left: 27.81px, top: 98.62px) */}
        <div
          style={{
            left: "27.81px",
            top: "98.62px",
            width: "12.8px",
            height: "12.8px",
            background: "linear-gradient(121.62deg, #FB975D 30.95%, #FC5E24 69.77%)",
            borderRadius: "175px",
            boxShadow: "0px 1px 3px rgba(252, 94, 36, 0.35)",
          }}
          className="absolute flex items-center justify-center shrink-0"
        >
          <svg
            width="7"
            height="7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
