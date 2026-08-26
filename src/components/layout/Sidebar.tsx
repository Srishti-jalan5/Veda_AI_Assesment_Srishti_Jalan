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
        width: isCollapsed ? "60px" : "272px",
        height: "calc(100vh - 24px)",
        maxHeight: "765px",
        borderRadius: "16px",
        boxShadow:
          "0px 16px 48px rgba(0, 0, 0, 0.1), 0px 24px 36px rgba(0, 0, 0, 0.15)",
      }}
      className={cn(
        "hidden md:flex flex-col bg-white transition-all duration-300 select-none z-20 shrink-0 my-3 ml-3",
        isCollapsed ? "p-2 items-center" : "p-4 sm:p-5"
      )}
    >
      {/* Top Section — Header Row (Logo + Title) */}
      <div className="w-full flex flex-col gap-5 sm:gap-6">
        {/* Header Row */}
        <div
          className={cn(
            "w-full h-[36px] flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Logo + Title */}
          <div className="flex items-center gap-2">
            {/* Component 1 (Width: 36px, Height: 36px, Radius: 9px) */}
            <div
              onClick={onToggleCollapse}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9px",
              }}
              className="relative flex items-center justify-center shrink-0 shadow-xs overflow-hidden cursor-pointer hover:scale-105 transition-transform select-none bg-[#303030]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/veda-logo.png"
                alt="VedaAI Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* VedaAI Text */}
            {!isCollapsed && (
              <span
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontSize: "24px",
                  lineHeight: "20px",
                  letterSpacing: "-0.05em",
                  color: "#303030",
                }}
                className="font-bold flex items-center select-none"
              >
                VedaAI
              </span>
            )}
          </div>

          {/* Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="w-[18px] h-[18px] flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors p-0 rounded-sm hover:bg-slate-100"
            >
              <svg
                width="18"
                height="18"
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
                  strokeWidth="1.5"
                />
                <line
                  x1="7.5"
                  y1="2"
                  x2="7.5"
                  y2="18"
                  stroke="rgba(94, 94, 94, 0.8)"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Action Button & Navigation Group */}
        <div className="w-full flex flex-col gap-3 sm:gap-3.5">
          {/* AI Teacher's Toolkit Pill Button */}
          <div>
            {isCollapsed ? (
              <button
                onClick={onToggleCollapse}
                title="AI Teacher's Toolkit"
                style={{
                  width: "38px",
                  height: "36px",
                  background: "#272727",
                  boxShadow:
                    "0px 12px 32px rgba(255, 255, 255, 0.12), inset 0px 0px 24px rgba(255, 255, 255, 0.2)",
                  borderRadius: "100px",
                }}
                className="mx-auto flex items-center justify-center text-white hover:scale-105 transition-transform"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </button>
            ) : (
              <button
                style={{
                  height: "38px",
                  background: "#272727",
                  boxShadow:
                    "0px 12px 32px rgba(255, 255, 255, 0.12), inset 0px 0px 24px rgba(255, 255, 255, 0.2)",
                  borderRadius: "100px",
                }}
                className="w-full py-1.5 px-4 flex items-center justify-center gap-2 text-white hover:bg-[#1f1f1f] transition-all group"
              >
                <Sparkles className="w-3.5 h-3.5 text-white group-hover:rotate-12 transition-transform shrink-0" />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    lineHeight: "22px",
                    letterSpacing: "-0.03em",
                    color: "#FFFFFF",
                  }}
                  className="font-medium whitespace-nowrap"
                >
                  AI Teacher&apos;s Toolkit
                </span>
              </button>
            )}
          </div>

          {/* Menu Items Container */}
          <nav
            style={{
              width: isCollapsed ? "38px" : "100%",
            }}
            className="flex flex-col gap-1 sm:gap-1.5"
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
                    height: "34px",
                    borderRadius: "8px",
                    background: isActive ? "#F0F0F0" : "transparent",
                  }}
                  className={cn(
                    "flex items-center transition-colors select-none",
                    isCollapsed
                      ? "justify-center w-[38px] p-1.5"
                      : "w-full px-2.5 py-1.5 gap-2 text-left",
                    !isActive && "hover:bg-slate-100/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[17px] h-[17px] shrink-0",
                      isActive ? "text-[#303030]" : "text-[rgba(94,94,94,0.8)]"
                    )}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {!isCollapsed && (
                    <span
                      style={{
                        fontFamily: "var(--font-bricolage), sans-serif",
                        fontSize: "14px",
                        lineHeight: "140%",
                        letterSpacing: "-0.03em",
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

      {/* Bottom Section — Pinned to Bottom via mt-auto */}
      <div
        className={cn(
          "w-full flex flex-col gap-1.5 mt-auto pt-3",
          isCollapsed ? "items-center w-[38px]" : "w-full"
        )}
      >
        {/* DPS School Card (Pinned at bottom) */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <div
              style={{
                width: "38px",
                height: "38px",
                background: "#F0F0F0",
                borderRadius: "9px",
              }}
              className="flex items-center justify-center p-0.5"
            >
              <div className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center border border-emerald-600/20 shadow-2xs">
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
                width: "38px",
                height: "30px",
                borderRadius: "6px",
              }}
              className="flex items-center justify-center text-[#2B2B2B] hover:bg-slate-100 transition-colors"
            >
              <ChevronsRight className="w-4 h-4 text-[#2B2B2B]" />
            </button>
          </div>
        ) : (
          <div
            style={{
              height: "72px",
              background: "#F0F0F0",
              borderRadius: "14px",
              padding: "10px 12px",
            }}
            className="w-full flex items-center gap-2.5"
          >
            {/* School Crest Logo */}
            <div className="w-[42px] h-[42px] rounded-lg bg-white flex items-center justify-center border border-emerald-600/30 shrink-0 shadow-xs">
              <div className="text-center">
                <div className="w-4 h-4 mx-auto text-emerald-700 font-serif font-black text-[10px] leading-none">
                  ⚖
                </div>
                <span className="text-[8px] font-black text-emerald-800 tracking-tighter leading-none uppercase">
                  DPS
                </span>
              </div>
            </div>

            {/* Content Text */}
            <div className="flex flex-col justify-center min-w-0">
              <p
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontSize: "14px",
                  lineHeight: "130%",
                  letterSpacing: "-0.03em",
                  color: "#303030",
                }}
                className="font-bold truncate"
              >
                Delhi Public School
              </p>
              <p
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontSize: "12px",
                  lineHeight: "130%",
                  letterSpacing: "-0.03em",
                  color: "#5E5E5E",
                }}
                className="font-normal truncate"
              >
                Bokaro Steel City
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
