/**
 * Update Action Item Use Case
 * ---------------------------
 * Business logic for updating action item fields (not status).
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ActionItemsRepository } from '../repositories/action-items.repository';
import { ActionItemsPolicy, PolicyUser } from '../policies/action-items.policy';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { MeetingsRepository } from '@features/meetings/repositories/meetings.repository';
import { UpdateActionItemDto } from '../dto/update-action-item.dto';
import { ACTION_ITEM_AUDIT_ACTIONS } from '../domain/constants';

@Injectable()
export class UpdateActionItemUseCase {
  private readonly logger = new Logger(UpdateActionItemUseCase.name);

  constructor(
    private readonly actionItemsRepo: ActionItemsRepository,
    private readonly policy: ActionItemsPolicy,
    private readonly auditRepo: AuditLogRepository,
    private readonly meetingsRepo: MeetingsRepository,
  ) {}

  async execute(id: string, dto: UpdateActionItemDto, actor: PolicyUser) {
    // Fetch the action item
    const actionItem = await this.actionItemsRepo.findById(id);
    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    // Check authorization
    const canEdit = this.policy.canEdit(actor, actionItem);
    if (!canEdit.allowed) {
      throw new ForbiddenException(canEdit.reason);
    }

    // Validate meeting exists if provided
    if (dto.meetingId && dto.meetingId !== null) {
      const meeting = await this.meetingsRepo.findById(dto.meetingId);
      if (!meeting) {
        throw new BadRequestException('Meeting not found');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.assignedTo !== undefined) {
      updateData.assignedTo = dto.assignedTo 
        ? new Types.ObjectId(dto.assignedTo) 
        : null;
    }
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.projectId !== undefined) {
      updateData.projectId = dto.projectId 
        ? new Types.ObjectId(dto.projectId) 
        : null;
    }
    if (dto.meetingId !== undefined) {
      updateData.meetingId = dto.meetingId 
        ? new Types.ObjectId(dto.meetingId) 
        : null;
    }

    // Update the action item
    const updated = await this.actionItemsRepo.update(id, updateData);

    // Audit log
    await this.auditRepo.log({
      actorId: actor.id,
      action: ACTION_ITEM_AUDIT_ACTIONS.UPDATED,
      entityType: 'ActionItem',
      entityId: id,
      summary: `Updated action item "${actionItem.title}"`,
      meta: {
        changes: dto,
      },
    });

    this.logger.log(`Action item updated: ${id} by ${actor.id}`);

    return updated;
  }
}
