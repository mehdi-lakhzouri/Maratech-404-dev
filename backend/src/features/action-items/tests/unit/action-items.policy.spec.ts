/**
 * Action Items Policy Unit Tests
 * ------------------------------
 * Unit tests for RBAC policy logic.
 */

import { Types } from 'mongoose';
import { ActionItemsPolicy, PolicyUser } from '../../policies/action-items.policy';
import { ActionItemDocument, ActionItemStatus } from '../../schemas/action-item.schema';
import { UserRole } from '@features/users/entities/user-role.enum';

describe('ActionItemsPolicy', () => {
  let policy: ActionItemsPolicy;

  beforeEach(() => {
    policy = new ActionItemsPolicy();
  });

  const createMockActionItem = (overrides: Partial<ActionItemDocument> = {}): ActionItemDocument => {
    return {
      _id: new Types.ObjectId(),
      title: 'Test Action Item',
      status: ActionItemStatus.TODO,
      createdBy: new Types.ObjectId(),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as ActionItemDocument;
  };

  describe('canCreate', () => {
    it('should allow RESPONSABLE to create', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.RESPONSABLE };
      const result = policy.canCreate(user);
      expect(result.allowed).toBe(true);
    });

    it('should allow CHEF_PROJET to create', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CHEF_PROJET };
      const result = policy.canCreate(user);
      expect(result.allowed).toBe(true);
    });

    it('should deny CONSULTANT from creating', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CONSULTANT };
      const result = policy.canCreate(user);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('RESPONSABLE or CHEF_PROJET');
    });
  });

  describe('canEdit', () => {
    it('should allow RESPONSABLE to edit any item', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.RESPONSABLE };
      const actionItem = createMockActionItem({ createdBy: new Types.ObjectId('user2') });
      const result = policy.canEdit(user, actionItem);
      expect(result.allowed).toBe(true);
    });

    it('should allow CHEF_PROJET to edit own items', () => {
      const userId = new Types.ObjectId();
      const user: PolicyUser = { id: userId.toString(), role: UserRole.CHEF_PROJET };
      const actionItem = createMockActionItem({ createdBy: userId });
      const result = policy.canEdit(user, actionItem);
      expect(result.allowed).toBe(true);
    });

    it('should deny CHEF_PROJET from editing others items', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CHEF_PROJET };
      const actionItem = createMockActionItem({ createdBy: new Types.ObjectId('user2') });
      const result = policy.canEdit(user, actionItem);
      expect(result.allowed).toBe(false);
    });

    it('should deny CONSULTANT from editing', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CONSULTANT };
      const actionItem = createMockActionItem();
      const result = policy.canEdit(user, actionItem);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canChangeStatus', () => {
    it('should allow RESPONSABLE to change any status', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.RESPONSABLE };
      const actionItem = createMockActionItem();
      
      expect(policy.canChangeStatus(user, actionItem, ActionItemStatus.IN_PROGRESS).allowed).toBe(true);
      expect(policy.canChangeStatus(user, actionItem, ActionItemStatus.DONE).allowed).toBe(true);
      expect(policy.canChangeStatus(user, actionItem, ActionItemStatus.CANCELED).allowed).toBe(true);
    });

    it('should allow CHEF_PROJET to change status of own items', () => {
      const userId = new Types.ObjectId();
      const user: PolicyUser = { id: userId.toString(), role: UserRole.CHEF_PROJET };
      const actionItem = createMockActionItem({ createdBy: userId });
      
      expect(policy.canChangeStatus(user, actionItem, ActionItemStatus.IN_PROGRESS).allowed).toBe(true);
      expect(policy.canChangeStatus(user, actionItem, ActionItemStatus.CANCELED).allowed).toBe(true);
    });

    it('should deny CHEF_PROJET from changing status of others items', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CHEF_PROJET };
      const actionItem = createMockActionItem({ createdBy: new Types.ObjectId() });
      
      const result = policy.canChangeStatus(user, actionItem, ActionItemStatus.IN_PROGRESS);
      expect(result.allowed).toBe(false);
    });

    it('should allow CONSULTANT to change to IN_PROGRESS if assigned', () => {
      const userId = new Types.ObjectId();
      const user: PolicyUser = { id: userId.toString(), role: UserRole.CONSULTANT };
      const actionItem = createMockActionItem({ assignedTo: userId });
      
      const result = policy.canChangeStatus(user, actionItem, ActionItemStatus.IN_PROGRESS);
      expect(result.allowed).toBe(true);
    });

    it('should allow CONSULTANT to change to DONE if assigned', () => {
      const userId = new Types.ObjectId();
      const user: PolicyUser = { id: userId.toString(), role: UserRole.CONSULTANT };
      const actionItem = createMockActionItem({ assignedTo: userId });
      
      const result = policy.canChangeStatus(user, actionItem, ActionItemStatus.DONE);
      expect(result.allowed).toBe(true);
    });

    it('should deny CONSULTANT from changing to CANCELED even if assigned', () => {
      const userId = new Types.ObjectId();
      const user: PolicyUser = { id: userId.toString(), role: UserRole.CONSULTANT };
      const actionItem = createMockActionItem({ assignedTo: userId });
      
      const result = policy.canChangeStatus(user, actionItem, ActionItemStatus.CANCELED);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IN_PROGRESS or DONE');
    });

    it('should deny CONSULTANT from changing to TODO even if assigned', () => {
      const userId = new Types.ObjectId();
      const user: PolicyUser = { id: userId.toString(), role: UserRole.CONSULTANT };
      const actionItem = createMockActionItem({ 
        assignedTo: userId,
        status: ActionItemStatus.IN_PROGRESS,
      });
      
      const result = policy.canChangeStatus(user, actionItem, ActionItemStatus.TODO);
      expect(result.allowed).toBe(false);
    });

    it('should deny CONSULTANT from changing status if not assigned', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CONSULTANT };
      const actionItem = createMockActionItem(); // No assignedTo
      
      const result = policy.canChangeStatus(user, actionItem, ActionItemStatus.IN_PROGRESS);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('assigned to them');
    });

    it('should deny CONSULTANT from changing status if assigned to someone else', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CONSULTANT };
      const actionItem = createMockActionItem({ assignedTo: new Types.ObjectId() });
      
      const result = policy.canChangeStatus(user, actionItem, ActionItemStatus.IN_PROGRESS);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canArchive', () => {
    it('should allow RESPONSABLE to archive', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.RESPONSABLE };
      const result = policy.canArchive(user);
      expect(result.allowed).toBe(true);
    });

    it('should deny CHEF_PROJET from archiving', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CHEF_PROJET };
      const result = policy.canArchive(user);
      expect(result.allowed).toBe(false);
    });

    it('should deny CONSULTANT from archiving', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CONSULTANT };
      const result = policy.canArchive(user);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canRestore', () => {
    it('should allow RESPONSABLE to restore', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.RESPONSABLE };
      const result = policy.canRestore(user);
      expect(result.allowed).toBe(true);
    });

    it('should deny CHEF_PROJET from restoring', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CHEF_PROJET };
      const result = policy.canRestore(user);
      expect(result.allowed).toBe(false);
    });

    it('should deny CONSULTANT from restoring', () => {
      const user: PolicyUser = { id: 'user1', role: UserRole.CONSULTANT };
      const result = policy.canRestore(user);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canView', () => {
    it('should allow any user to view', () => {
      const responsable: PolicyUser = { id: 'user1', role: UserRole.RESPONSABLE };
      const chef: PolicyUser = { id: 'user2', role: UserRole.CHEF_PROJET };
      const consultant: PolicyUser = { id: 'user3', role: UserRole.CONSULTANT };

      expect(policy.canView(responsable).allowed).toBe(true);
      expect(policy.canView(chef).allowed).toBe(true);
      expect(policy.canView(consultant).allowed).toBe(true);
    });
  });
});
