import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MeetingDocumentLink,
  MeetingDocumentLinkDocument,
} from '../entities/meeting-document.entity';

@Injectable()
export class MeetingDocumentsRepository {
  constructor(
    @InjectModel(MeetingDocumentLink.name)
    private readonly model: Model<MeetingDocumentLinkDocument>,
  ) {}

  async attach(
    meetingId: string,
    documentId: string,
    attachedBy: string,
  ): Promise<MeetingDocumentLinkDocument> {
    return this.model.create({
      meetingId: new Types.ObjectId(meetingId),
      documentId: new Types.ObjectId(documentId),
      attachedBy: new Types.ObjectId(attachedBy),
    });
  }

  async findByMeetingId(meetingId: string): Promise<MeetingDocumentLinkDocument[]> {
    return this.model
      .find({ meetingId: new Types.ObjectId(meetingId) })
      .populate({
        path: 'documentId',
        select: 'publicId title type originalFileName sizeBytes mimeType uploadedAt',
        populate: { path: 'uploadedBy', select: 'fullName email' },
      })
      .populate('attachedBy', 'fullName email')
      .lean()
      .exec();
  }

  async exists(meetingId: string, documentId: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({
        meetingId: new Types.ObjectId(meetingId),
        documentId: new Types.ObjectId(documentId),
      })
      .exec();
    return count > 0;
  }

  async detach(meetingId: string, documentId: string): Promise<boolean> {
    const result = await this.model
      .deleteOne({
        meetingId: new Types.ObjectId(meetingId),
        documentId: new Types.ObjectId(documentId),
      })
      .exec();
    return result.deletedCount > 0;
  }

  async detachAllByMeeting(meetingId: string): Promise<number> {
    const result = await this.model
      .deleteMany({ meetingId: new Types.ObjectId(meetingId) })
      .exec();
    return result.deletedCount;
  }
}
