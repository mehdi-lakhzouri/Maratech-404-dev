import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { UpdateMeetingDto } from '../dto/meeting.dto';
import { UserRole } from '@features/users/entities/user-role.enum';

@Injectable()
export class UpdateMeetingUseCase {
  private readonly logger = new Logger(UpdateMeetingUseCase.name);

  constructor(
    private readonly meetingsRepo: MeetingsRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(id: string, dto: UpdateMeetingDto, actorId: string, actorRole: UserRole) {
    const meeting = await this.meetingsRepo.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Réunion introuvable: ${id}`);
    }

    // Only creator or RESPONSABLE can update
    if (actorRole !== UserRole.RESPONSABLE && meeting.createdBy.toString() !== actorId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres réunions');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.scheduledAt !== undefined) updateData.scheduledAt = new Date(dto.scheduledAt);
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.participantsText !== undefined) updateData.participantsText = dto.participantsText;
    if (dto.participantIds !== undefined) {
      const { Types } = require('mongoose');
      updateData.participantIds = dto.participantIds.map((pid: string) => new Types.ObjectId(pid));
    }

    const updated = await this.meetingsRepo.update(id, updateData);

    await this.auditRepo.log({
      actorId,
      action: 'MEETING_UPDATED',
      entityType: 'Meeting',
      entityId: id,
      summary: `Updated meeting "${updated?.subject}"`,
      meta: { updatedFields: Object.keys(updateData) },
    });

    return updated;
  }
}
