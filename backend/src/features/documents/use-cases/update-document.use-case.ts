import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { DocumentsRepository } from '../repositories/documents.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { FILE_STORAGE_TOKEN, FileStorageAdapter } from '../storage/file-storage.interface';
import { UpdateDocumentDto } from '../dto/document.dto';
import { UserRole } from '@features/users/entities/user-role.enum';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@Injectable()
export class UpdateDocumentUseCase {
  private readonly logger = new Logger(UpdateDocumentUseCase.name);

  constructor(
    private readonly documentsRepo: DocumentsRepository,
    private readonly auditRepo: AuditLogRepository,
    @Inject(FILE_STORAGE_TOKEN)
    private readonly storage: FileStorageAdapter,
  ) {}

  async execute(
    publicId: string,
    dto: UpdateDocumentDto,
    actorId: string,
    actorRole: UserRole,
    file?: Express.Multer.File,
  ) {
    const existingDoc = await this.documentsRepo.findByPublicId(publicId);
    if (!existingDoc) {
      throw new NotFoundException(`Document introuvable: ${publicId}`);
    }

    // Chef Projet can only update their own documents
    if (actorRole === UserRole.CHEF_PROJET) {
      const uploaderId = existingDoc.uploadedBy?.toString() || (existingDoc.uploadedBy as unknown as { _id: string })?._id?.toString();
      if (uploaderId !== actorId) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres documents');
      }
    }

    // If file is provided, replace it
    if (file) {
      // Validate file
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new BadRequestException(
          `La taille du fichier dépasse la limite de ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo`,
        );
      }

      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(
          `Type de fichier non autorisé: ${file.mimetype}`,
        );
      }

      // Delete old file
      await this.storage.delete(existingDoc.storageKey);

      // Upload new file
      const safeFileName = file.originalname
        .replace(/[\/\\:\0]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 200);

      const checksumSha256 = createHash('sha256').update(file.buffer).digest('hex');

      const stored = await this.storage.save(
        publicId,
        safeFileName,
        file.buffer,
        file.mimetype,
      );

      // Update document with new file info
      const updateData = {
        ...dto,
        storageProvider: stored.storageProvider,
        storageKey: stored.storageKey,
        fileUrl: stored.fileUrl,
        originalFileName: file.originalname,
        safeFileName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        checksumSha256,
      };

      const doc = await this.documentsRepo.updateByPublicId(publicId, updateData);
      if (!doc) {
        throw new NotFoundException(`Document introuvable après mise à jour: ${publicId}`);
      }

      this.logger.log(`Document "${doc.title}" updated with new file by ${actorId}`);

      await this.auditRepo.log({
        actorId,
        action: 'DOCUMENT_UPDATE',
        entityType: 'Document',
        entityId: publicId,
        summary: `Updated "${doc.title}" with new file`,
      });

      return doc;
    }

    // Only metadata update
    const doc = await this.documentsRepo.updateByPublicId(publicId, dto);
    if (!doc) {
      throw new NotFoundException(`Document introuvable après mise à jour: ${publicId}`);
    }

    this.logger.log(`Document "${doc.title}" metadata updated by ${actorId}`);

    await this.auditRepo.log({
      actorId,
      action: 'DOCUMENT_UPDATE',
      entityType: 'Document',
      entityId: publicId,
      summary: `Updated "${doc.title}" metadata`,
    });

    return doc;
  }
}
