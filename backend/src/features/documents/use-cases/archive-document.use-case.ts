import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DocumentsRepository } from '../repositories/documents.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { UserRole } from '@features/users/entities/user-role.enum';

@Injectable()
export class ArchiveDocumentUseCase {
  private readonly logger = new Logger(ArchiveDocumentUseCase.name);

  constructor(
    private readonly documentsRepo: DocumentsRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(publicId: string, actorId: string, actorRole: UserRole) {
    // First, check the document exists and ownership for CHEF_PROJET
    const existingDoc = await this.documentsRepo.findByPublicId(publicId);
    if (!existingDoc) {
      throw new NotFoundException(`Document introuvable: ${publicId}`);
    }

    // Chef Projet can only archive their own documents
    if (actorRole === UserRole.CHEF_PROJET) {
      const uploaderId = existingDoc.uploadedBy?.toString() || (existingDoc.uploadedBy as unknown as { _id: string })?._id?.toString();
      if (uploaderId !== actorId) {
        throw new ForbiddenException(
          'Vous ne pouvez archiver que vos propres documents',
        );
      }
    }

    const doc = await this.documentsRepo.archive(publicId, actorId);
    if (!doc) {
      throw new NotFoundException(`Document introuvable: ${publicId}`);
    }

    await this.auditRepo.log({
      actorId,
      action: 'DOCUMENT_ARCHIVE',
      entityType: 'Document',
      entityId: publicId,
      summary: `Archived "${doc.title}"`,
    });

    return doc;
  }
}
