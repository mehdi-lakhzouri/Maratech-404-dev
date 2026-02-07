import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { AuditService, IdempotencyService } from '@shared/services';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  UpdateMeetingMinutesDto,
  UpdateDraftNotesDto,
  AttachDocumentDto,
  GetMeetingsQueryDto,
} from '../dto';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly meetingsRepository: MeetingsRepository,
    private readonly auditService: AuditService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async createMeeting(createDto: CreateMeetingDto, userId: string, idempotencyKey?: string) {
    const userId_obj = new Types.ObjectId(userId);

    // Check idempotency
    if (idempotencyKey) {
      const cached = await this.idempotencyService.getCachedResponse(userId_obj, idempotencyKey, 'POST /meetings');
      if (cached) return cached;
    }

    // Validate date is not more than 1 hour in the past (allow some buffer for same-day meetings)
    const scheduledDate = new Date(createDto.scheduledAt);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (scheduledDate < oneHourAgo) {
      throw new BadRequestException('La réunion doit être planifiée pour dans le futur');
    }

    const meeting = await this.meetingsRepository.create({
      ...createDto,
      projectId: createDto.projectId ? new Types.ObjectId(createDto.projectId) : undefined,
      participantIds: createDto.participantIds?.map(id => new Types.ObjectId(id)),
      createdBy: userId_obj,
    });

    // Audit
    await this.auditService.log({
      actorId: userId_obj,
      action: 'MEETING_CREATED',
      entityType: 'MEETING',
      entityId: (meeting as any)._id,
      summary: `Meeting "${meeting.subject}" created`,
    });

    // Cache for idempotency
    if (idempotencyKey) {
      await this.idempotencyService.cacheResponse(userId_obj, idempotencyKey, 'POST /meetings', meeting, 201);
    }

    return meeting;
  }

  async getMeeting(meetingId: string) {
    const meeting = await this.meetingsRepository.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  async getMeetings(filters: GetMeetingsQueryDto) {
    return this.meetingsRepository.findAll(filters);
  }

  async updateMeeting(meetingId: string, updateDto: UpdateMeetingDto, userId: string) {
    const meeting = await this.getMeeting(meetingId);

    // Authorization: only creator or RESPONSABLE can edit
    if (meeting.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only edit meetings you created');
    }

    const updated = await this.meetingsRepository.update(meetingId, updateDto);

    // Audit
    await this.auditService.log({
      actorId: new Types.ObjectId(userId),
      action: 'MEETING_UPDATED',
      entityType: 'MEETING',
      entityId: meetingId,
      summary: `Meeting "${updated?.subject}" updated`,
    });

    return updated;
  }

  async updateMeetingMinutes(
    meetingId: string,
    updateDto: UpdateMeetingMinutesDto,
    userId: string,
  ) {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only edit minutes for meetings you created');
    }

    const updated = await this.meetingsRepository.updateMinutes(
      meetingId,
      updateDto.content,
      updateDto.format || 'plain',
      new Types.ObjectId(userId),
    );

    // Audit
    await this.auditService.log({
      actorId: new Types.ObjectId(userId),
      action: 'MEETING_MINUTES_UPDATED',
      entityType: 'MEETING',
      entityId: new Types.ObjectId(meetingId),
      summary: `Minutes updated for meeting "${meeting.subject}"`,
    });

    return updated;
  }

  async updateDraftNotes(meetingId: string, updateDto: UpdateDraftNotesDto, userId: string) {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only edit draft notes for meetings you created');
    }

    return this.meetingsRepository.updateDraftNotes(meetingId, updateDto.draftNotes || '');
  }

  async attachDocument(meetingId: string, attachDto: AttachDocumentDto, userId: string) {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only attach documents to meetings you created');
    }

    const attached = await this.meetingsRepository.attachDocument(
      new Types.ObjectId(meetingId),
      new Types.ObjectId(attachDto.documentId),
      new Types.ObjectId(userId),
    );

    // Audit
    await this.auditService.log({
      actorId: new Types.ObjectId(userId),
      action: 'MEETING_DOCUMENT_ATTACHED',
      entityType: 'MEETING',
      entityId: new Types.ObjectId(meetingId),
      summary: `Document attached to meeting "${meeting.subject}"`,
    });

    return attached;
  }

  async getAttachedDocuments(meetingId: string) {
    await this.getMeeting(meetingId);
    return this.meetingsRepository.getAttachedDocuments(meetingId);
  }

  async archiveMeeting(meetingId: string, userId: string) {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only archive meetings you created');
    }

    const archived = await this.meetingsRepository.archive(meetingId, new Types.ObjectId(userId));

    // Audit
    await this.auditService.log({
      actorId: new Types.ObjectId(userId),
      action: 'MEETING_ARCHIVED',
      entityType: 'MEETING',
      entityId: meetingId,
      summary: `Meeting "${meeting.subject}" archived`,
    });

    return archived;
  }

  async restoreMeeting(meetingId: string, userId: string) {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only restore meetings you created');
    }

    const restored = await this.meetingsRepository.restore(meetingId);

    // Audit
    await this.auditService.log({
      actorId: new Types.ObjectId(userId),
      action: 'MEETING_RESTORED',
      entityType: 'MEETING',
      entityId: new Types.ObjectId(meetingId),
      summary: `Meeting "${meeting.subject}" restored`,
    });

    return restored;
  }
}
