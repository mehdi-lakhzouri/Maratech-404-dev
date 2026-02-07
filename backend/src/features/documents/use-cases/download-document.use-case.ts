import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DocumentsRepository } from '../repositories/documents.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { FILE_STORAGE_TOKEN, FileStorageAdapter } from '../storage/file-storage.interface';

@Injectable()
export class DownloadDocumentUseCase {
  private readonly logger = new Logger(DownloadDocumentUseCase.name);

  constructor(
    private readonly documentsRepo: DocumentsRepository,
    private readonly auditRepo: AuditLogRepository,
    @Inject(FILE_STORAGE_TOKEN)
    private readonly storage: FileStorageAdapter,
  ) {}

  async execute(publicId: string, actorId: string) {
    const doc = await this.documentsRepo.findByPublicId(publicId);
    if (!doc) {
      throw new NotFoundException(`Document introuvable: ${publicId}`);
    }

    const buffer = await this.storage.read(doc.storageKey);

    // Audit download
    await this.auditRepo.log({
      actorId,
      action: 'DOCUMENT_DOWNLOAD',
      entityType: 'Document',
      entityId: publicId,
      summary: `Downloaded "${doc.title}"`,
    });

    return {
      buffer,
      mimeType: doc.mimeType,
      safeFileName: doc.safeFileName,
      originalFileName: doc.originalFileName,
    };
  }
}
