import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { UpdateMinutesDto } from '../dto/meeting.dto';
import { UserRole } from '@features/users/entities/user-role.enum';

@Injectable()
export class UpdateMinutesUseCase {
  private readonly logger = new Logger(UpdateMinutesUseCase.name);

  constructor(
    private readonly meetingsRepo: MeetingsRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(id: string, dto: UpdateMinutesDto, actorId: string, actorRole: UserRole) {
    const meeting = await this.meetingsRepo.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Réunion introuvable: ${id}`);
    }

    // Only creator or RESPONSABLE can update minutes
    if (actorRole !== UserRole.RESPONSABLE && meeting.createdBy.toString() !== actorId) {
      throw new ForbiddenException('Vous ne pouvez modifier que les comptes rendus de vos propres réunions');
    }

    const updated = await this.meetingsRepo.updateMinutes(id, {
      content: dto.content,
      format: dto.format || 'plain',
      updatedAt: new Date(),
      updatedBy: new Types.ObjectId(actorId),
    });

    await this.auditRepo.log({
      actorId,
      action: 'MINUTES_UPDATED',
      entityType: 'Meeting',
      entityId: id,
      summary: `Updated minutes for "${meeting.subject}"`,
    });

    return updated;
  }
}
