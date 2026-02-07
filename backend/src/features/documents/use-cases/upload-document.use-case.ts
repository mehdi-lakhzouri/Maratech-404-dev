import { Injectable, Inject, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { ulid } from 'ulid';
import { Types } from 'mongoose';
import { DocumentsRepository } from '../repositories/documents.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { FILE_STORAGE_TOKEN, FileStorageAdapter } from '../storage/file-storage.interface';
import { CreateDocumentDto } from '../dto/document.dto';

/** Allowed MIME types (configurable via env in production) */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]);

/** Max upload size: 10 MB */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@Injectable()
export class UploadDocumentUseCase {
  private readonly logger = new Logger(UploadDocumentUseCase.name);

  constructor(
    private readonly documentsRepo: DocumentsRepository,
    private readonly auditRepo: AuditLogRepository,
    @Inject(FILE_STORAGE_TOKEN)
    private readonly storage: FileStorageAdapter,
  ) {}

  async execute(
    dto: CreateDocumentDto,
    file: Express.Multer.File,
    actorId: string,
    idempotencyKey?: string,
  ) {
    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.documentsRepo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        this.logger.log(`Idempotent hit for key=${idempotencyKey}`);
        return existing;
      }
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(
        `La taille du fichier dépasse la limite de ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo`,
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé: ${file.mimetype}. Types acceptés: PDF, DOCX, XLSX, PNG, JPG`,
      );
    }

    // Generate public ID
    const publicId = ulid();

    // Sanitize filename: remove path separators, null bytes
    const safeFileName = file.originalname
      .replace(/[/\\:\0]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 200);

    // Compute SHA-256 checksum
    const checksumSha256 = createHash('sha256').update(file.buffer).digest('hex');

    // Store file
    const stored = await this.storage.save(publicId, safeFileName, file.buffer, file.mimetype);

    // Create document record
    const doc = await this.documentsRepo.create({
      publicId,
      title: dto.title,
      type: dto.type,
      description: dto.description,
      tags: dto.tags ?? [],
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      meetingId: dto.meetingId ? new Types.ObjectId(dto.meetingId) : undefined,
      storageProvider: stored.storageProvider,
      storageKey: stored.storageKey,
      fileUrl: stored.fileUrl,
      originalFileName: file.originalname,
      safeFileName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      checksumSha256,
      uploadedBy: new Types.ObjectId(actorId),
      uploadedAt: new Date(),
      idempotencyKey: idempotencyKey || undefined,
    });

    // Audit log
    await this.auditRepo.log({
      actorId,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'Document',
      entityId: publicId,
      summary: `Uploaded "${dto.title}" (${safeFileName})`,
      meta: { mimeType: file.mimetype, sizeBytes: file.size },
    });

    return doc;
  }
}
