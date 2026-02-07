/**
 * Action Item Domain Constants
 * ----------------------------
 * Domain-level constants, enums, and types for action items feature.
 */

// Re-export enums from schema for easier access
export {
  ActionItemStatus,
  ActionItemSource,
  TrelloSyncStatus,
} from '../schemas/action-item.schema';

/**
 * Status transitions allowed for each role
 */
export const STATUS_TRANSITIONS = {
  /** All statuses */
  ALL: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const,
  
  /** Statuses a consultant can set when assigned */
  CONSULTANT_ALLOWED: ['IN_PROGRESS', 'DONE'] as const,
};

/**
 * Audit action types for action items
 */
export const ACTION_ITEM_AUDIT_ACTIONS = {
  CREATED: 'ACTION_CREATED',
  UPDATED: 'ACTION_UPDATED',
  STATUS_CHANGED: 'ACTION_STATUS_CHANGED',
  ARCHIVED: 'ACTION_ARCHIVED',
  RESTORED: 'ACTION_RESTORED',
} as const;

export type ActionItemAuditAction =
  (typeof ACTION_ITEM_AUDIT_ACTIONS)[keyof typeof ACTION_ITEM_AUDIT_ACTIONS];
