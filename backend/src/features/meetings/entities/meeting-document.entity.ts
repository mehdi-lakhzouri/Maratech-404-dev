import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';

export type MeetingDocumentLinkDocument = MeetingDocumentLink & MongoDocument;

@Schema({
  timestamps: { createdAt: 'attachedAt', updatedAt: false },
  collection: 'meeting_documents',
})
export class MeetingDocumentLink {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Meeting', required: true, index: true })
  meetingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DocumentEntity', required: true, index: true })
  documentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  attachedBy: Types.ObjectId;

  attachedAt: Date;
}

export const MeetingDocumentLinkSchema = SchemaFactory.createForClass(MeetingDocumentLink);

// Unique compound index: one document per meeting
MeetingDocumentLinkSchema.index({ meetingId: 1, documentId: 1 }, { unique: true });
