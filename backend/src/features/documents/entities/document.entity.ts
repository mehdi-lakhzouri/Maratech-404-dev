import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';
import { DocumentType } from './document-type.enum';

export type DocumentEntityDocument = DocumentEntity & MongoDocument;

@Schema({
  timestamps: true,
  collection: 'documents',
})
export class DocumentEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  publicId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    type: String,
    enum: Object.values(DocumentType),
    required: true,
    index: true,
  })
  type: DocumentType;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Meeting' })
  meetingId?: Types.ObjectId;

  // ---- File metadata ----

  @Prop({ required: true, enum: ['local', 's3'], default: 'local' })
  storageProvider: 'local' | 's3';

  @Prop({ required: true })
  storageKey: string;

  @Prop()
  fileUrl?: string;

  @Prop({ required: true })
  originalFileName: string;

  @Prop({ required: true })
  safeFileName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  sizeBytes: number;

  @Prop({ required: true })
  checksumSha256: string;

  // ---- Ownership ----

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true, index: true })
  uploadedAt: Date;

  // ---- Soft archive ----

  @Prop({ default: false, index: true })
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy?: Types.ObjectId;

  // ---- Idempotency ----

  @Prop({ index: true, sparse: true })
  idempotencyKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const DocumentEntitySchema =
 SchemaFactory.createForClass(DocumentEntity);

// Compound indexes
DocumentEntitySchema.index({ type: 1, uploadedAt: -1 });
DocumentEntitySchema.index({ projectId: 1, type: 1 });
DocumentEntitySchema.index({ title: 'text', tags: 'text' });
