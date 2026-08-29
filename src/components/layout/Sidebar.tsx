"use client";

import React from "react";
import {
  LayoutGrid,
  Users,
  FileText,
  ClipboardList,
  PieChart,
  Sparkles,
  ChevronsRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeNav?: string;
  onNavSelect?: (nav: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeNav = "Exams",
  onNavSelect,
}) => {
  const navItems = [
    { id: "Home", label: "Home", icon: LayoutGrid },
    { id: "My Classroom", label: "My Classroom", icon: Users },
    { id: "Assignments", label: "Assignments", icon: FileText },
    { id: "Exams", label: "Exams", icon: ClipboardList },
    { id: "My Library", label: "My Library", icon: PieChart },
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? "68px" : "272px",
        height: "calc(100vh - 24px)",
        borderRadius: "20px",
        boxShadow:
          "0px 8px 24px rgba(0, 0, 0, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.04)",
      }}
      className={cn(
        "hidden md:flex flex-col justify-between bg-white transition-all duration-300 select-none z-20 shrink-0 my-3 ml-3 border border-black/5 overflow-hidden",
        isCollapsed ? "p-2.5 items-center" : "p-4 sm:p-5"
      )}
    >
      {/* Top Section — Frame 39962 (Width: 251px, Gap: ~24px to 32px) */}
      <div className="w-full flex flex-col gap-6 min-h-0">
        {/* Frame 1618872393: Header Row (Width: 251px, Height: 40px, Gap: 8px) */}
        <div
          className={cn(
            "w-full h-[40px] flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Frame 1984077293: Logo + Title (Gap: 8px) */}
          <div className="flex items-center gap-2">
            {/* Component 1 (Width: 40px, Height: 40px, Radius: 12px, Background: #303030) */}
            <div
              onClick={onToggleCollapse}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#303030",
              }}
              className="relative flex items-center justify-center shrink-0 shadow-xs overflow-hidden cursor-pointer hover:scale-105 transition-transform select-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/veda-logo.png"
                alt="VedaAI Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* VedaAI Text (28px, 700 weight, line-height 20px, letter-spacing -0.06em, #303030) */}
            {!isCollapsed && (
              <span
                style={{
                  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  fontSize: "28px",
                  lineHeight: "20px",
                  letterSpacing: "-0.06em",
                  color: "#303030",
                }}
                className="flex items-center select-none"
              >
                VedaAI
              </span>
            )}
          </div>

          {/* Toggle / Collapse Button (20px × 20px) */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="w-5 h-5 flex items-center justify-center text-[rgba(94,94,94,0.8)] hover:text-[#303030] transition-colors p-0 rounded-md cursor-pointer"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="2"
                  y="2"
                  width="16"
                  height="16"
                  rx="3"
                  stroke="rgba(94, 94, 94, 0.8)"
                  strokeWidth="1.6"
                />
                <line
                  x1="7.5"
                  y1="2"
                  x2="7.5"
                  y2="18"
                  stroke="rgba(94, 94, 94, 0.8)"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Action Button & Navigation Group */}
        <div className="w-full flex flex-col gap-6">
          {/* AI Teacher's Toolkit Pill Button (Container: 251px × 42px, Background #272727, Radius 100px) */}
          <div>
            {isCollapsed ? (
              <button
                onClick={onToggleCollapse}
                title="AI Teacher's Toolkit"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "#272727",
                  border: "2px solid #FF5623",
                  boxShadow:
                    "0px 16px 48px rgba(255, 255, 255, 0.12), 0px 32px 48px rgba(255, 255, 255, 0.2)",
                  borderRadius: "100px",
                }}
                className="mx-auto flex items-center justify-center text-white hover:scale-105 transition-transform cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                style={{
                  width: "100%",
                  height: "42px",
                  background: "#272727",
                  border: "2px solid #FF5623",
                  boxShadow:
                    "0px 16px 48px rgba(255, 255, 255, 0.12), 0px 32px 48px rgba(255, 255, 255, 0.2), inset 0px -1px 3.5px rgba(177, 177, 177, 0.6), inset 0px 0px 34.5px rgba(255, 255, 255, 0.25)",
                  borderRadius: "100px",
                  padding: "8px 24px",
                  gap: "10px",
                }}
                className="flex items-center justify-center text-white hover:bg-[#333333] active:scale-98 transition-all cursor-pointer group"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="#FFFFFF"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "28px",
                    letterSpacing: "-0.04em",
                    color: "#FFFFFF",
                  }}
                  className="whitespace-nowrap"
                >
                  AI Teacher&apos;s Toolkit
                </span>
              </button>
            )}
          </div>

          {/* Menu Items Container (Frame Menu: Width 251px, Gap 8px) */}
          <nav
            style={{
              width: isCollapsed ? "42px" : "100%",
            }}
            className="flex flex-col gap-2"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavSelect?.(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    height: isActive ? "40px" : "38px",
                    borderRadius: "8px",
                    background: isActive ? "#F0F0F0" : "transparent",
                    padding: isActive ? "9px 12px" : "8px 12px",
                    gap: "8px",
                  }}
                  className={cn(
                    "flex items-center transition-colors select-none cursor-pointer",
                    isCollapsed
                      ? "justify-center w-[42px] p-2"
                      : "w-full text-left",
                    !isActive && "hover:bg-slate-100/70"
                  )}
                >
                  <Icon
                    style={{ width: "20px", height: "20px" }}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-[#303030]" : "text-[rgba(94,94,94,0.8)]"
                    )}
                    strokeWidth={isActive ? 2 : 1.8}
                  />
                  {!isCollapsed && (
                    <span
                      style={{
                        fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                        fontSize: "16px",
                        lineHeight: "140%",
                        letterSpacing: "-0.04em",
                        color: isActive ? "#303030" : "rgba(94, 94, 94, 0.8)",
                      }}
                      className={cn(
                        "flex-1 truncate",
                        isActive ? "font-medium" : "font-normal"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section — Frame 1984077460: Width 256px, Height 130px, Gap 8px (Pinned via mt-auto) */}
      <div
        className={cn(
          "w-full flex flex-col gap-2 mt-auto pt-2 shrink-0",
          isCollapsed ? "items-center w-[42px]" : "w-full"
        )}
      >
        {/* Settings Button (Width 256px, Height 38px, Padding 8px 12px, Gap 8px, Radius 8px) */}
        <button
          onClick={() => onNavSelect?.("Settings")}
          title={isCollapsed ? "Settings" : undefined}
          style={{
            height: "38px",
            borderRadius: "8px",
            background: activeNav === "Settings" ? "#F0F0F0" : "transparent",
            padding: "8px 12px",
            gap: "8px",
          }}
          className={cn(
            "flex items-center transition-colors select-none cursor-pointer",
            isCollapsed
              ? "justify-center w-[42px] p-2"
              : "w-full text-left",
            activeNav !== "Settings" && "hover:bg-slate-100/70"
          )}
        >
          <Settings
            style={{ width: "20px", height: "20px" }}
            className={cn(
              "shrink-0",
              activeNav === "Settings" ? "text-[#303030]" : "text-[rgba(94,94,94,0.8)]"
            )}
            strokeWidth={activeNav === "Settings" ? 2 : 1.8}
          />
          {!isCollapsed && (
            <span
              style={{
                fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "140%",
                letterSpacing: "-0.04em",
                color: activeNav === "Settings" ? "#303030" : "rgba(94, 94, 94, 0.8)",
              }}
              className="flex-1 truncate"
            >
              Settings
            </span>
          )}
        </button>

        {/* Frame 39959: Delhi Public School Card (Width 256px, Height 84px, Background #F0F0F0, Radius 16px, Padding 12px) */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              style={{
                width: "42px",
                height: "42px",
                background: "#F0F0F0",
                borderRadius: "12px",
              }}
              className="flex items-center justify-center p-1"
            >
              <div className="w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center border border-emerald-600/20 shadow-2xs">
                <span className="text-[9px] font-black text-emerald-800 tracking-tighter">
                  DPS
                </span>
              </div>
            </div>

            {/* Expand >> Button */}
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              style={{
                width: "42px",
                height: "32px",
                borderRadius: "8px",
              }}
              className="flex items-center justify-center text-[#2B2B2B] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4 text-[#2B2B2B]" />
            </button>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "84px",
              background: "#F0F0F0",
              borderRadius: "16px",
              padding: "12px",
              gap: "16px",
            }}
            className="flex items-center shrink-0 border border-black/5"
          >
            {/* Frame 39958: Width 232px, Height 60px, Gap 8px */}
            <div className="flex items-center gap-2.5 w-full">
              {/* Crest Logo (image 3: ~48px × 48px) */}
              <div className="w-[48px] h-[48px] rounded-xl bg-white flex items-center justify-center border border-emerald-600/20 shrink-0 shadow-2xs p-1">
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="text-emerald-700 font-serif font-black text-[12px] leading-none mb-0.5">
                    ⚖
                  </div>
                  <span className="text-[8px] font-black text-emerald-800 tracking-tighter leading-none uppercase">
                    DPS
                  </span>
                </div>
              </div>

              {/* Content Text: Width 165px, Height 44px */}
              <div className="flex flex-col justify-center min-w-0">
                <p
                  style={{
                    fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    lineHeight: "140%",
                    letterSpacing: "-0.04em",
                    color: "#303030",
                  }}
                  className="truncate"
                >
                  Delhi Public School
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
                    fontWeight: 400,
                    fontSize: "14px",
                    lineHeight: "140%",
                    letterSpacing: "-0.04em",
                    color: "#5E5E5E",
                  }}
                  className="truncate"
                >
                  Bokaro Steel City
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
