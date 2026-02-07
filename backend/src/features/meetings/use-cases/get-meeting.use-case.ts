import { Injectable, NotFoundException } from '@nestjs/common';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { MeetingDocumentsRepository } from '../repositories/meeting-documents.repository';

@Injectable()
export class GetMeetingUseCase {
  constructor(
    private readonly meetingsRepo: MeetingsRepository,
    private readonly meetingDocsRepo: MeetingDocumentsRepository,
  ) {}

  async execute(id: string) {
    const meeting = await this.meetingsRepo.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Réunion introuvable: ${id}`);
    }

    // Fetch attached documents
    const attachedDocuments = await this.meetingDocsRepo.findByMeetingId(id);

    return {
      ...meeting.toObject ? meeting.toObject() : meeting,
      attachedDocuments,
    };
  }
}
