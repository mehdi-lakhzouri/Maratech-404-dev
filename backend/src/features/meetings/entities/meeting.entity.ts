import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';

export type MeetingDocument = Meeting & MongoDocument;

@Schema({
  timestamps: true,
  collection: 'meetings',
})
export class Meeting {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  subject: string;

  @Prop({ required: true, index: true })
  scheduledAt: Date;

  @Prop({ index: true })
  endDate?: Date;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  meetingLink?: string;

  @Prop({ trim: true })
  participantsText?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participantIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop(
    raw({
      content: { type: String, default: '' },
      format: { type: String, enum: ['plain', 'markdown'], default: 'plain' },
      updatedAt: { type: Date },
      updatedBy: { type: Types.ObjectId, ref: 'User' },
    }),
  )
  minutes?: {
    content: string;
    format: 'plain' | 'markdown';
    updatedAt?: Date;
    updatedBy?: Types.ObjectId;
  };

  @Prop()
  draftNotes?: string;

  @Prop()
  draftUpdatedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false, index: true })
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy?: Types.ObjectId;

  @Prop({ index: true, sparse: true })
  idempotencyKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

// Compound indexes
MeetingSchema.index({ scheduledAt: -1, isArchived: 1 });
MeetingSchema.index({ createdBy: 1, scheduledAt: -1 });
MeetingSchema.index({ subject: 'text' });
