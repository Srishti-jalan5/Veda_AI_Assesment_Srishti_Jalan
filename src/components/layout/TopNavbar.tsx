"use client";

import React, { useState } from "react";
import { ArrowLeft, Bell, ChevronDown } from "lucide-react";

interface TopNavbarProps {
  showBackButton?: boolean;
  onBack?: () => void;
  breadcrumbTitle?: string;
  activeNav?: string;
  onNavSelect?: (nav: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onBack,
  breadcrumbTitle = "Exams",
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="w-full flex items-center justify-center pt-3 px-3 z-10 shrink-0 select-none">
      {/* Frame 1984077337: Height 56px, Radius 16px, Padding 0 8px 0 24px, Gap 10px, Background rgba(255, 255, 255, 0.75) */}
      <div
        style={{
          height: "56px",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "0px 8px 0px 24px",
          gap: "10px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.02)",
        }}
        className="w-full flex items-center justify-between border border-black/5"
      >
        {/* Left Section: Frame 1984077964 (Back Arrow) + Frame 1618872410 (Breadcrumb) */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Frame 1984077964 / Frame 1984077294: Left Arrow Button (40px × 40px, Radius: 100px, Background: #FFFFFF) */}
          <button
            onClick={onBack}
            title="Go Back"
            style={{
              width: "40px",
              height: "40px",
              background: "#FFFFFF",
              borderRadius: "100px",
              boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.04)",
            }}
            className="flex items-center justify-center text-[#303030] hover:bg-slate-50 active:scale-95 transition-all shrink-0 border border-black/5 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-[#303030]" strokeWidth={2} />
          </button>

          {/* Mobile VedaAI Brand Logo (Visible on mobile only) */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-lg bg-[#1C1C1E] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/veda-logo.png"
                alt="VedaAI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "-0.04em",
                color: "#2B2B2B",
              }}
            >
              VedaAI
            </span>
          </div>

          {/* Frame 1618872410: Desktop Breadcrumb (Gap 8px, Color #A9A9A9, Font 16px) */}
          <div className="hidden md:flex items-center gap-2 min-w-0">
            {/* Clipboard Icon (20px × 20px, Stroke: #A9A9A9) */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A9A9A9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>

            {/* Exams Text (16px, 600 weight, line-height 19px, letter-spacing -0.04em, #A9A9A9) */}
            <span
              style={{
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "19px",
                letterSpacing: "-0.04em",
                color: "#A9A9A9",
              }}
              className="truncate"
            >
              {breadcrumbTitle}
            </span>
          </div>
        </div>

        {/* Right Section: Controls & Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Frame 1984077296: Help Button (36px × 36px, Background #F6F6F6, Radius 100px) */}
          <button
            title="Help"
            style={{
              width: "36px",
              height: "36px",
              background: "#F6F6F6",
              borderRadius: "100px",
            }}
            className="hidden sm:flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {/* Frame 1984077425: Inner 24px circle with ? text */}
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid #303030",
                borderRadius: "100px",
              }}
              className="flex items-center justify-center"
            >
              <span
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                  lineHeight: "1",
                  color: "#303030",
                }}
              >
                ?
              </span>
            </div>
          </button>

          {/* Frame 1984077295: Notification Bell Button (36px × 36px, Background #F6F6F6, Radius 100px) */}
          <button
            title="Notifications"
            style={{
              width: "36px",
              height: "36px",
              background: "#F6F6F6",
              borderRadius: "100px",
              position: "relative",
            }}
            className="flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-[#303030]" strokeWidth={2} />
            {/* Ellipse 9: Orange dot (8px × 8px, background #FF5623) */}
            <span
              style={{
                position: "absolute",
                width: "8px",
                height: "8px",
                background: "#FF5623",
                borderRadius: "50%",
                top: "4px",
                right: "4px",
              }}
              className="ring-1.5 ring-white"
            />
          </button>

          {/* Frame 1984077963: AI Star / Sparkle Button (36px × 36px, Background #FFFFFF, Radius 49px) */}
          <button
            title="AI Assistant"
            style={{
              width: "36px",
              height: "36px",
              background: "#FFFFFF",
              borderRadius: "49px",
              boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.04)",
            }}
            className="hidden sm:flex items-center justify-center hover:scale-105 transition-transform border border-black/5 cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="#2B2B2B"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </button>

          {/* Frame 1984077965: User Profile Container (Padding 6px 12px, Height 44px, Radius 12px, Gap 8px) */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              style={{
                height: "44px",
                borderRadius: "12px",
                padding: "6px 12px",
                gap: "8px",
              }}
              className="flex items-center hover:bg-black/5 transition-colors cursor-pointer"
            >
              {/* Frame 1618872412: Profile Avatar (32px × 32px, Radius 100px) */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "100px",
                  background: "#F6F6F6",
                }}
                className="overflow-hidden shrink-0 shadow-xs border border-black/10 flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/madhur-avatar.png"
                  alt="Madhur Rastogi"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Frame 1984077288: Madhur Rastogi + Chevron (Desktop) */}
              <div className="hidden md:flex items-center gap-1">
                <span
                  style={{
                    fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                    fontWeight: 600,
                    fontSize: "16px",
                    lineHeight: "19px",
                    letterSpacing: "-0.04em",
                    color: "#303030",
                  }}
                  className="whitespace-nowrap"
                >
                  Madhur Rastogi
                </span>
                <ChevronDown className="w-5 h-5 text-[#303030] shrink-0" strokeWidth={1.5} />
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800">Madhur Rastogi</p>
                  <p className="text-[11px] text-slate-500">Teacher • DPS Bokaro</p>
                </div>
                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Account Settings
                </button>
                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
