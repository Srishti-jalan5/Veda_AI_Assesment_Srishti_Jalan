import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
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
 * This completely prevents "Cannot perform Construct on a detached ArrayBuffer" errors.
 */
export function toClonedUint8Array(buffer: Buffer | Uint8Array): Uint8Array {
  const src = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const copy = new Uint8Array(src.byteLength);
  copy.set(src);
  return copy;
}

type CreateCanvasType = typeof import("@napi-rs/canvas").createCanvas;
let cachedCreateCanvas: CreateCanvasType | null = null;

async function getCreateCanvas(): Promise<CreateCanvasType | null> {
  if (cachedCreateCanvas) return cachedCreateCanvas;
  try {
    const napi = await import("@napi-rs/canvas");
    cachedCreateCanvas = napi.createCanvas;
    return cachedCreateCanvas;
  } catch (err) {
    console.warn("Failed to load @napi-rs/canvas:", err);
    return null;
  }
}

export interface RenderedDocumentResult {
  dataUrls: string[];
  pageTexts: string[];
}

/**
 * Extracts verbatim text per page from a PDF buffer.
 */
export async function extractTextFromPdf(
  buffer: Buffer | Uint8Array
): Promise<string[]> {
  const bytes = toClonedUint8Array(buffer);
  try {
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      useSystemFonts: true,
      disableFontFace: false,
    });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const texts: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      texts.push(pageText);
    }
    return texts;
  } catch (err) {
    console.warn("Failed to extract text with pdfjs:", err);
    return [];
  }
}

/**
 * Extracts embedded image streams from scanned PDF files.
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
 * Unified PDF document processor: renders pages to PNG images and extracts text in a single pass.
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

  // 2. Primary Rasterizer & Text Extractor (Single-Pass)
  const createCanvas = await getCreateCanvas();
  if (createCanvas) {
    try {
      const loadingTask = pdfjs.getDocument({
        data: toClonedUint8Array(bytes),
        useSystemFonts: true,
        disableFontFace: false,
      });
      const pdfDoc = await loadingTask.promise;
      const pageCount = pdfDoc.numPages;
      const dataUrls: string[] = [];
      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);

        // A. Extract text content
        let pageText = "";
        try {
          const content = await page.getTextContent();
          pageText = content.items
            .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        } catch {
          // Ignore text errors
        }
        pageTexts.push(pageText);

        // B. Render canvas PNG (150 DPI)
        const viewport = page.getViewport({ scale: 1.5 });
        const width = Math.max(1, Math.floor(viewport.width));
        const height = Math.max(1, Math.floor(viewport.height));

        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);

        const renderContext = {
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport: viewport,
        };

        await (page.render as (params: unknown) => { promise: Promise<unknown> })(renderContext).promise;

        const pngBuffer = canvas.toBuffer("image/png");
        const base64Png = Buffer.from(pngBuffer).toString("base64");
        dataUrls.push(`data:image/png;base64,${base64Png}`);
      }

      if (dataUrls.length > 0) {
        return { dataUrls, pageTexts };
      }
    } catch (canvasError) {
      console.warn("Canvas PDF rasterization fell back to embedded extraction:", canvasError);
    }
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
 * Converts a raw PDF buffer or Image buffer into an array of high-resolution Data URL PNG strings (150-200 DPI).
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
