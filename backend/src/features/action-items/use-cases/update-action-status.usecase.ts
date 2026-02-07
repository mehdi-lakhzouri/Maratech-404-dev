/**
 * Update Action Status Use Case
 * -----------------------------
 * Business logic for changing action item status with RBAC.
 * 
 * RBAC Rules:
 * - RESPONSABLE: can update any
 * - CHEF_PROJET: can update for items they created
 * - CONSULTANT: can update status ONLY if assignedTo == self (and only to IN_PROGRESS/DONE)
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ActionItemsRepository } from '../repositories/action-items.repository';
import { ActionItemsPolicy, PolicyUser } from '../policies/action-items.policy';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { UpdateActionStatusDto } from '../dto/update-action-status.dto';
import { ACTION_ITEM_AUDIT_ACTIONS } from '../domain/constants';

@Injectable()
export class UpdateActionStatusUseCase {
  private readonly logger = new Logger(UpdateActionStatusUseCase.name);

  constructor(
    private readonly actionItemsRepo: ActionItemsRepository,
    private readonly policy: ActionItemsPolicy,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async execute(id: string, dto: UpdateActionStatusDto, actor: PolicyUser) {
    // Fetch the action item
    const actionItem = await this.actionItemsRepo.findById(id);
    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    // Check if item is archived
    if (actionItem.isArchived) {
      throw new ForbiddenException('Cannot change status of archived action item');
    }

    // Check authorization with the specific new status
    const canChange = this.policy.canChangeStatus(actor, actionItem, dto.status);
    if (!canChange.allowed) {
      throw new ForbiddenException(canChange.reason);
    }

    // Track the old status for audit
    const oldStatus = actionItem.status;

    // Skip update if status is the same
    if (oldStatus === dto.status) {
      return actionItem;
    }

    // Update the status
    const updated = await this.actionItemsRepo.updateStatus(id, dto.status);

    // Audit log
    await this.auditRepo.log({
      actorId: actor.id,
      action: ACTION_ITEM_AUDIT_ACTIONS.STATUS_CHANGED,
      entityType: 'ActionItem',
      entityId: id,
      summary: `Changed status from ${oldStatus} to ${dto.status}`,
      meta: {
        oldStatus,
        newStatus: dto.status,
      },
    });

    this.logger.log(
      `Action item ${id} status changed: ${oldStatus} -> ${dto.status} by ${actor.id}`,
    );

    return updated;
  }
}
