import { PageMetadata, SupportedMimeType } from "./types";

/**
 * Extracts width and height from PNG binary header
 */
export function getPngDimensions(
  buffer: Uint8Array
): { width: number; height: number } | null {
  // PNG IHDR chunk is located at byte 16 (width: 16-19, height: 20-23 in Big Endian)
  if (buffer.length < 24) return null;

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);

  return { width, height };
}

/**
 * Extracts width and height from JPEG/JPG binary stream by finding SOF (Start of Frame) markers
 */
export function getJpegDimensions(
  buffer: Uint8Array
): { width: number; height: number } | null {
  let offset = 2;
  const len = buffer.length;

  while (offset < len) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];

    // Markers with dimensions: SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2) ... SOF15
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      if (offset + 8 < len) {
        const view = new DataView(
          buffer.buffer,
          buffer.byteOffset + offset,
          buffer.byteLength - offset
        );
        const height = view.getUint16(5, false);
        const width = view.getUint16(7, false);
        return { width, height };
      }
    }

    // Skip to next marker by reading chunk length
    if (offset + 3 < len) {
      const view = new DataView(
        buffer.buffer,
        buffer.byteOffset + offset,
        buffer.byteLength - offset
      );
      const chunkLength = view.getUint16(2, false);
      offset += 2 + chunkLength;
    } else {
      break;
    }
  }

  return null;
}

/**
 * Extracts dimensions from WebP binary
 */
export function getWebpDimensions(
  buffer: Uint8Array
): { width: number; height: number } | null {
  if (buffer.length < 30) return null;

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  // VP8 chunk
  if (
    buffer[12] === 0x56 &&
    buffer[13] === 0x50 &&
    buffer[14] === 0x38 &&
    buffer[15] === 0x20
  ) {
    const width = (view.getUint16(26, true) & 0x3fff);
    const height = (view.getUint16(28, true) & 0x3fff);
    return { width, height };
  }

  return null;
}

/**
 * Converts a Uint8Array buffer to base64 Data URL
 */
export function bufferToDataUrl(
  buffer: Uint8Array,
  mimeType: SupportedMimeType
): string {
  // In Node.js environment
  if (typeof Buffer !== "undefined") {
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }

  // In Browser environment
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Preprocesses an image buffer into standardized PageMetadata
 */
export function processImageBuffer(
  buffer: Uint8Array,
  mimeType: SupportedMimeType,
  generateDataUrl: boolean = true
): PageMetadata {
  let dimensions: { width: number; height: number } | null = null;

  if (mimeType === "image/png") {
    dimensions = getPngDimensions(buffer);
  } else if (mimeType === "image/jpeg") {
    dimensions = getJpegDimensions(buffer);
  } else if (mimeType === "image/webp") {
    dimensions = getWebpDimensions(buffer);
  }

  const width = dimensions?.width || 1200;
  const height = dimensions?.height || 1600;
  const aspectRatio = Number((width / height).toFixed(4));

  const format =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
      ? "webp"
      : "jpeg";

  const dataUrl = generateDataUrl ? bufferToDataUrl(buffer, mimeType) : undefined;

  return {
    pageNumber: 1,
    width,
    height,
    aspectRatio,
    rotation: 0,
    format,
    sizeBytes: buffer.length,
    dataUrl,
    previewBuffer: buffer,
  };
}
