import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetingDocumentDocument = MeetingDocument & Document;

@Schema({ timestamps: true, collection: 'meeting_documents' })
export class MeetingDocument {
  // ✅ FIX 6: Change 'meetings' to 'Meeting'
  @Prop({ type: Types.ObjectId, ref: 'Meeting', required: true, index: true })
  meetingId: Types.ObjectId;

  // ✅ FIX 7: Change 'documents' to 'Document' (or whatever your Document model is named)
  @Prop({ type: Types.ObjectId, ref: 'Document', required: true, index: true })
  documentId: Types.ObjectId;

  // ✅ FIX 8: Change 'users' to 'User'
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  attachedBy: Types.ObjectId;

  @Prop({ default: () => new Date() })
  attachedAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MeetingDocumentSchema = SchemaFactory.createForClass(MeetingDocument);

MeetingDocumentSchema.index({ meetingId: 1, documentId: 1 }, { unique: true });