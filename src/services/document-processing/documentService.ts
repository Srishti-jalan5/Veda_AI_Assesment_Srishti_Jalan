import {
  DocumentIngestOptions,
  DocumentValidationResult,
  PageMetadata,
  ProcessedDocument,
} from "./types";
import { formatBytes, validateDocument } from "./validator";
import { processImageBuffer } from "./imageProcessor";
import { processPdfBuffer } from "./pdfProcessor";
import { tempFileManager } from "./tempFileManager";

export class DocumentProcessingService {
  /**
   * Helper to convert various input types (File, Blob, ArrayBuffer, Uint8Array) into a standard Uint8Array
   */
  public async toUint8Array(
    input: File | Blob | Uint8Array | ArrayBuffer
  ): Promise<Uint8Array> {
    if (input instanceof Uint8Array) {
      return input;
    }
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
    if (typeof Blob !== "undefined" && input instanceof Blob) {
      const buffer = await input.arrayBuffer();
      return new Uint8Array(buffer);
    }
    throw new Error("Invalid document input type provided.");
  }

  /**
   * Validates a document buffer against size and format constraints
   */
  public validate(
    buffer: Uint8Array,
    fileName: string,
    options?: DocumentIngestOptions
  ): DocumentValidationResult {
    return validateDocument(buffer, fileName, options?.maxFileSizeBytes);
  }

  /**
   * Ingests, validates, detects pages, preprocesses, and registers a document
   */
  public async ingestDocument(
    input: File | Blob | Uint8Array | ArrayBuffer,
    fileName: string,
    options: DocumentIngestOptions = {}
  ): Promise<ProcessedDocument> {
    const buffer = await this.toUint8Array(input);

    // 1. Validation Step
    const validation = this.validate(buffer, fileName, options);
    if (!validation.isValid || !validation.detectedMimeType) {
      throw new Error(validation.error || "Document validation failed.");
    }

    const mimeType = validation.detectedMimeType;
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fileSizeBytes = buffer.length;
    const fileSizeFormatted = formatBytes(fileSizeBytes);

    let pageCount = 1;
    let pages: PageMetadata[] = [];

    // 2. Format-Specific Processing
    if (mimeType === "application/pdf") {
      const pdfResult = await processPdfBuffer(buffer, {
        generatePageBuffers: options.generatePageBuffers,
        generateDataUrls: options.generateDataUrls,
      });
      pageCount = pdfResult.pageCount;
      pages = pdfResult.pages;
    } else {
      // Image Processing (JPG, PNG, WebP)
      const imagePage = processImageBuffer(
        buffer,
        mimeType,
        options.generateDataUrls !== false
      );
      pageCount = 1;
      pages = [imagePage];
    }

    // 3. Store in Temporary File Manager
    tempFileManager.storeFile(docId, fileName, mimeType, buffer);

    const processedDoc: ProcessedDocument = {
      id: docId,
      fileName,
      fileSizeBytes,
      fileSizeFormatted,
      mimeType,
      pageCount,
      pages,
      createdAt: new Date(),
      rawBuffer: buffer,
    };

    return processedDoc;
  }

  /**
   * Retrieves page metadata by document ID and page number
   */
  public getStoredFile(documentId: string) {
    return tempFileManager.getFile(documentId);
  }

  /**
   * Explicitly frees a document from memory
   */
  public releaseDocument(documentId: string): boolean {
    return tempFileManager.releaseFile(documentId);
  }

  /**
   * Cleans up all stored files
   */
  public clearAll(): void {
    tempFileManager.clearAll();
  }
}

export const documentProcessingService = new DocumentProcessingService();
