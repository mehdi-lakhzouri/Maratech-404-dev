/**
 * Create Action Item Use Case
 * ---------------------------
 * Business logic for creating a new action item.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ActionItemsRepository } from '../repositories/action-items.repository';
import { ActionItemsPolicy, PolicyUser } from '../policies/action-items.policy';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { MeetingsRepository } from '@features/meetings/repositories/meetings.repository';
import { CreateActionItemDto } from '../dto/create-action-item.dto';
import { ACTION_ITEM_AUDIT_ACTIONS, ActionItemSource } from '../domain/constants';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

@Injectable()
export class CreateActionItemUseCase {
  private readonly logger = new Logger(CreateActionItemUseCase.name);

  constructor(
    private readonly actionItemsRepo: ActionItemsRepository,
    private readonly policy: ActionItemsPolicy,
    private readonly auditRepo: AuditLogRepository,
    private readonly meetingsRepo: MeetingsRepository,
  ) {}

  async execute(
    dto: CreateActionItemDto,
    actor: PolicyUser,
    idempotencyKey?: string,
  ) {
    // Check authorization
    const canCreate = this.policy.canCreate(actor);
    if (!canCreate.allowed) {
      throw new ForbiddenException(canCreate.reason);
    }

    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.actionItemsRepo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        this.logger.log(`Idempotent hit for key=${idempotencyKey}`);
        return existing;
      }
    }

    // Validate meeting exists if provided
    if (dto.meetingId) {
      const meeting = await this.meetingsRepo.findById(dto.meetingId);
      if (!meeting) {
        throw new BadRequestException('Meeting not found');
      }
    }

    // Create the action item
    const actionItem = await this.actionItemsRepo.create({
      title: dto.title,
      description: dto.description,
      assignedTo: dto.assignedTo ? new Types.ObjectId(dto.assignedTo) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      meetingId: dto.meetingId ? new Types.ObjectId(dto.meetingId) : undefined,
      createdBy: new Types.ObjectId(actor.id),
      source: dto.source || ActionItemSource.MANUAL,
      idempotencyKey: idempotencyKey || undefined,
    });

    // Audit log
    await this.auditRepo.log({
      actorId: actor.id,
      action: ACTION_ITEM_AUDIT_ACTIONS.CREATED,
      entityType: 'ActionItem',
      entityId: actionItem._id.toString(),
      summary: `Created action item "${dto.title}"`,
      meta: {
        assignedTo: dto.assignedTo,
        meetingId: dto.meetingId,
        projectId: dto.projectId,
      },
    });

    this.logger.log(`Action item created: ${actionItem._id} by ${actor.id}`);

    // Return populated
    return this.actionItemsRepo.findById(actionItem._id.toString());
  }
}
