/**
 * Archive Action Item Use Case
 * ----------------------------
 * Business logic for archiving action items.
 * Only RESPONSABLE can archive.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ActionItemsRepository } from '../repositories/action-items.repository';
import { ActionItemsPolicy, PolicyUser } from '../policies/action-items.policy';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { ACTION_ITEM_AUDIT_ACTIONS } from '../domain/constants';

@Injectable()
export class ArchiveActionItemUseCase {
  private readonly logger = new Logger(ArchiveActionItemUseCase.name);

  constructor(
    private readonly actionItemsRepo: ActionItemsRepository,
    private readonly policy: ActionItemsPolicy,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(id: string, actor: PolicyUser) {
    // Check authorization
    const canArchive = this.policy.canArchive(actor);
    if (!canArchive.allowed) {
      throw new ForbiddenException(canArchive.reason);
    }

    // Fetch the action item
    const actionItem = await this.actionItemsRepo.findById(id);
    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    // Check if already archived
    if (actionItem.isArchived) {
      this.logger.debug(`Action item ${id} is already archived`);
      return actionItem;
    }

    // Archive the action item
    const archived = await this.actionItemsRepo.archive(
      id,
      new Types.ObjectId(actor.id),
    );

    // Audit log
    await this.auditRepo.log({
      actorId: actor.id,
      action: ACTION_ITEM_AUDIT_ACTIONS.ARCHIVED,
      entityType: 'ActionItem',
      entityId: id,
      summary: `Archived action item "${actionItem.title}"`,
    });

    this.logger.log(`Action item archived: ${id} by ${actor.id}`);

    return archived;
  }
}
