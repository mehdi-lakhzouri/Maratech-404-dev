/**
 * Action Items RBAC Policy
 * ------------------------
 * Policy functions for action item authorization.
 * 
 * Rules:
 * - Create: RESPONSABLE, CHEF_PROJET
 * - Update fields: RESPONSABLE (any), CHEF_PROJET (only own created)
 * - Update status:
 *   - RESPONSABLE: any
 *   - CHEF_PROJET: only items they created
 *   - CONSULTANT: only if assignedTo == self, and only to IN_PROGRESS/DONE
 * - Archive/Restore: RESPONSABLE only
 * - Read/List: all authenticated users
 */

import { Injectable } from '@nestjs/common';
import { UserRole } from '@features/users/entities/user-role.enum';
import { ActionItemDocument, ActionItemStatus } from '../schemas/action-item.schema';
import { STATUS_TRANSITIONS } from '../domain/constants';

export interface PolicyUser {
  id: string;
  role: UserRole;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

@Injectable()
export class ActionItemsPolicy {
  /**
   * Check if user can create action items
   */
  canCreate(user: PolicyUser): PolicyResult {
    const allowedRoles = [UserRole.RESPONSABLE, UserRole.CHEF_PROJET];
    
    if (!allowedRoles.includes(user.role)) {
      return {
        allowed: false,
        reason: 'Only RESPONSABLE or CHEF_PROJET can create action items',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can edit action item fields (title, description, assignedTo, dueDate, etc.)
   */
  canEdit(user: PolicyUser, actionItem: ActionItemDocument): PolicyResult {
    // RESPONSABLE can edit any
    if (user.role === UserRole.RESPONSABLE) {
      return { allowed: true };
    }

    // CHEF_PROJET can edit only if they created it
    if (user.role === UserRole.CHEF_PROJET) {
      if (actionItem.createdBy.toString() === user.id) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'CHEF_PROJET can only edit action items they created',
      };
    }

    // CONSULTANT cannot edit fields
    return {
      allowed: false,
      reason: 'Only RESPONSABLE or CHEF_PROJET can edit action items',
    };
  }

  /**
   * Check if user can change action item status
   */
  canChangeStatus(
    user: PolicyUser,
    actionItem: ActionItemDocument,
    newStatus: ActionItemStatus,
  ): PolicyResult {
    // RESPONSABLE can change any status
    if (user.role === UserRole.RESPONSABLE) {
      return { allowed: true };
    }

    // CHEF_PROJET can change status only for items they created
    if (user.role === UserRole.CHEF_PROJET) {
      if (actionItem.createdBy.toString() === user.id) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'CHEF_PROJET can only change status for action items they created',
      };
    }

    // CONSULTANT can change status only if assigned to them
    if (user.role === UserRole.CONSULTANT) {
      // Must be assigned to this consultant
      if (!actionItem.assignedTo || actionItem.assignedTo.toString() !== user.id) {
        return {
          allowed: false,
          reason: 'CONSULTANT can only change status for action items assigned to them',
        };
      }

      // Can only set to IN_PROGRESS or DONE
      const allowedStatuses = STATUS_TRANSITIONS.CONSULTANT_ALLOWED;
      if (!allowedStatuses.includes(newStatus as 'IN_PROGRESS' | 'DONE')) {
        return {
          allowed: false,
          reason: `CONSULTANT can only set status to ${allowedStatuses.join(' or ')}`,
        };
      }

      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Insufficient permissions to change status',
    };
  }

  /**
   * Check if user can archive action items
   */
  canArchive(user: PolicyUser): PolicyResult {
    // Only RESPONSABLE can archive
    if (user.role === UserRole.RESPONSABLE) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Only RESPONSABLE can archive action items',
    };
  }

  /**
   * Check if user can restore action items
   */
  canRestore(user: PolicyUser): PolicyResult {
    // Only RESPONSABLE can restore
    if (user.role === UserRole.RESPONSABLE) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Only RESPONSABLE can restore action items',
    };
  }

  /**
   * Check if user can view action items (all authenticated users can view)
   */
  canView(_user: PolicyUser): PolicyResult {
    return { allowed: true };
  }
}
