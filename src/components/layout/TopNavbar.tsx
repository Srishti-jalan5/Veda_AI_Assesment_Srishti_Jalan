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
    <header className="w-full flex items-center justify-center pt-1.5 px-1.5 z-10 shrink-0 select-none">
      {/* Sleek Top Bar (Height: 48px, Radius: 6px, Background: rgba(255, 255, 255, 0.75), Backdrop blur) */}
      <div
        style={{
          height: "48px",
          borderRadius: "6px",
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "0px 6px 0px 14px",
          gap: "8px",
        }}
        className="w-full max-w-[1341px] flex items-center justify-between border border-white/60 shadow-xs"
      >
        {/* Left Section: Back Arrow & Exams Breadcrumb */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Left Arrow Button (34px × 34px) */}
          <button
            onClick={onBack}
            title="Go Back"
            style={{
              width: "34px",
              height: "34px",
              background: "#FFFFFF",
              borderRadius: "5px",
            }}
            className="flex items-center justify-center shadow-xs text-[#303030] hover:scale-105 active:scale-95 transition-transform shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#303030]" strokeWidth={2.2} />
          </button>

          {/* Breadcrumb (Gap: 6px) */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Clipboard Icon */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <rect
                x="3.33"
                y="3.33"
                width="13.33"
                height="13.33"
                rx="2"
                stroke="#A9A9A9"
                strokeWidth="1.8"
              />
              <path
                d="M6.67 1.67H13.33V4.17H6.67V1.67Z"
                stroke="#A9A9A9"
                strokeWidth="1.8"
              />
            </svg>

            {/* Breadcrumb Text */}
            <span
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "18px",
                letterSpacing: "-0.03em",
                color: "#A9A9A9",
              }}
              className="truncate"
            >
              {breadcrumbTitle}
            </span>
          </div>
        </div>

        {/* Right Section: Sleek Desktop Controls & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Help Button (32px × 32px) */}
          <button
            title="Help"
            style={{
              width: "32px",
              height: "32px",
              background: "#F6F6F6",
              borderRadius: "5px",
            }}
            className="flex items-center justify-center hover:bg-slate-200/80 transition-colors"
          >
            <div className="w-[18px] h-[18px] rounded-xs border-[1.5px] border-[#303030] flex items-center justify-center text-[#303030] font-bold text-[11px] leading-none">
              ?
            </div>
          </button>

          {/* Notifications Button (32px × 32px) */}
          <button
            title="Notifications"
            style={{
              width: "32px",
              height: "32px",
              background: "#F6F6F6",
              borderRadius: "5px",
            }}
            className="relative flex items-center justify-center hover:bg-slate-200/80 transition-colors"
          >
            <Bell className="w-4 h-4 text-[#303030]" strokeWidth={2} />
            <span
              style={{
                width: "7px",
                height: "7px",
                background: "#FF5623",
              }}
              className="absolute top-[4px] right-[4px] rounded-full ring-2 ring-[#F6F6F6]"
            />
          </button>

          {/* AI Sparkle Button (32px × 32px) */}
          <button
            title="AI Assistant"
            style={{
              width: "32px",
              height: "32px",
              background: "#FFFFFF",
              borderRadius: "5px",
            }}
            className="flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="#2B2B2B"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </button>

          {/* User Profile Container */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              style={{
                height: "36px",
                borderRadius: "5px",
                padding: "4px 8px",
                gap: "6px",
              }}
              className="flex items-center hover:bg-black/5 transition-colors"
            >
              {/* Profile Image (26px × 26px) */}
              <div className="w-[26px] h-[26px] rounded-xs overflow-hidden shrink-0 shadow-xs border border-black/5 bg-[#F6F6F6] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/madhur-avatar.png"
                  alt="Madhur Rastogi"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Madhur Rastogi + Chevron */}
              <div className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: "var(--font-bricolage), sans-serif",
                    fontWeight: 600,
                    fontSize: "14px",
                    lineHeight: "18px",
                    letterSpacing: "-0.03em",
                    color: "#303030",
                  }}
                  className="whitespace-nowrap"
                >
                  Madhur Rastogi
                </span>
                <ChevronDown className="w-4 h-4 text-[#303030] shrink-0" strokeWidth={1.8} />
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-md shadow-xl border border-slate-200/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800">Madhur Rastogi</p>
                  <p className="text-[11px] text-slate-500">Teacher • DPS Bokaro</p>
                </div>
                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xs transition-colors"
                >
                  Account Settings
                </button>
                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xs transition-colors"
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
