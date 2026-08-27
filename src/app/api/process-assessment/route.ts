export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { DocumentProcessingService } from "../../../services/document-processing/documentService";
import {
  processPdfDocument,
} from "../../../lib/pdf-renderer";
import {
  extractQuestionsFromImages,
  QuestionPaperPageInput,
} from "../../../lib/ai/question-extractor";
import {
  extractAnswersFromImages,
  AnswerSheetPageInput,
} from "../../../lib/ai/answer-extractor";
import { mapQuestionsToAnswers } from "../../../lib/ai/matcher";
import { gradeBatchAssessment, GradeInput } from "../../../lib/ai/grader";
import { QuestionItem, AssessmentProcessResponse } from "../../../types/assessment";

const docService = new DocumentProcessingService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    const questionPaperEntry = formData.get("question_paper");
    const answerSheetEntry = formData.get("answer_sheet");

    // 1. Strict Validation: Both documents are required
    if (
      !questionPaperEntry ||
      !(questionPaperEntry instanceof Blob) ||
      questionPaperEntry.size === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Question paper file is required and must not be empty.",
        },
        { status: 400 }
      );
    }

    if (
      !answerSheetEntry ||
      !(answerSheetEntry instanceof Blob) ||
      answerSheetEntry.size === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Answer sheet file is required and must not be empty.",
        },
        { status: 400 }
      );
    }

    // 2. Read file buffers
    const qpBuffer = Buffer.from(await questionPaperEntry.arrayBuffer());
    const asBuffer = Buffer.from(await answerSheetEntry.arrayBuffer());

    const qpFileName =
      "name" in questionPaperEntry && typeof questionPaperEntry.name === "string"
        ? questionPaperEntry.name
        : "question_paper.pdf";

    const asFileName =
      "name" in answerSheetEntry && typeof answerSheetEntry.name === "string"
        ? answerSheetEntry.name
        : "answer_sheet.pdf";

    // 3. Ingest and validate documents through DocumentProcessingService
    await docService.ingestDocument(qpBuffer, qpFileName);
    await docService.ingestDocument(asBuffer, asFileName);

    // 4. Convert specific document pages to high-resolution previews / Data URLs & extract verbatim text
    const [qpResult, asResult] = await Promise.all([
      processPdfDocument(qpBuffer, qpFileName),
      processPdfDocument(asBuffer, asFileName),
    ]);

    const qpPageImages = qpResult.dataUrls;
    const asPageImages = asResult.dataUrls;
    const qpTexts = qpResult.pageTexts;
    const asTexts = asResult.pageTexts;

    const qpPageInputs: QuestionPaperPageInput[] = qpPageImages.map((dataUrl, idx) => ({
      pageNumber: idx + 1,
      dataUrl,
      imageBase64: dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : undefined,
      mimeType: dataUrl.startsWith("data:image/png")
        ? "image/png"
        : dataUrl.startsWith("data:image/jpeg")
        ? "image/jpeg"
        : "image/svg+xml",
      extractedText: qpTexts[idx] || undefined,
    }));

    const asPageInputs: AnswerSheetPageInput[] = asPageImages.map((dataUrl, idx) => ({
      pageNumber: idx + 1,
      dataUrl,
      imageBase64: dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : undefined,
      mimeType: dataUrl.startsWith("data:image/png")
        ? "image/png"
        : dataUrl.startsWith("data:image/jpeg")
        ? "image/jpeg"
        : "image/svg+xml",
      extractedText: asTexts[idx] || undefined,
    }));

    // 5. AI Step: Question Extraction from actual uploaded images
    const extractedQP = await extractQuestionsFromImages(qpPageInputs, {
      fileName: qpFileName,
    });

    // 6. AI Step: Handwritten Answer Extraction from actual uploaded images
    const extractedAS = await extractAnswersFromImages(asPageInputs, {
      fileName: asFileName,
    });

    // 7. AI Step: Hybrid Multi-Signal Matching (Label + Semantic + Sequential)
    const mappingReport = await mapQuestionsToAnswers(
      extractedQP.questions,
      extractedAS.answers
    );

    // 8. AI Step: Grading student responses for each question
    const gradeInputs: GradeInput[] = extractedQP.questions.map((q) => {
      const mapping = mappingReport.mappings.find((m) => m.question_id === q.id);
      const matchedBlockId = mapping?.matched_answer_ids?.[0];
      const matchedAnswer = extractedAS.answers.find((a) => a.id === matchedBlockId);

      return {
        question_id: q.id,
        question_number: q.question_number,
        question_text: q.text,
        max_marks: q.max_marks || 5,
        transcribed_answer: matchedAnswer?.handwritten_text || null,
        status: mapping?.status || "unanswered",
      };
    });

    const batchGrades = await gradeBatchAssessment(gradeInputs);

    // 9. Format Unified UI Question Items with Normalized Bounding Boxes
    const uiQuestions: QuestionItem[] = extractedQP.questions.map((q, idx) => {
      const mapping = mappingReport.mappings.find((m) => m.question_id === q.id);
      const matchedBlockId = mapping?.matched_answer_ids?.[0];
      const matchedAnswer = extractedAS.answers.find((a) => a.id === matchedBlockId);
      const grade = batchGrades.grades[q.id];

      // Extract numerical question number
      const parsedNum = parseInt(q.question_number.replace(/\D/g, "") || `${idx + 1}`, 10);
      const isSubpart = q.question_number.includes("(") || /[a-z]/i.test(q.question_number);

      const maxMarks = q.max_marks || grade?.max_marks || (isSubpart ? 3 : 2);
      const awardedMarks =
        grade !== undefined
          ? grade.awarded_marks
          : mapping?.status === "matched"
          ? maxMarks
          : 0;
      const feedback =
        grade?.feedback ||
        (mapping?.status === "matched"
          ? `Correct response mapped for Q${q.question_number}.`
          : `No matching answer detected for Question ${q.question_number}.`);

      // Compute bounding box strictly when a valid matched answer block exists
      const isMatched = mapping?.status === "matched" && Boolean(matchedAnswer);

      const boundingBox = isMatched && matchedAnswer
        ? {
            id: `bbox-${matchedAnswer.id}`,
            x: Number((matchedAnswer.bounding_box.xmin * 100).toFixed(2)),
            y: Number((matchedAnswer.bounding_box.ymin * 100).toFixed(2)),
            width: Number(
              ((matchedAnswer.bounding_box.xmax - matchedAnswer.bounding_box.xmin) * 100).toFixed(2)
            ),
            height: Number(
              ((matchedAnswer.bounding_box.ymax - matchedAnswer.bounding_box.ymin) * 100).toFixed(2)
            ),
            xmin: Number((matchedAnswer.bounding_box.xmin * 1000).toFixed(1)),
            ymin: Number((matchedAnswer.bounding_box.ymin * 1000).toFixed(1)),
            xmax: Number((matchedAnswer.bounding_box.xmax * 1000).toFixed(1)),
            ymax: Number((matchedAnswer.bounding_box.ymax * 1000).toFixed(1)),
            label: matchedAnswer.detected_question_label || `Q${q.question_number}`,
            page: matchedAnswer.page_number,
          }
        : undefined;

      return {
        id: q.id,
        questionNumber: parsedNum,
        subLabel: isSubpart ? q.question_number : undefined,
        questionText: q.text,
        maxMarks,
        awardedMarks,
        aiFeedback: feedback,
        answerPage: isMatched && matchedAnswer ? matchedAnswer.page_number : undefined,
        boundingBox,
        status: isMatched ? "matched" : mapping?.status || "unanswered",
        confidence: mapping?.confidence || 0.0,
        matchedAnswerIds: mapping?.matched_answer_ids || [],
        handwrittenText: isMatched && matchedAnswer ? matchedAnswer.handwritten_text : "",
      };
    });

    const responsePayload: AssessmentProcessResponse = {
      success: true,
      questions: uiQuestions,
      rawQuestions: extractedQP.questions,
      answers: extractedAS.answers,
      mappings: mappingReport.mappings,
      unmapped_answers: mappingReport.unmapped_answers,
      page_images: {
        question_paper: qpPageImages,
        answer_sheet: asPageImages,
      },
      summary: mappingReport.summary,
      overall_confidence: mappingReport.overall_confidence,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("API /api/process-assessment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process assessment.",
      },
      { status: 500 }
    );
  }
}
