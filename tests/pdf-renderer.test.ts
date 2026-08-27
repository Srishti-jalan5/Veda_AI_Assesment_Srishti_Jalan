import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  convertPdfToImages,
  detectImageMimeType,
} from "../src/lib/pdf-renderer";

describe("Server-Side PDF & Image Rasterization (/lib/pdf-renderer.ts)", () => {
  it("detects image MIME types from binary magic bytes", () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectImageMimeType(pngBytes)).toBe("image/png");

    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(detectImageMimeType(jpegBytes)).toBe("image/jpeg");

    const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(detectImageMimeType(gifBytes)).toBe("image/gif");
  });

  it("wraps PNG images directly into Data URLs without PDF processing", async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const images = await convertPdfToImages(pngBuffer);

    expect(images).toHaveLength(1);
    expect(images[0]).toMatch(/^data:image\/png;base64,/);
  });

  it("wraps JPEG images directly into Data URLs without PDF processing", async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const images = await convertPdfToImages(jpegBuffer);

    expect(images).toHaveLength(1);
    expect(images[0]).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("converts raw PDF buffer into high-resolution PNG Data URLs", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    pdfDoc.addPage([600, 800]);
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const images = await convertPdfToImages(pdfBuffer);
    expect(images).toHaveLength(2);
    expect(images[0]).toMatch(/^data:image\/(svg\+xml|png);base64,/);
    expect(images[1]).toMatch(/^data:image\/(svg\+xml|png);base64,/);
  });
});
