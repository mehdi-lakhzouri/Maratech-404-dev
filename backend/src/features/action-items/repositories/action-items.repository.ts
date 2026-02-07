/**
 * Action Items Repository
 * -----------------------
 * Data access layer for action items.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ActionItem,
  ActionItemDocument,
  ActionItemStatus,
} from '../schemas/action-item.schema';
import { ListActionItemsDto } from '../dto/list-action-items.dto';

export interface CreateActionItemData {
  title: string;
  description?: string;
  assignedTo?: Types.ObjectId;
  dueDate?: Date;
  projectId?: Types.ObjectId;
  meetingId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  source?: string;
  idempotencyKey?: string;
}

export interface UpdateActionItemData {
  title?: string;
  description?: string;
  assignedTo?: Types.ObjectId | null;
  dueDate?: Date | null;
  projectId?: Types.ObjectId | null;
  meetingId?: Types.ObjectId | null;
}

@Injectable()
export class ActionItemsRepository {
  constructor(
    @InjectModel(ActionItem.name)
    private readonly model: Model<ActionItemDocument>,
  ) {}

  /**
   * Create a new action item
   */
  async create(data: CreateActionItemData): Promise<ActionItemDocument> {
    return this.model.create(data);
  }

  /**
   * Find action item by ID
   */
  async findById(id: string): Promise<ActionItemDocument | null> {
    return this.model
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .exec();
  }

  /**
   * Find by idempotency key
   */
  async findByIdempotencyKey(key: string): Promise<ActionItemDocument | null> {
    return this.model.findOne({ idempotencyKey: key }).exec();
  }

  /**
   * List action items with filters and pagination
   */
  async findAll(query: ListActionItemsDto) {
    const {
      projectId,
      meetingId,
      assignedTo,
      status,
      q,
      archived = false,
      limit = 20,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      cursor,
    } = query;

    const filter: Record<string, unknown> = {
      isArchived: archived,
    };

    // Apply filters
    if (projectId) {
      filter.projectId = new Types.ObjectId(projectId);
    }
    if (meetingId) {
      filter.meetingId = new Types.ObjectId(meetingId);
    }
    if (assignedTo) {
      filter.assignedTo = new Types.ObjectId(assignedTo);
    }
    if (status) {
      filter.status = status;
    }

    // Text search
    if (q) {
      filter.$text = { $search: q };
    }

    // Cursor-based pagination (if cursor provided)
    if (cursor) {
      try {
        const cursorId = new Types.ObjectId(cursor);
        filter._id = { $gt: cursorId };
      } catch {
        // Invalid cursor, ignore
      }
    }

    const skip = cursor ? 0 : (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullName email')
        .populate('assignedTo', 'fullName email')
        .lean()
        .exec(),
      this.model.countDocuments({ ...filter, _id: undefined }).exec(),
    ]);

    // Get next cursor
    const nextCursor =
      items.length === limit ? items[items.length - 1]._id?.toString() : null;

    return {
      items,
      meta: {
        total,
        page: cursor ? undefined : page,
        limit,
        totalPages: cursor ? undefined : Math.ceil(total / limit),
        nextCursor,
      },
    };
  }

  /**
   * Update action item fields
   */
  async update(
    id: string,
    data: UpdateActionItemData,
  ): Promise<ActionItemDocument | null> {
    // Handle null values for optional fields
    const updateData: Record<string, unknown> = {};
    const unsetData: Record<string, 1> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null) {
        unsetData[key] = 1;
      } else if (value !== undefined) {
        updateData[key] = value;
      }
    }

    const updateOp: Record<string, unknown> = {};
    if (Object.keys(updateData).length > 0) {
      updateOp.$set = updateData;
    }
    if (Object.keys(unsetData).length > 0) {
      updateOp.$unset = unsetData;
    }

    if (Object.keys(updateOp).length === 0) {
      return this.findById(id);
    }

    return this.model
      .findByIdAndUpdate(id, updateOp, { new: true })
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .exec();
  }

  /**
   * Update action item status
   */
  async updateStatus(
    id: string,
    status: ActionItemStatus,
  ): Promise<ActionItemDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .exec();
  }

  /**
   * Archive an action item
   */
  async archive(
    id: string,
    archivedBy: Types.ObjectId,
  ): Promise<ActionItemDocument | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
            archivedBy,
          },
        },
        { new: true },
      )
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .exec();
  }

  /**
   * Restore an action item
   */
  async restore(id: string): Promise<ActionItemDocument | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          $set: { isArchived: false },
          $unset: { archivedAt: 1, archivedBy: 1 },
        },
        { new: true },
      )
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .exec();
  }

  /**
   * Check if a meeting exists (stub - actual implementation would query meetings)
   */
  meetingExists(meetingId: string): boolean {
    // This would typically query the meetings collection
    // For now, we'll assume it exists if it's a valid ObjectId
    try {
      new Types.ObjectId(meetingId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update Trello sync info
   */
  async updateTrelloInfo(
    id: string,
    trelloInfo: {
      cardId?: string;
      cardUrl?: string;
      boardId?: string;
      listId?: string;
      syncedAt?: Date;
      syncStatus?: string;
    },
  ): Promise<ActionItemDocument | null> {
    const updateFields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(trelloInfo)) {
      if (value !== undefined) {
        updateFields[`trello.${key}`] = value;
      }
    }

    return this.model
      .findByIdAndUpdate(id, { $set: updateFields }, { new: true })
      .exec();
  }
}
