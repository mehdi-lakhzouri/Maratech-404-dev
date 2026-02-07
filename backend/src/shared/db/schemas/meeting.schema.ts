import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetingDocument = Meeting & Document;

@Schema({ timestamps: true, collection: 'meetings' })
export class Meeting {
  @Prop({ required: true, trim: true, index: true })
  subject: string;

  @Prop({ required: true, index: true })
  scheduledAt: Date;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  participantsText?: string;

  // ✅ FIX 1: Change 'users' to 'User'
  @Prop({ type: [Types.ObjectId], ref: 'User' })
  participantIds?: Types.ObjectId[];

  // ✅ FIX 2: Change 'projects' to 'Project' (assuming your Project model is capitalized)
  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop({
    type: {
      content: { type: String, required: true },
      format: { type: String, enum: ['plain', 'markdown'], default: 'plain' },
      updatedAt: { type: Date, default: () => new Date() },
      // ✅ FIX 3: Change 'users' to 'User'
      updatedBy: { type: Types.ObjectId, ref: 'User' },
    },
  })
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

  // ✅ FIX 4: Change 'users' to 'User'
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false, index: true })
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;

  // ✅ FIX 5: Change 'users' to 'User'
  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy?: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

MeetingSchema.index({ projectId: 1, scheduledAt: -1 });
MeetingSchema.index({ createdBy: 1, createdAt: -1 });
MeetingSchema.index({ scheduledAt: 1, isArchived: 1 });
MeetingSchema.index({ subject: 'text' });