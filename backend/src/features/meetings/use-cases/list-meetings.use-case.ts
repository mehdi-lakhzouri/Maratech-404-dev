import { Injectable } from '@nestjs/common';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { ListMeetingsQueryDto } from '../dto/meeting.dto';

@Injectable()
export class ListMeetingsUseCase {
  constructor(private readonly meetingsRepo: MeetingsRepository) {}

  async execute(query: ListMeetingsQueryDto) {
    return this.meetingsRepo.findAll(query);
  }
}
