import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStorageAdapter, StoredFile } from './file-storage.interface';

/**
 * Local Filesystem Storage Adapter
 * ---------------------------------
 * Stores files on the local filesystem under ./uploads/documents/
 * For development use only. Use S3Adapter for production.
 */
@Injectable()
export class LocalStorageAdapter implements FileStorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly basePath: string;

  constructor() {
    this.basePath = path.resolve(process.cwd(), 'uploads', 'documents');
  }

  async save(
    publicId: string,
    fileName: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<StoredFile> {
    const dir = path.join(this.basePath, publicId);
    await fs.mkdir(dir, { recursive: true });

    const timestamp = Date.now();
    const storageKey = `documents/${publicId}/${timestamp}-${fileName}`;
    const fullPath = path.join(this.basePath, publicId, `${timestamp}-${fileName}`);

    await fs.writeFile(fullPath, buffer);
    this.logger.log(`File saved: ${storageKey}`);

    return {
      storageKey,
      storageProvider: 'local',
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    // storageKey = "documents/{publicId}/{timestamp}-{filename}"
    const relativePath = storageKey.replace(/^documents\//, '');
    const fullPath = path.join(this.basePath, relativePath);
    return fs.readFile(fullPath);
  }

  async delete(storageKey: string): Promise<void> {
    const relativePath = storageKey.replace(/^documents\//, '');
    const fullPath = path.join(this.basePath, relativePath);
    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${storageKey}`);
    } catch (err) {
      this.logger.warn(`Failed to delete file: ${storageKey}`, err);
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const relativePath = storageKey.replace(/^documents\//, '');
    const fullPath = path.join(this.basePath, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
