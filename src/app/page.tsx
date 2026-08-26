"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { UploadScreen } from "@/components/upload/UploadScreen";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";
import { AssessmentReviewWorkspace } from "@/components/results/AssessmentReviewWorkspace";
import { UploadedFile } from "@/types/assessment";

export default function Home() {
  // Workflow State Machine: 'upload' | 'processing' | 'results'
  const [currentStep, setCurrentStep] = useState<"upload" | "processing" | "results">("upload");

  // Sidebar collapse state: expanded on upload screen (304px), narrow rail on mapping/loading screen (64px)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Exams");

  // Automatically adjust default sidebar expansion according to the authoritative Figma frame
  useEffect(() => {
    if (currentStep === "upload") {
      setSidebarCollapsed(false); // Expanded sidebar on Desktop Upload frames
    } else if (currentStep === "results" || currentStep === "processing") {
      setSidebarCollapsed(true);  // Narrow rail on Desktop Mapping & Loading frames
    }
  }, [currentStep]);

  // Uploaded Files State — Initial Empty State on landing
  const [questionPaperFile, setQuestionPaperFile] = useState<UploadedFile | null>(null);
  const [answerSheetFile, setAnswerSheetFile] = useState<UploadedFile | null>(null);

  const handleStartMapping = () => {
    setCurrentStep("processing");
  };

  const handleProcessingComplete = () => {
    setCurrentStep("results");
  };

  const handleBackToUpload = () => {
    setCurrentStep("upload");
  };

  return (
    <div
      style={{
        background:
          currentStep === "upload"
            ? "linear-gradient(180deg, #F5F5F5 0%, #E9E5E5 100%)"
            : "linear-gradient(180deg, #EEEEEE 0%, #DADADA 100%)",
      }}
      className="relative h-screen w-screen flex flex-row text-slate-900 font-sans overflow-hidden selection:bg-orange-100 selection:text-orange-900"
    >
      {/* Figma Ambient Background Blurred Ellipses (Ellipse 17 & Ellipse 16) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ellipse 17 */}
        <div
          style={{
            width: "1318px",
            height: "428px",
            background: "rgba(23, 23, 23, 0.05)",
            filter: "blur(200px)",
            left: "calc(50% - 1318px/2 + 166px)",
            top: "calc(50% - 428px/2 + 300px)",
          }}
          className="absolute rounded-full"
        />
        {/* Ellipse 16 */}
        <div
          style={{
            width: "1113px",
            height: "428px",
            background: "rgba(76, 76, 76, 0.04)",
            filter: "blur(200px)",
            left: "calc(50% - 1113px/2 + 158px)",
            top: "calc(50% - 428px/2 + 400px)",
          }}
          className="absolute rounded-full"
        />
      </div>

      {/* Fixed Left Navigation Rail (Desktop) */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeNav={activeNav}
        onNavSelect={setActiveNav}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden z-10">
        {/* Compact Top Navigation Bar */}
        <TopNavbar
          showBackButton={true}
          onBack={handleBackToUpload}
          breadcrumbTitle={activeNav}
          activeNav={activeNav}
          onNavSelect={setActiveNav}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          {currentStep === "upload" && (
            <div className="w-full min-h-full flex justify-center items-start">
              <UploadScreen
                questionPaperFile={questionPaperFile}
                answerSheetFile={answerSheetFile}
                onQuestionPaperChange={setQuestionPaperFile}
                onAnswerSheetChange={setAnswerSheetFile}
                onStartMapping={handleStartMapping}
              />
            </div>
          )}

          {currentStep === "processing" && (
            <div className="w-full h-full flex items-center justify-center p-2.5 pt-2 pb-3 pr-3 pl-2">
              <ProcessingScreen
                onComplete={handleProcessingComplete}
                autoCompleteDurationMs={2500}
              />
            </div>
          )}

          {currentStep === "results" && (
            <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 overflow-hidden">
              <AssessmentReviewWorkspace initialSelectedQuestionId="q-2" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
