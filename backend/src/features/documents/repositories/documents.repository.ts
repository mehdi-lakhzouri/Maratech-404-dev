import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentEntity, DocumentEntityDocument } from '../entities/document.entity';
import { ListDocumentsQueryDto } from '../dto/document.dto';

@Injectable()
export class DocumentsRepository {
  constructor(
    @InjectModel(DocumentEntity.name)
    private readonly model: Model<DocumentEntityDocument>,
  ) {}

  async create(data: Partial<DocumentEntity>): Promise<DocumentEntityDocument> {
    return this.model.create(data);
  }

  async findByPublicId(publicId: string): Promise<DocumentEntityDocument | null> {
    return this.model.findOne({ publicId }).exec();
  }

  async findByIdempotencyKey(key: string): Promise<DocumentEntityDocument | null> {
    return this.model.findOne({ idempotencyKey: key }).exec();
  }

  async findAll(query: ListDocumentsQueryDto) {
    const {
      type,
      q,
      projectId,
      meetingId,
      uploadedBy,
      limit = 20,
      page = 1,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
    } = query;

    // Handle archived - the controller already fixed the conversion issue
    const archived = query.archived === true;

    const filter: Record<string, unknown> = {
      isArchived: archived,
    };

    if (type) filter.type = type;
    if (projectId) filter.projectId = new Types.ObjectId(projectId);
    if (meetingId) filter.meetingId = new Types.ObjectId(meetingId);
    if (uploadedBy) filter.uploadedBy = new Types.ObjectId(uploadedBy);
    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [documents, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'fullName email')
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async archive(publicId: string, actorId: string): Promise<DocumentEntityDocument | null> {
    return this.model.findOneAndUpdate(
      { publicId },
      {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: new Types.ObjectId(actorId),
      },
      { new: true },
    ).exec();
  }

  async restore(publicId: string): Promise<DocumentEntityDocument | null> {
    return this.model.findOneAndUpdate(
      { publicId },
      {
        isArchived: false,
        $unset: { archivedAt: 1, archivedBy: 1 },
      },
      { new: true },
    ).exec();
  }

  async updateByPublicId(
    publicId: string,
    data: Partial<Pick<DocumentEntity, 'title' | 'type' | 'description' | 'tags'>>,
  ): Promise<DocumentEntityDocument | null> {
    return this.model
      .findOneAndUpdate({ publicId }, { $set: data }, { new: true })
      .populate('uploadedBy', 'fullName email')
      .exec();
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ publicId }).exec();
    return result.deletedCount > 0;
  }

  async getDistinctTags(): Promise<string[]> {
    return this.model.distinct('tags').exec();
  }
}
