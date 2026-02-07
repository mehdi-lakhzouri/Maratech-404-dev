/**
 * File Storage Interface
 * ----------------------
 * Abstract interface for file storage providers.
 * Implementations: LocalStorageAdapter, S3Adapter (stub)
 */
export interface StoredFile {
  storageKey: string;
  storageProvider: 'local' | 's3';
  fileUrl?: string;
}

export interface FileStorageAdapter {
  /**
   * Save a file buffer to storage.
   * @returns The storage key and provider metadata.
   */
  save(
    publicId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<StoredFile>;

  /**
   * Read a file from storage.
   * @returns The file buffer.
   */
  read(storageKey: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Check if a file exists.
   */
  exists(storageKey: string): Promise<boolean>;
}

export const FILE_STORAGE_TOKEN = 'FILE_STORAGE';
