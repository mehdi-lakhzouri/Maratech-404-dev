import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MeetingsRepository } from '../repositories/meetings.repository';
import { SaveDraftDto } from '../dto/meeting.dto';
import { UserRole } from '@features/users/entities/user-role.enum';

@Injectable()
export class SaveDraftNotesUseCase {
  constructor(private readonly meetingsRepo: MeetingsRepository) {}

  async execute(id: string, dto: SaveDraftDto, actorId: string, actorRole: UserRole) {
    const meeting = await this.meetingsRepo.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Réunion introuvable: ${id}`);
    }

    // Only creator or RESPONSABLE can save drafts
    if (actorRole !== UserRole.RESPONSABLE && meeting.createdBy.toString() !== actorId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres brouillons');
    }

    return this.meetingsRepo.updateDraft(id, dto.draftNotes);
  }
}
