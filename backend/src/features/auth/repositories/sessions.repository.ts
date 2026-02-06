import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from '../entities/session.entity';

export interface CreateSessionData {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(data: CreateSessionData): Promise<SessionDocument> {
    const session = new this.sessionModel(data);
    return session.save();
  }

  async findByTokenHash(
    refreshTokenHash: string,
  ): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOne({
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }

  async findActiveByUserId(userId: Types.ObjectId): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }

  async revokeById(id: Types.ObjectId): Promise<void> {
    await this.sessionModel
      .updateOne({ _id: id }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  async revokeByTokenHash(refreshTokenHash: string): Promise<void> {
    await this.sessionModel
      .updateOne({ refreshTokenHash }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  async revokeAllByUserId(userId: Types.ObjectId): Promise<void> {
    await this.sessionModel
      .updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.sessionModel
      .deleteMany({
        expiresAt: { $lt: new Date() },
      })
      .exec();
    return result.deletedCount;
  }

  async countActiveByUserId(userId: Types.ObjectId): Promise<number> {
    return this.sessionModel
      .countDocuments({
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }
}
