import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { MeetingDocumentsRepository } from '../repositories/meeting-documents.repository';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { DocumentsRepository } from '@features/documents/repositories/documents.repository';
import { AttachDocumentDto } from '../dto/meeting.dto';

@Injectable()
export class AttachDocumentUseCase {
  private readonly logger = new Logger(AttachDocumentUseCase.name);

  constructor(
    private readonly meetingsRepo: MeetingsRepository,
    private readonly meetingDocsRepo: MeetingDocumentsRepository,
    private readonly documentsRepo: DocumentsRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(meetingId: string, dto: AttachDocumentDto, actorId: string) {
    // Verify meeting exists
    const meeting = await this.meetingsRepo.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException(`Réunion introuvable: ${meetingId}`);
    }

    // Verify document exists and is not archived
    const document = await this.documentsRepo.findByPublicId(dto.documentId);
    if (!document) {
      throw new NotFoundException(`Document introuvable: ${dto.documentId}`);
    }
    if (document.isArchived) {
      throw new ConflictException('Impossible d\'attacher un document archivé');
    }

    // Idempotent: check if already attached
    const alreadyAttached = await this.meetingDocsRepo.exists(
      meetingId,
      document._id.toString(),
    );
    if (alreadyAttached) {
      this.logger.log(`Document ${dto.documentId} already attached to meeting ${meetingId}`);
      return { alreadyAttached: true };
    }

    await this.meetingDocsRepo.attach(meetingId, document._id.toString(), actorId);

    await this.auditRepo.log({
      actorId,
      action: 'MEETING_DOCUMENT_ATTACHED',
      entityType: 'Meeting',
      entityId: meetingId,
      summary: `Attached document "${document.title}" to meeting "${meeting.subject}"`,
      meta: { documentId: dto.documentId },
    });

    return { attached: true, documentId: dto.documentId };
  }
}
