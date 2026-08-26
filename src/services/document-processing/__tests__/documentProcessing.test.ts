import { describe, it, expect, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  validateDocument,
  detectMimeTypeFromMagicBytes,
  formatBytes,
} from "../validator";
import { processPdfBuffer, countPdfPagesFromBinary } from "../pdfProcessor";
import { processImageBuffer, getPngDimensions } from "../imageProcessor";
import { tempFileManager } from "../tempFileManager";
import { documentProcessingService } from "../documentService";

describe("Document Processing Service — Unit Tests", () => {
  beforeEach(() => {
    tempFileManager.clearAll();
  });

  describe("1. Document Validation & Magic Bytes Detection", () => {
    it("should reject empty (0-byte) files with a clear error", () => {
      const emptyBuffer = new Uint8Array(0);
      const result = validateDocument(emptyBuffer, "test.pdf");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("empty");
      expect(result.fileSizeBytes).toBe(0);
    });

    it("should reject files exceeding the maximum file size limit", () => {
      const maxLimit = 1024 * 1024; // 1MB
      const largeBuffer = new Uint8Array(2 * 1024 * 1024); // 2MB
      // Add fake PDF header
      largeBuffer[0] = 0x25;
      largeBuffer[1] = 0x50;
      largeBuffer[2] = 0x44;
      largeBuffer[3] = 0x46;

      const result = validateDocument(largeBuffer, "large.pdf", maxLimit);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exceeds the maximum allowed limit");
    });

    it("should correctly detect PDF magic bytes (%PDF-)", () => {
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
      const mime = detectMimeTypeFromMagicBytes(pdfHeader);

      expect(mime).toBe("application/pdf");
    });

    it("should correctly detect PNG magic bytes", () => {
      const pngHeader = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const mime = detectMimeTypeFromMagicBytes(pngHeader);

      expect(mime).toBe("image/png");
    });

    it("should correctly detect JPEG magic bytes (FF D8 FF)", () => {
      const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const mime = detectMimeTypeFromMagicBytes(jpegHeader);

      expect(mime).toBe("image/jpeg");
    });

    it("should reject unrecognized or corrupted file formats", () => {
      const randomGarbage = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a]);
      const result = validateDocument(randomGarbage, "unknown.exe");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Unsupported file format");
    });
  });

  describe("2. PDF Page Counting & Metadata Extraction", () => {
    it("should accurately count pages and extract dimensions for a 1-page PDF", async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([600, 800]);
      const pdfBytes = await pdfDoc.save();

      const { pageCount, pages } = await processPdfBuffer(pdfBytes);

      expect(pageCount).toBe(1);
      expect(pages).toHaveLength(1);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].width).toBe(600);
      expect(pages[0].height).toBe(800);
      expect(pages[0].aspectRatio).toBeCloseTo(0.75);
      expect(pages[0].format).toBe("pdf-page");
    });

    it("should accurately count pages and extract metadata for a 4-page PDF", async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595, 842]); // A4 Page 1
      pdfDoc.addPage([595, 842]); // A4 Page 2
      pdfDoc.addPage([595, 842]); // A4 Page 3
      pdfDoc.addPage([595, 842]); // A4 Page 4
      const pdfBytes = await pdfDoc.save();

      const { pageCount, pages } = await processPdfBuffer(pdfBytes, {
        generatePageBuffers: true,
      });

      expect(pageCount).toBe(4);
      expect(pages).toHaveLength(4);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[3].pageNumber).toBe(4);
      expect(pages[0].previewBuffer).toBeDefined();
    });

    it("should correctly count pages using fallback binary parser", () => {
      const rawPdfText = "%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count 3 /Kids [] >>\nendobj\n";
      const buffer = new TextEncoder().encode(rawPdfText);
      const count = countPdfPagesFromBinary(buffer);

      expect(count).toBe(3);
    });
  });

  describe("3. Image Preprocessing & Dimensions", () => {
    it("should extract dimensions and generate page metadata for PNG", () => {
      // Minimal valid PNG binary header with 800x600 IHDR
      const pngBuffer = new Uint8Array(33);
      pngBuffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); // Signature
      pngBuffer.set([0x00, 0x00, 0x00, 0x0d], 8); // IHDR length
      pngBuffer.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
      // Width: 800 (0x00000320)
      pngBuffer[16] = 0x00;
      pngBuffer[17] = 0x00;
      pngBuffer[18] = 0x03;
      pngBuffer[19] = 0x20;
      // Height: 600 (0x00000258)
      pngBuffer[20] = 0x00;
      pngBuffer[21] = 0x00;
      pngBuffer[22] = 0x02;
      pngBuffer[23] = 0x58;

      const dimensions = getPngDimensions(pngBuffer);
      expect(dimensions).toEqual({ width: 800, height: 600 });

      const pageMetadata = processImageBuffer(pngBuffer, "image/png", true);
      expect(pageMetadata.pageNumber).toBe(1);
      expect(pageMetadata.width).toBe(800);
      expect(pageMetadata.height).toBe(600);
      expect(pageMetadata.aspectRatio).toBeCloseTo(1.3333, 3);
      expect(pageMetadata.format).toBe("png");
      expect(pageMetadata.dataUrl).toContain("data:image/png;base64,");
    });
  });

  describe("4. End-to-End Document Ingestion Service", () => {
    it("should ingest a multi-page PDF end-to-end and store it in TempFileManager", async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595, 842]);
      pdfDoc.addPage([595, 842]);
      const pdfBytes = await pdfDoc.save();

      const doc = await documentProcessingService.ingestDocument(
        pdfBytes,
        "Unit_Test_Answer_Sheet.pdf"
      );

      expect(doc.id).toMatch(/^doc_/);
      expect(doc.fileName).toBe("Unit_Test_Answer_Sheet.pdf");
      expect(doc.mimeType).toBe("application/pdf");
      expect(doc.pageCount).toBe(2);
      expect(doc.pages).toHaveLength(2);
      expect(doc.fileSizeBytes).toBeGreaterThan(0);

      // Verify it's stored in TempFileManager
      const stored = documentProcessingService.getStoredFile(doc.id);
      expect(stored).not.toBeNull();
      expect(stored?.fileName).toBe("Unit_Test_Answer_Sheet.pdf");

      // Verify release
      const released = documentProcessingService.releaseDocument(doc.id);
      expect(released).toBe(true);
      expect(documentProcessingService.getStoredFile(doc.id)).toBeNull();
    });

    it("should format bytes correctly into human readable strings", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
    });
  });
});
