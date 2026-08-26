import { PageMetadata } from "./types";
import { PDFDocument } from "pdf-lib";

/**
 * Fallback binary parser to count PDF pages if pdf-lib encountered unsupported features
 */
export function countPdfPagesFromBinary(buffer: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(buffer);

  // Match /Count in /Pages dictionary: /Type /Pages ... /Count N
  const countMatches = text.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/);
  if (countMatches && countMatches[1]) {
    const parsed = parseInt(countMatches[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Count instances of /Type /Page (isolated pages)
  const pageMatches = text.match(/\/Type\s*\/Page(?!\s*s)/g);
  if (pageMatches && pageMatches.length > 0) {
    return pageMatches.length;
  }

  return 1;
}

/**
 * Processes PDF buffer and extracts accurate page counts, dimensions, and metadata
 */
export async function processPdfBuffer(
  buffer: Uint8Array,
  options: {
    generatePageBuffers?: boolean;
    generateDataUrls?: boolean;
  } = {}
): Promise<{ pageCount: number; pages: PageMetadata[] }> {
  try {
    const pdfDoc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      parseSpeed: 1,
    });

    const pageCount = pdfDoc.getPageCount();
    const pdfPages = pdfDoc.getPages();
    const pages: PageMetadata[] = [];

    for (let i = 0; i < pageCount; i++) {
      const page = pdfPages[i];
      const { width, height } = page.getSize();
      const rotation = page.getRotation().angle;
      const aspectRatio = Number((width / height).toFixed(4));

      let pageBuffer: Uint8Array | undefined = undefined;

      // Extract isolated single-page PDF document buffer if requested
      if (options.generatePageBuffers) {
        try {
          const singlePageDoc = await PDFDocument.create();
          const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
          singlePageDoc.addPage(copiedPage);
          pageBuffer = await singlePageDoc.save();
        } catch {
          // Fallback if copy fails
          pageBuffer = undefined;
        }
      }

      pages.push({
        pageNumber: i + 1,
        width: Math.round(width),
        height: Math.round(height),
        aspectRatio,
        rotation,
        format: "pdf-page",
        previewBuffer: pageBuffer,
      });
    }

    return { pageCount, pages };
  } catch {
    // Graceful fallback using binary scanning
    const fallbackCount = countPdfPagesFromBinary(buffer);
    const pages: PageMetadata[] = [];

    for (let i = 1; i <= fallbackCount; i++) {
      pages.push({
        pageNumber: i,
        width: 595, // Standard A4 points (72 DPI)
        height: 842,
        aspectRatio: 0.7067,
        rotation: 0,
        format: "pdf-page",
      });
    }

    return { pageCount: fallbackCount, pages };
  }
}
