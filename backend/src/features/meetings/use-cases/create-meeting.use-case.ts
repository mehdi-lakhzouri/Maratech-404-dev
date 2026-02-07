import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { MeetingLinkService } from '@shared';
import { CreateMeetingDto } from '../dto/meeting.dto';

@Injectable()
export class CreateMeetingUseCase {
  private readonly logger = new Logger(CreateMeetingUseCase.name);

  constructor(
    private readonly meetingsRepo: MeetingsRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly meetingLinkService: MeetingLinkService,
  ) {}

  async execute(dto: CreateMeetingDto, actorId: string, idempotencyKey?: string) {
    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.meetingsRepo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        this.logger.log(`Idempotent hit for key=${idempotencyKey}`);
        return existing;
      }
    }

    // Generate meeting link
    const meetingLink = this.meetingLinkService.generateMeetingLink(dto.subject);

    const meeting = await this.meetingsRepo.create({
      subject: dto.subject,
      scheduledAt: new Date(dto.scheduledAt),
      location: dto.location,
      meetingLink,
      participantsText: dto.participantsText,
      participantIds: dto.participantIds?.map((id) => new Types.ObjectId(id)) ?? [],
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      createdBy: new Types.ObjectId(actorId),
      idempotencyKey: idempotencyKey || undefined,
    });

    // Audit
    await this.auditRepo.log({
      actorId,
      action: 'MEETING_CREATED',
      entityType: 'Meeting',
      entityId: meeting._id.toString(),
      summary: `Created meeting "${dto.subject}"`,
    });

    this.logger.log(`Meeting created: ${meeting._id} by ${actorId}`);

    // Return populated
    return this.meetingsRepo.findById(meeting._id.toString());
  }
}
