import { Injectable, Logger } from '@nestjs/common';
import { FileStorageAdapter, StoredFile } from './file-storage.interface';

/**
 * S3 Storage Adapter (Stub)
 * -------------------------
 * Placeholder for AWS S3 / MinIO integration.
 * NOT implemented – throws on use. Wire up with real SDK for production.
 */
@Injectable()
export class S3StorageAdapter implements FileStorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);

  async save(
    publicId: string,
    fileName: string,
    _buffer: Buffer,
    _mimeType: string,
  ): Promise<StoredFile> {
    const timestamp = Date.now();
    const storageKey = `documents/${publicId}/${timestamp}-${fileName}`;

    // TODO: implement S3 putObject
    this.logger.warn('S3StorageAdapter.save() is a stub – not implemented');
    throw new Error('S3 storage not implemented');

    return {
      storageKey,
      storageProvider: 's3',
      fileUrl: `https://s3.example.com/${storageKey}`,
    };
  }

  async read(_storageKey: string): Promise<Buffer> {
    throw new Error('S3 storage not implemented');
  }

  async delete(_storageKey: string): Promise<void> {
    throw new Error('S3 storage not implemented');
  }

  async exists(_storageKey: string): Promise<boolean> {
    throw new Error('S3 storage not implemented');
  }
}
