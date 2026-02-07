/**
 * Restore Action Item Use Case
 * ----------------------------
 * Business logic for restoring archived action items.
 * Only RESPONSABLE can restore.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ActionItemsRepository } from '../repositories/action-items.repository';
import { ActionItemsPolicy, PolicyUser } from '../policies/action-items.policy';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { ACTION_ITEM_AUDIT_ACTIONS } from '../domain/constants';

@Injectable()
export class RestoreActionItemUseCase {
  private readonly logger = new Logger(RestoreActionItemUseCase.name);

  constructor(
    private readonly actionItemsRepo: ActionItemsRepository,
    private readonly policy: ActionItemsPolicy,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(id: string, actor: PolicyUser) {
    // Check authorization
    const canRestore = this.policy.canRestore(actor);
    if (!canRestore.allowed) {
      throw new ForbiddenException(canRestore.reason);
    }

    // Fetch the action item
    const actionItem = await this.actionItemsRepo.findById(id);
    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    // Check if not archived
    if (!actionItem.isArchived) {
      throw new BadRequestException('Action item is not archived');
    }

    // Restore the action item
    const restored = await this.actionItemsRepo.restore(id);

    // Audit log
    await this.auditRepo.log({
      actorId: actor.id,
      action: ACTION_ITEM_AUDIT_ACTIONS.RESTORED,
      entityType: 'ActionItem',
      entityId: id,
      summary: `Restored action item "${actionItem.title}"`,
    });

    this.logger.log(`Action item restored: ${id} by ${actor.id}`);

    return restored;
  }
}
