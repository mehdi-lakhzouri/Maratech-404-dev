import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({
  timestamps: true,
  collection: 'sessions',
})
export class Session {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
  })
  refreshTokenHash: string;

  @Prop({
    required: true,
  })
  expiresAt: Date;

  @Prop()
  revokedAt?: Date;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// TTL index to automatically delete expired sessions after 1 day past expiration
SessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 86400 }, // 24 hours after expiresAt
);

// Index for finding user sessions
SessionSchema.index({ userId: 1, revokedAt: 1 });
