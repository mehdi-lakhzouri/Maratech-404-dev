/**
 * User Integration Schema
 * -----------------------
 * Schema for storing user integration credentials (e.g., Trello tokens).
 * Tokens are encrypted at rest.
 */

import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';

export type UserIntegrationDocument = UserIntegration & MongoDocument;

/**
 * Supported integration providers
 */
export enum IntegrationProvider {
  TRELLO = 'TRELLO',
}

@Schema({
  timestamps: true,
  collection: 'user_integrations',
})
export class UserIntegration {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(IntegrationProvider),
    required: true,
  })
  provider: IntegrationProvider;

  @Prop({
    type: String,
    required: true,
  })
  accessTokenEncrypted: string;

  @Prop(
    raw({
      defaultBoardId: { type: String },
      defaultListId: { type: String },
      username: { type: String },
      fullName: { type: String },
    }),
  )
  meta?: {
    defaultBoardId?: string;
    defaultListId?: string;
    username?: string;
    fullName?: string;
  };

  // Timestamps (auto-managed by Mongoose)
  createdAt: Date;
  updatedAt: Date;
}

export const UserIntegrationSchema = SchemaFactory.createForClass(UserIntegration);

// Compound unique index: one integration per user per provider
UserIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });
