export type SupportedMimeType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface PageMetadata {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number;
  rotation: number;
  format: "pdf-page" | "jpeg" | "png" | "webp";
  sizeBytes?: number;
  dataUrl?: string;
  previewBuffer?: Uint8Array;
}

export interface DocumentValidationResult {
  isValid: boolean;
  error?: string;
  detectedMimeType?: SupportedMimeType;
  fileSizeBytes: number;
}

export interface DocumentIngestOptions {
  maxFileSizeBytes?: number; // Defaults to 10MB (10 * 1024 * 1024)
  generateDataUrls?: boolean; // Whether to generate base64 data URLs for pages/images
  generatePageBuffers?: boolean; // Whether to extract individual page buffers for PDF
}

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  mimeType: SupportedMimeType;
  pageCount: number;
  pages: PageMetadata[];
  createdAt: Date;
  rawBuffer?: Uint8Array;
}

export interface TempFileEntry {
  id: string;
  fileName: string;
  mimeType: SupportedMimeType;
  buffer: Uint8Array;
  createdAt: Date;
  expiresAt: Date;
}
