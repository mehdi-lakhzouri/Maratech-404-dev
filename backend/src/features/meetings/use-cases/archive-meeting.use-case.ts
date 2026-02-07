import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { UserRole } from '@features/users/entities/user-role.enum';

@Injectable()
export class ArchiveMeetingUseCase {
  private readonly logger = new Logger(ArchiveMeetingUseCase.name);

  constructor(
    private readonly meetingsRepo: MeetingsRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  /**
   * Archive a meeting.
   * Rules: RESPONSABLE can archive any meeting. Creator can archive their own.
   */
  async execute(id: string, actorId: string, actorRole: UserRole) {
    const meeting = await this.meetingsRepo.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Réunion introuvable: ${id}`);
    }

    // RESPONSABLE or creator
    if (actorRole !== UserRole.RESPONSABLE && meeting.createdBy.toString() !== actorId) {
      throw new ForbiddenException('Seul le responsable ou le créateur peut archiver cette réunion');
    }

    const archived = await this.meetingsRepo.archive(id, actorId);

    await this.auditRepo.log({
      actorId,
      action: 'MEETING_ARCHIVED',
      entityType: 'Meeting',
      entityId: id,
      summary: `Archived meeting "${meeting.subject}"`,
    });

    return archived;
  }
}
