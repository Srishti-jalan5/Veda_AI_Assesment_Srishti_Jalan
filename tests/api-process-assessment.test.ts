import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../src/app/api/process-assessment/route";
import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";

describe("POST /api/process-assessment", () => {
  const originalEnv = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    global.fetch = originalFetch;
  });

  it("processes assessment documents and returns unified mapping payload", async () => {
    // Mock Vision LLM Responses for Question and Answer extractions
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("generateContent")) {
        // Return structured Gemini LLM JSON response
        const mockQuestionsResponse = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      assessment_title: "Physics Midterm Exam",
                      total_marks: 10,
                      instructions: ["Answer all questions."],
                      questions: [
                        {
                          id: "q_1",
                          question_number: "1",
                          parent_question_number: null,
                          text: "State Ohm's Law and write its formula.",
                          max_marks: 5,
                          page_number: 1,
                          bounding_box: { xmin: 50, ymin: 50, xmax: 950, ymax: 200 },
                          confidence: 0.98,
                        },
                        {
                          id: "q_2",
                          question_number: "2",
                          parent_question_number: null,
                          text: "Define electric potential difference.",
                          max_marks: 5,
                          page_number: 1,
                          bounding_box: { xmin: 50, ymin: 220, xmax: 950, ymax: 400 },
                          confidence: 0.97,
                        },
                      ],
                      answers: [
                        {
                          id: "ans_1",
                          detected_question_label: "1",
                          handwritten_text: "Ohm's Law: V = I * R. Current is directly proportional to voltage.",
                          page_number: 1,
                          bounding_box: { xmin: 40, ymin: 60, xmax: 960, ymax: 240 },
                          confidence: 0.95,
                          is_scratch_work: false,
                          diagram_detected: false,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        };

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuestionsResponse),
          text: () => Promise.resolve(JSON.stringify(mockQuestionsResponse)),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const qpDoc = await PDFDocument.create();
    qpDoc.addPage([600, 800]);
    const qpBytes = await qpDoc.save();

    const asDoc = await PDFDocument.create();
    asDoc.addPage([600, 800]);
    const asBytes = await asDoc.save();

    const formData = new FormData();
    const dummyQp = new Blob([qpBytes as Uint8Array<ArrayBuffer>], {
      type: "application/pdf",
    });
    const dummyAs = new Blob([asBytes as Uint8Array<ArrayBuffer>], {
      type: "application/pdf",
    });

    formData.append("question_paper", dummyQp, "test_qp.pdf");
    formData.append("answer_sheet", dummyAs, "test_as.pdf");

    const req = new NextRequest("http://localhost:3000/api/process-assessment", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.questions)).toBe(true);
    expect(Array.isArray(json.answers)).toBe(true);
    expect(Array.isArray(json.mappings)).toBe(true);
    expect(Array.isArray(json.unmapped_answers)).toBe(true);
    expect(json.page_images).toHaveProperty("question_paper");
    expect(json.page_images).toHaveProperty("answer_sheet");

    // Verify Question items structure
    const firstQuestion = json.questions[0];
    expect(firstQuestion).toHaveProperty("id");
    expect(firstQuestion).toHaveProperty("questionNumber");
    expect(firstQuestion).toHaveProperty("questionText");
    expect(firstQuestion).toHaveProperty("boundingBox");
    expect(firstQuestion).toHaveProperty("status");

    // Verify summary
    expect(json.summary).toBeDefined();
    expect(json.summary.total_questions).toBeGreaterThan(0);
    expect(json.overall_confidence).toBeGreaterThanOrEqual(0);
  });

  it("rejects request with 400 when question_paper is missing", async () => {
    const formData = new FormData();
    const dummyAs = new Blob(["%PDF-1.4 Answer Sheet Mock"], {
      type: "application/pdf",
    });
    formData.append("answer_sheet", dummyAs, "test_as.pdf");

    const req = new NextRequest("http://localhost:3000/api/process-assessment", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Question paper file is required");
  });

  it("rejects request with 400 when answer_sheet is missing", async () => {
    const formData = new FormData();
    const dummyQp = new Blob(["%PDF-1.4 Question Paper Mock"], {
      type: "application/pdf",
    });
    formData.append("question_paper", dummyQp, "test_qp.pdf");

    const req = new NextRequest("http://localhost:3000/api/process-assessment", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Answer sheet file is required");
  });

  it("rejects request with 400 when empty 0-byte file is submitted", async () => {
    const formData = new FormData();
    const emptyBlob = new Blob([], { type: "application/pdf" });
    const validBlob = new Blob(["%PDF-1.4 Content"], { type: "application/pdf" });

    formData.append("question_paper", emptyBlob, "empty_qp.pdf");
    formData.append("answer_sheet", validBlob, "valid_as.pdf");

    const req = new NextRequest("http://localhost:3000/api/process-assessment", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("must not be empty");
  });
});
