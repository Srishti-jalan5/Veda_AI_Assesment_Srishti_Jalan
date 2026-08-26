import { DocumentValidationResult, SupportedMimeType } from "./types";

export const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Detects MIME type by examining binary magic bytes header
 */
export function detectMimeTypeFromMagicBytes(
  buffer: Uint8Array
): SupportedMimeType | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // PDF Magic Bytes: %PDF (0x25, 0x50, 0x44, 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // PNG Magic Bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG / JPG Magic Bytes: 0xFF, 0xD8, 0xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // WebP Magic Bytes: RIFF....WEBP (0x52, 0x49, 0x46, 0x46 ... 0x57, 0x45, 0x42, 0x50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Validates document buffer against size limits, emptiness, and supported file types
 */
export function validateDocument(
  buffer: Uint8Array,
  fileName: string,
  maxFileSizeBytes: number = DEFAULT_MAX_FILE_SIZE_BYTES
): DocumentValidationResult {
  const fileSizeBytes = buffer ? buffer.length : 0;

  // 1. Check for empty file
  if (!buffer || fileSizeBytes === 0) {
    return {
      isValid: false,
      error: "The uploaded file is empty (0 bytes). Please upload a valid document.",
      fileSizeBytes: 0,
    };
  }

  // 2. Check for file size limit
  if (fileSizeBytes > maxFileSizeBytes) {
    const sizeInMB = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    const maxInMB = (maxFileSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `File size (${sizeInMB}MB) exceeds the maximum allowed limit of ${maxInMB}MB.`,
      fileSizeBytes,
    };
  }

  // 3. Detect MIME type by magic bytes
  const detectedMimeType = detectMimeTypeFromMagicBytes(buffer);

  if (!detectedMimeType) {
    return {
      isValid: false,
      error: `Unsupported file format. Please upload a PDF or an image (JPG, JPEG, PNG, WebP).`,
      fileSizeBytes,
    };
  }

  // 4. Check for extension consistency (optional warning / check)
  const ext = fileName ? fileName.split(".").pop()?.toLowerCase() : "";
  if (detectedMimeType === "application/pdf" && ext && ext !== "pdf") {
    return {
      isValid: false,
      error: `File extension .${ext} does not match the detected PDF format.`,
      detectedMimeType,
      fileSizeBytes,
    };
  }

  return {
    isValid: true,
    detectedMimeType,
    fileSizeBytes,
  };
}

/**
 * Formats bytes to human-readable size string (e.g. 2.4 MB or 850 KB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}
