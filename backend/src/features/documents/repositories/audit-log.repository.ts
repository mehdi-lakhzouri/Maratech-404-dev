import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly model: Model<AuditLogDocument>,
  ) {}

  async log(entry: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    summary?: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    await this.model.create({
      ...entry,
      actorId: new Types.ObjectId(entry.actorId),
    });
  }
}
