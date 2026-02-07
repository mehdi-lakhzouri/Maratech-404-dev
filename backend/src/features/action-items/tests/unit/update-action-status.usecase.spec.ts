/**
 * Update Action Status Use Case Unit Tests
 * ----------------------------------------
 * Unit tests for the UpdateActionStatusUseCase with RBAC.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UpdateActionStatusUseCase } from '../../use-cases/update-action-status.usecase';
import { ActionItemsRepository } from '../../repositories/action-items.repository';
import { ActionItemsPolicy } from '../../policies/action-items.policy';
import { AuditLogRepository } from '@features/documents/repositories/audit-log.repository';
import { ActionItemStatus, ActionItemDocument } from '../../schemas/action-item.schema';
import { UserRole } from '@features/users/entities/user-role.enum';

describe('UpdateActionStatusUseCase', () => {
  let useCase: UpdateActionStatusUseCase;
  let actionItemsRepo: jest.Mocked<ActionItemsRepository>;
  let policy: ActionItemsPolicy;
  let auditRepo: jest.Mocked<AuditLogRepository>;

  const mockActionItem = (overrides: Partial<ActionItemDocument> = {}): ActionItemDocument => {
    return {
      _id: new Types.ObjectId(),
      title: 'Test Item',
      status: ActionItemStatus.TODO,
      createdBy: new Types.ObjectId(),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as ActionItemDocument;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateActionStatusUseCase,
        ActionItemsPolicy,
        {
          provide: ActionItemsRepository,
          useValue: {
            findById: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: AuditLogRepository,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UpdateActionStatusUseCase>(UpdateActionStatusUseCase);
    actionItemsRepo = module.get(ActionItemsRepository);
    policy = module.get<ActionItemsPolicy>(ActionItemsPolicy);
    auditRepo = module.get(AuditLogRepository);
  });

  describe('RESPONSABLE role', () => {
    it('should allow changing any status', async () => {
      const actionItem = mockActionItem();
      actionItemsRepo.findById.mockResolvedValue(actionItem);
      actionItemsRepo.updateStatus.mockResolvedValue({
        ...actionItem,
        status: ActionItemStatus.DONE,
      });

      const actor = { id: 'responsable1', role: UserRole.RESPONSABLE };
      const result = await useCase.execute(
        actionItem._id.toString(),
        { status: ActionItemStatus.DONE },
        actor,
      );

      expect(result.status).toBe(ActionItemStatus.DONE);
      expect(auditRepo.log).toHaveBeenCalled();
    });
  });

  describe('CHEF_PROJET role', () => {
    it('should allow changing status for own items', async () => {
      const chefId = new Types.ObjectId();
      const actionItem = mockActionItem({ createdBy: chefId });
      actionItemsRepo.findById.mockResolvedValue(actionItem);
      actionItemsRepo.updateStatus.mockResolvedValue({
        ...actionItem,
        status: ActionItemStatus.IN_PROGRESS,
      });

      const actor = { id: chefId.toString(), role: UserRole.CHEF_PROJET };
      const result = await useCase.execute(
        actionItem._id.toString(),
        { status: ActionItemStatus.IN_PROGRESS },
        actor,
      );

      expect(result.status).toBe(ActionItemStatus.IN_PROGRESS);
    });

    it('should deny changing status for others items', async () => {
      const actionItem = mockActionItem(); // Different creator
      actionItemsRepo.findById.mockResolvedValue(actionItem);

      const actor = { id: 'chef1', role: UserRole.CHEF_PROJET };

      await expect(
        useCase.execute(
          actionItem._id.toString(),
          { status: ActionItemStatus.IN_PROGRESS },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CONSULTANT role', () => {
    it('should allow changing to IN_PROGRESS if assigned', async () => {
      const consultantId = new Types.ObjectId();
      const actionItem = mockActionItem({ assignedTo: consultantId });
      actionItemsRepo.findById.mockResolvedValue(actionItem);
      actionItemsRepo.updateStatus.mockResolvedValue({
        ...actionItem,
        status: ActionItemStatus.IN_PROGRESS,
      });

      const actor = { id: consultantId.toString(), role: UserRole.CONSULTANT };
      const result = await useCase.execute(
        actionItem._id.toString(),
        { status: ActionItemStatus.IN_PROGRESS },
        actor,
      );

      expect(result.status).toBe(ActionItemStatus.IN_PROGRESS);
    });

    it('should allow changing to DONE if assigned', async () => {
      const consultantId = new Types.ObjectId();
      const actionItem = mockActionItem({
        assignedTo: consultantId,
        status: ActionItemStatus.IN_PROGRESS,
      });
      actionItemsRepo.findById.mockResolvedValue(actionItem);
      actionItemsRepo.updateStatus.mockResolvedValue({
        ...actionItem,
        status: ActionItemStatus.DONE,
      });

      const actor = { id: consultantId.toString(), role: UserRole.CONSULTANT };
      const result = await useCase.execute(
        actionItem._id.toString(),
        { status: ActionItemStatus.DONE },
        actor,
      );

      expect(result.status).toBe(ActionItemStatus.DONE);
    });

    it('should deny changing to CANCELED even if assigned', async () => {
      const consultantId = new Types.ObjectId();
      const actionItem = mockActionItem({ assignedTo: consultantId });
      actionItemsRepo.findById.mockResolvedValue(actionItem);

      const actor = { id: consultantId.toString(), role: UserRole.CONSULTANT };

      await expect(
        useCase.execute(
          actionItem._id.toString(),
          { status: ActionItemStatus.CANCELED },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny if not assigned', async () => {
      const actionItem = mockActionItem(); // No assignedTo
      actionItemsRepo.findById.mockResolvedValue(actionItem);

      const actor = { id: 'consultant1', role: UserRole.CONSULTANT };

      await expect(
        useCase.execute(
          actionItem._id.toString(),
          { status: ActionItemStatus.IN_PROGRESS },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny if assigned to someone else', async () => {
      const actionItem = mockActionItem({ assignedTo: new Types.ObjectId() });
      actionItemsRepo.findById.mockResolvedValue(actionItem);

      const actor = { id: 'differentConsultant', role: UserRole.CONSULTANT };

      await expect(
        useCase.execute(
          actionItem._id.toString(),
          { status: ActionItemStatus.IN_PROGRESS },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Error handling', () => {
    it('should throw NotFoundException if item not found', async () => {
      actionItemsRepo.findById.mockResolvedValue(null);

      const actor = { id: 'user1', role: UserRole.RESPONSABLE };

      await expect(
        useCase.execute('nonexistent', { status: ActionItemStatus.DONE }, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('should deny changing status of archived items', async () => {
      const actionItem = mockActionItem({ isArchived: true });
      actionItemsRepo.findById.mockResolvedValue(actionItem);

      const actor = { id: 'user1', role: UserRole.RESPONSABLE };

      await expect(
        useCase.execute(
          actionItem._id.toString(),
          { status: ActionItemStatus.DONE },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should skip update if status is unchanged', async () => {
      const actionItem = mockActionItem({ status: ActionItemStatus.IN_PROGRESS });
      actionItemsRepo.findById.mockResolvedValue(actionItem);

      const actor = { id: 'user1', role: UserRole.RESPONSABLE };
      const result = await useCase.execute(
        actionItem._id.toString(),
        { status: ActionItemStatus.IN_PROGRESS },
        actor,
      );

      expect(result).toBe(actionItem);
      expect(actionItemsRepo.updateStatus).not.toHaveBeenCalled();
      expect(auditRepo.log).not.toHaveBeenCalled();
    });
  });
});
