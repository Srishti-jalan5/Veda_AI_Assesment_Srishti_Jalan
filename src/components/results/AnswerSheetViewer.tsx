"use client";

import React from "react";
import { AnswerViewer, AnswerViewerProps } from "@/components/viewer/AnswerViewer";

export type AnswerSheetViewerProps = AnswerViewerProps;

export const AnswerSheetViewer: React.FC<AnswerSheetViewerProps> = (props) => {
  return <AnswerViewer {...props} />;
};
