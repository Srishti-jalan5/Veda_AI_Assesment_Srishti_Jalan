import * as mupdf from "mupdf";
import { PDFDocument, PDFName, PDFDict, PDFRawStream } from "pdf-lib";

/**
 * Checks if a buffer represents an image based on magic numbers
 */
export function detectImageMimeType(buffer: Buffer | Uint8Array): string | null {
  if (!buffer || buffer.length < 4) return null;
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Creates a fresh, deep-copied Uint8Array with its own independent ArrayBuffer.
 */
export function toClonedUint8Array(buffer: Buffer | Uint8Array): Uint8Array {
  const src = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const copy = new Uint8Array(src.byteLength);
  copy.set(src);
  return copy;
}

export interface RenderedDocumentResult {
  dataUrls: string[];
  pageTexts: string[];
}

/**
 * Extracts verbatim text per page from a PDF buffer using WASM MuPDF.
 */
export async function extractTextFromPdf(
  buffer: Buffer | Uint8Array
): Promise<string[]> {
  const bytes = toClonedUint8Array(buffer);
  try {
    const doc = mupdf.Document.openDocument(bytes, "application/pdf");
    const pageCount = doc.countPages();
    const texts: string[] = [];

    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      let pageText = "";
      try {
        const structuredText = page.toStructuredText();
        pageText = structuredText.asText().replace(/\s+/g, " ").trim();
      } catch {
        pageText = "";
      }
      texts.push(pageText);
    }
    return texts;
  } catch (err) {
    console.warn("MuPDF text extraction note:", (err as Error).message);
    return [];
  }
}

/**
 * Extracts embedded image streams from scanned PDF files using pdf-lib.
 */
export async function extractEmbeddedImagesFromPdf(
  buffer: Buffer | Uint8Array
): Promise<Array<{ pageNumber: number; dataUrl: string }>> {
  const bytes = toClonedUint8Array(buffer);
  const results: Array<{ pageNumber: number; dataUrl: string }> = [];

  try {
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { node } = page;
      const resources = node.Resources();
      if (!resources) continue;

      const xObjects = resources.get(PDFName.of("XObject"));
      if (xObjects instanceof PDFDict) {
        for (const [, ref] of xObjects.entries()) {
          const xObject = pdfDoc.context.lookup(ref);
          if (xObject instanceof PDFRawStream) {
            const dict = xObject.dict;
            const subtype = dict.get(PDFName.of("Subtype"));
            if (subtype === PDFName.of("Image")) {
              const filter = dict.get(PDFName.of("Filter"));
              const contents = xObject.getContents();
              if (
                filter === PDFName.of("DCTDecode") ||
                filter === PDFName.of("JPXDecode")
              ) {
                const base64 = Buffer.from(contents).toString("base64");
                results.push({
                  pageNumber: i + 1,
                  dataUrl: `data:image/jpeg;base64,${base64}`,
                });
                break;
              } else if (contents && contents.length > 500) {
                const mime = detectImageMimeType(contents) || "image/png";
                const base64 = Buffer.from(contents).toString("base64");
                results.push({
                  pageNumber: i + 1,
                  dataUrl: `data:${mime};base64,${base64}`,
                });
                break;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Embedded image extraction note:", err);
  }

  return results;
}

/**
 * Unified WASM-compatible PDF document processor:
 * Renders pages to PNG images and extracts text in a single pass using MuPDF WASM.
 * Works seamlessly in Vercel Serverless / AWS Lambda without native C++ / Cairo dependencies.
 */
export async function processPdfDocument(
  buffer: Buffer | Uint8Array,
  mimeType?: string
): Promise<RenderedDocumentResult> {
  const bytes = toClonedUint8Array(buffer);

  // 1. If buffer is already an image (PNG, JPEG, WEBP, GIF), wrap directly into Data URL
  const detectedMime =
    detectImageMimeType(bytes) || (mimeType?.startsWith("image/") ? mimeType : null);
  if (detectedMime) {
    const base64 = Buffer.from(bytes).toString("base64");
    return {
      dataUrls: [`data:${detectedMime};base64,${base64}`],
      pageTexts: [""],
    };
  }

  // 2. Primary WASM Rasterizer & Text Extractor (MuPDF)
  try {
    const doc = mupdf.Document.openDocument(bytes, "application/pdf");
    const pageCount = doc.countPages();
    const dataUrls: string[] = [];
    const pageTexts: string[] = [];

    // Scale 1.5 corresponds to ~150 DPI crisp text and diagram rendering
    const scaleMatrix = mupdf.Matrix.scale(1.5, 1.5);

    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);

      // A. Extract text content
      let pageText = "";
      try {
        const structuredText = page.toStructuredText();
        pageText = structuredText.asText().replace(/\s+/g, " ").trim();
      } catch {
        pageText = "";
      }
      pageTexts.push(pageText);

      // B. Render pixmap to PNG data URL
      const pixmap = page.toPixmap(scaleMatrix, mupdf.ColorSpace.DeviceRGB, false);
      const pngBytes = pixmap.asPNG();
      const base64Png = Buffer.from(pngBytes).toString("base64");
      dataUrls.push(`data:image/png;base64,${base64Png}`);
    }

    if (dataUrls.length > 0) {
      return { dataUrls, pageTexts };
    }
  } catch (mupdfError) {
    console.warn("MuPDF rendering note:", (mupdfError as Error).message);
  }

  // 3. Fallback: Extract embedded scan images if present
  const embeddedImages = await extractEmbeddedImagesFromPdf(bytes);
  if (embeddedImages.length > 0) {
    const dataUrls = embeddedImages.map((e) => e.dataUrl);
    const pageTexts = new Array(dataUrls.length).fill("");
    return { dataUrls, pageTexts };
  }

  throw new Error("PDF Processing Failed: Could not render pages to PNG images.");
}

/**
 * Converts a raw PDF buffer or Image buffer into an array of high-resolution Data URL PNG strings (150 DPI).
 */
export async function convertPdfToImages(
  buffer: Buffer | Uint8Array,
  mimeType?: string
): Promise<string[]> {
  const res = await processPdfDocument(buffer, mimeType);
  return res.dataUrls;
}

// Clean alias export
export const convertDocumentToPageImages = convertPdfToImages;
