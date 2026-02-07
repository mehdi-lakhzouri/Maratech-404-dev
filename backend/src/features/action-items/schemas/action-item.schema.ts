/**
 * Action Item Schema
 * ------------------
 * Mongoose schema for action items (tasks derived from meetings/projects).
 * Supports status workflow, user assignment, and Trello integration preparation.
 */

import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';

export type ActionItemDocument = ActionItem & MongoDocument;

/**
 * Action item status values
 */
export enum ActionItemStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

/**
 * Source of the action item
 */
export enum ActionItemSource {
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
}

/**
 * Trello sync status
 */
export enum TrelloSyncStatus {
  NONE = 'NONE',
  CREATED = 'CREATED',
  FAILED = 'FAILED',
}

@Schema({
  timestamps: true,
  collection: 'action_items',
})
export class ActionItem {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 120,
    index: true,
  })
  title: string;

  @Prop({
    trim: true,
    maxlength: 2000,
  })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(ActionItemStatus),
    default: ActionItemStatus.TODO,
    index: true,
  })
  status: ActionItemStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    index: true,
  })
  assignedTo?: Types.ObjectId;

  @Prop({
    type: Date,
    index: true,
  })
  dueDate?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    index: true,
  })
  projectId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Meeting',
    index: true,
  })
  meetingId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ActionItemSource),
    default: ActionItemSource.MANUAL,
  })
  source: ActionItemSource;

  // Soft archive fields
  @Prop({ default: false, index: true })
  isArchived: boolean;

  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy?: Types.ObjectId;

  // Idempotency support
  @Prop({ index: true, sparse: true })
  idempotencyKey?: string;

  // Trello integration preparation
  @Prop(
    raw({
      cardId: { type: String },
      cardUrl: { type: String },
      boardId: { type: String },
      listId: { type: String },
      syncedAt: { type: Date },
      syncStatus: {
        type: String,
        enum: Object.values(TrelloSyncStatus),
        default: TrelloSyncStatus.NONE,
      },
    }),
  )
  trello?: {
    cardId?: string;
    cardUrl?: string;
    boardId?: string;
    listId?: string;
    syncedAt?: Date;
    syncStatus?: TrelloSyncStatus;
  };

  // Timestamps (auto-managed by Mongoose)
  createdAt: Date;
  updatedAt: Date;
}

export const ActionItemSchema = SchemaFactory.createForClass(ActionItem);

// Compound indexes for common query patterns
ActionItemSchema.index({ status: 1, dueDate: 1 });
ActionItemSchema.index({ assignedTo: 1, status: 1 });
ActionItemSchema.index({ projectId: 1, status: 1 });
ActionItemSchema.index({ meetingId: 1, status: 1 });
ActionItemSchema.index({ createdBy: 1, status: 1 });
ActionItemSchema.index({ isArchived: 1, status: 1 });

// Text index for search
ActionItemSchema.index({ title: 'text', description: 'text' });
