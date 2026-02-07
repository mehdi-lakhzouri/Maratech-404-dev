import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument } from '@shared/db/schemas'; // Ensure this path is correct for your project

@Injectable()
export class MeetingsRepository {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<Meeting>,
    // Using explicit string 'MeetingDocument' if the class name import fails, otherwise keep MeetingDocument.name
    @InjectModel(MeetingDocument.name) private readonly meetingDocModel: Model<MeetingDocument>,
  ) {}

  async create(createData: any): Promise<Meeting> {
    const meeting = new this.meetingModel(createData);
    return meeting.save();
  }

  async findById(id: string | Types.ObjectId): Promise<Meeting | null> {
    return this.meetingModel
      .findById(id)
      // ✅ FIX: Explicitly use 'User' model (capitalized) to match your User registration
      .populate({ path: 'createdBy', select: 'fullName email role', model: 'User' })
      // ❌ DISABLED: Project model doesn't exist yet
      // .populate('projectId', 'name')
      .exec();
  }

  async findAll(filters: {
    projectId?: string;
    from?: Date;
    to?: Date;
    skip?: number;
    limit?: number;
    isArchived?: boolean;
  }): Promise<{ data: Meeting[]; total: number }> {
    const query: any = { isArchived: filters.isArchived ?? false };

    if (filters.projectId) {
      query.projectId = new Types.ObjectId(filters.projectId);
    }

    if (filters.from || filters.to) {
      query.scheduledAt = {};
      if (filters.from) query.scheduledAt.$gte = filters.from;
      if (filters.to) query.scheduledAt.$lte = filters.to;
    }

    const total = await this.meetingModel.countDocuments(query);
    const data = await this.meetingModel
      .find(query)
      // ✅ FIX: Explicitly use 'User' model
      .populate({ path: 'createdBy', select: 'fullName email role', model: 'User' })
      // ❌ DISABLED: Project model doesn't exist yet
      // .populate('projectId', 'name')
      .sort({ scheduledAt: -1 })
      .skip(filters.skip ?? 0)
      .limit(filters.limit ?? 50)
      .exec();

    return { data, total };
  }

  async update(id: string | Types.ObjectId, updateData: any): Promise<Meeting | null> {
    return this.meetingModel
      .findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true })
      // ✅ FIX: Explicitly use 'User' model
      .populate({ path: 'createdBy', select: 'fullName email role', model: 'User' })
      // ❌ DISABLED: Project model doesn't exist yet
      // .populate('projectId', 'name')
      .exec();
  }

  async updateMinutes(
    id: string | Types.ObjectId,
    content: string,
    format: 'plain' | 'markdown',
    updatedBy: Types.ObjectId,
  ): Promise<Meeting | null> {
    return this.meetingModel
      .findByIdAndUpdate(
        id,
        {
          minutes: {
            content,
            format,
            updatedAt: new Date(),
            updatedBy,
          },
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async updateDraftNotes(
    id: string | Types.ObjectId,
    draftNotes: string,
  ): Promise<Meeting | null> {
    return this.meetingModel
      .findByIdAndUpdate(
        id,
        {
          draftNotes,
          draftUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async archive(
    id: string | Types.ObjectId,
    archivedBy: Types.ObjectId,
  ): Promise<Meeting | null> {
    return this.meetingModel
      .findByIdAndUpdate(
        id,
        {
          isArchived: true,
          archivedAt: new Date(),
          archivedBy,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async restore(id: string | Types.ObjectId): Promise<Meeting | null> {
    return this.meetingModel
      .findByIdAndUpdate(
        id,
        {
          isArchived: false,
          archivedAt: undefined,
          archivedBy: undefined,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  // Meeting Documents
  async attachDocument(meetingId: Types.ObjectId, documentId: Types.ObjectId, attachedBy: Types.ObjectId) {
    const existing = await this.meetingDocModel.findOne({ meetingId, documentId });
    if (existing) return existing;

    const doc = new this.meetingDocModel({ meetingId, documentId, attachedBy });
    return doc.save();
  }

  async getAttachedDocuments(meetingId: string | Types.ObjectId) {
    return this.meetingDocModel
      .find({ meetingId })
      // ⚠️ Note: Ensure 'Document' and 'User' models exist and match these names
      .populate({ path: 'documentId', select: 'title fileName fileUrl mimeType sizeBytes', model: 'Document' })
      .populate({ path: 'attachedBy', select: 'fullName email', model: 'User' })
      .sort({ attachedAt: -1 })
      .exec();
  }

  async detachDocument(meetingId: Types.ObjectId, documentId: Types.ObjectId) {
    return this.meetingDocModel.deleteOne({ meetingId, documentId });
  }
}