import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { UserRole } from '@features/users/entities/user-role.enum';

@Injectable()
export class RestoreMeetingUseCase {
  private readonly logger = new Logger(RestoreMeetingUseCase.name);

  constructor(
    private readonly meetingsRepo: MeetingsRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  /**
   * Restore an archived meeting.
   * Rules: RESPONSABLE can restore any meeting. Creator can restore their own.
   */
  async execute(id: string, actorId: string, actorRole: UserRole) {
    const meeting = await this.meetingsRepo.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Réunion introuvable: ${id}`);
    }

    if (actorRole !== UserRole.RESPONSABLE && meeting.createdBy.toString() !== actorId) {
      throw new ForbiddenException('Seul le responsable ou le créateur peut restaurer cette réunion');
    }

    const restored = await this.meetingsRepo.restore(id);

    await this.auditRepo.log({
      actorId,
      action: 'MEETING_RESTORED',
      entityType: 'Meeting',
      entityId: id,
      summary: `Restored meeting "${meeting.subject}"`,
    });

    return restored;
  }
}
