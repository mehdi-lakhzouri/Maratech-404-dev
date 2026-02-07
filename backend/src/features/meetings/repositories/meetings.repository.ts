import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument } from '../entities/meeting.entity';
import { ListMeetingsQueryDto } from '../dto/meeting.dto';

@Injectable()
export class MeetingsRepository {
  constructor(
    @InjectModel(Meeting.name)
    private readonly model: Model<MeetingDocument>,
  ) {}

  async create(data: Partial<Meeting>): Promise<MeetingDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<MeetingDocument | null> {
    return this.model
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('participantIds', 'fullName email')
      .exec();
  }

  async findByIdempotencyKey(key: string): Promise<MeetingDocument | null> {
    return this.model.findOne({ idempotencyKey: key }).exec();
  }

  async findAll(query: ListMeetingsQueryDto) {
    const {
      projectId,
      from,
      to,
      q,
      limit = 20,
      page = 1,
      sortBy = 'scheduledAt',
      sortOrder = 'desc',
    } = query;

    const archived = query.archived === true;

    const filter: Record<string, unknown> = {
      isArchived: archived,
    };

    if (projectId) filter.projectId = new Types.ObjectId(projectId);

    // Date range filter
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter.scheduledAt = dateFilter;
    }

    // Text search
    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [meetings, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullName email')
        .populate('participantIds', 'fullName email')
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      meetings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: Partial<Meeting>): Promise<MeetingDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate('createdBy', 'fullName email')
      .populate('participantIds', 'fullName email')
      .exec();
  }

  async updateMinutes(
    id: string,
    minutes: { content: string; format: 'plain' | 'markdown'; updatedAt: Date; updatedBy: Types.ObjectId },
  ): Promise<MeetingDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: { minutes } }, { new: true })
      .populate('createdBy', 'fullName email')
      .populate('participantIds', 'fullName email')
      .exec();
  }

  async updateDraft(id: string, draftNotes: string): Promise<MeetingDocument | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { $set: { draftNotes, draftUpdatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async archive(id: string, actorId: string): Promise<MeetingDocument | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
            archivedBy: new Types.ObjectId(actorId),
          },
        },
        { new: true },
      )
      .exec();
  }

  async restore(id: string): Promise<MeetingDocument | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          $set: { isArchived: false },
          $unset: { archivedAt: 1, archivedBy: 1 },
        },
        { new: true },
      )
      .exec();
  }
}
