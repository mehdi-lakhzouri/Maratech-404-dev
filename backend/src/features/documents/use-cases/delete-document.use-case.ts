import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { DocumentsRepository } from '../repositories/documents.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import {
  FILE_STORAGE_TOKEN,
  FileStorageAdapter,
} from '../storage/file-storage.interface';
import { UserRole } from '@features/users/entities/user-role.enum';

@Injectable()
export class DeleteDocumentUseCase {
  private readonly logger = new Logger(DeleteDocumentUseCase.name);

  constructor(
    private readonly documentsRepo: DocumentsRepository,
    private readonly auditRepo: AuditLogRepository,
    @Inject(FILE_STORAGE_TOKEN)
    private readonly storage: FileStorageAdapter,
  ) {}

  async execute(publicId: string, actorId: string, actorRole: UserRole) {
    const doc = await this.documentsRepo.findByPublicId(publicId);
    if (!doc) {
      throw new NotFoundException(`Document introuvable: ${publicId}`);
    }

    // Chef Projet can only delete their own documents
    if (actorRole === UserRole.CHEF_PROJET) {
      const uploaderId = doc.uploadedBy?.toString() || (doc.uploadedBy as unknown as { _id: string })?._id?.toString();
      if (uploaderId !== actorId) {
        throw new ForbiddenException(
          'Vous ne pouvez supprimer que vos propres documents',
        );
      }
    }

    // Delete file from storage
    try {
      await this.storage.delete(doc.storageKey);
    } catch (err) {
      this.logger.warn(
        `Failed to delete file from storage: ${doc.storageKey}`,
        err,
      );
    }

    // Delete document from database
    await this.documentsRepo.deleteByPublicId(publicId);

    await this.auditRepo.log({
      actorId,
      action: 'DOCUMENT_DELETE',
      entityType: 'Document',
      entityId: publicId,
      summary: `Deleted "${doc.title}"`,
    });

    return { deleted: true, publicId };
  }
}
