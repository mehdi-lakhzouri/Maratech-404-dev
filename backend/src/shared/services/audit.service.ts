import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';

export enum AuditAction {
  MEETING_CREATED = 'MEETING_CREATED',
  MEETING_UPDATED = 'MEETING_UPDATED',
  MEETING_MINUTES_UPDATED = 'MEETING_MINUTES_UPDATED',
  MEETING_ARCHIVED = 'MEETING_ARCHIVED',
}

interface AuditLogEntry {
  actorId: Types.ObjectId;
  action: AuditAction | string;
  resourceId?: string | Types.ObjectId;
  resourceType?: string;
  entityId?: string | Types.ObjectId;
  entityType?: string;
  summary?: string;
  changes?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private auditLogs: AuditLogEntry[] = [];

  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };
    this.auditLogs.push(logEntry);
    this.logger.log(
      `[AUDIT] ${entry.action} by ${entry.actorId} on ${entry.resourceType}`,
    );
  }

  getLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }
}
