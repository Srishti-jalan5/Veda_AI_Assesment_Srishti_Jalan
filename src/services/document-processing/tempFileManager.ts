import { SupportedMimeType, TempFileEntry } from "./types";

export class TempFileManager {
  private store: Map<string, TempFileEntry> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlMinutes: number = 30) {
    this.defaultTtlMs = defaultTtlMinutes * 60 * 1000;
  }

  /**
   * Stores a temporary file buffer with an expiration timestamp
   */
  public storeFile(
    id: string,
    fileName: string,
    mimeType: SupportedMimeType,
    buffer: Uint8Array,
    ttlMs: number = this.defaultTtlMs
  ): TempFileEntry {
    this.cleanupExpired();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    const entry: TempFileEntry = {
      id,
      fileName,
      mimeType,
      buffer,
      createdAt: now,
      expiresAt,
    };

    this.store.set(id, entry);
    return entry;
  }

  /**
   * Retrieves a temporary file buffer by its ID if not expired
   */
  public getFile(id: string): TempFileEntry | null {
    const entry = this.store.get(id);
    if (!entry) return null;

    if (new Date() > entry.expiresAt) {
      this.store.delete(id);
      return null;
    }

    return entry;
  }

  /**
   * Explicitly releases and frees a temporary document from memory
   */
  public releaseFile(id: string): boolean {
    return this.store.delete(id);
  }

  /**
   * Cleans up all expired entries
   */
  public cleanupExpired(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Clears all stored files
   */
  public clearAll(): void {
    this.store.clear();
  }

  /**
   * Returns current count of stored files
   */
  public size(): number {
    this.cleanupExpired();
    return this.store.size;
  }
}

export const tempFileManager = new TempFileManager();
