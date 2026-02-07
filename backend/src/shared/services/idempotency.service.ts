import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

interface IdempotencyEntry {
  userId: Types.ObjectId;
  idempotencyKey: string;
  endpoint: string;
  response: any;
  timestamp: Date;
  expiresAt: Date;
}

@Injectable()
export class IdempotencyService {
  private cache = new Map<string, IdempotencyEntry>();

  async getCachedResponse(
    userId: Types.ObjectId,
    idempotencyKey: string,
    endpoint: string,
  ): Promise<any> {
    const key = this.buildKey(userId, idempotencyKey, endpoint);
    const entry = this.cache.get(key);

    if (entry && entry.expiresAt > new Date()) {
      return entry.response;
    }

    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  async cacheResponse(
    userId: Types.ObjectId,
    idempotencyKey: string,
    endpoint: string,
    response: any,
    ttlMinutes = 24 * 60,
  ): Promise<void> {
    const key = this.buildKey(userId, idempotencyKey, endpoint);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    this.cache.set(key, {
      userId,
      idempotencyKey,
      endpoint,
      response,
      timestamp: new Date(),
      expiresAt,
    });
  }

  private buildKey(userId: Types.ObjectId, idempotencyKey: string, endpoint: string): string {
    return `${userId}:${idempotencyKey}:${endpoint}`;
  }
}
