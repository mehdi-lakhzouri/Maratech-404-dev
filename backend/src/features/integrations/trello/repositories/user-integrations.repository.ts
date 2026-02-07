/**
 * User Integrations Repository
 * ----------------------------
 * Data access for user integrations.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserIntegration,
  UserIntegrationDocument,
  IntegrationProvider,
} from '../schemas/user-integration.schema';

@Injectable()
export class UserIntegrationsRepository {
  constructor(
    @InjectModel(UserIntegration.name)
    private readonly model: Model<UserIntegrationDocument>,
  ) {}

  /**
   * Create or update user integration
   */
  async upsert(data: {
    userId: string;
    provider: IntegrationProvider;
    accessTokenEncrypted: string;
    meta?: {
      defaultBoardId?: string;
      defaultListId?: string;
      username?: string;
      fullName?: string;
    };
  }): Promise<UserIntegrationDocument> {
    return this.model
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(data.userId),
          provider: data.provider,
        },
        {
          $set: {
            accessTokenEncrypted: data.accessTokenEncrypted,
            meta: data.meta,
          },
        },
        {
          upsert: true,
          new: true,
        },
      )
      .exec();
  }

  /**
   * Find user integration by user and provider
   */
  async findByUserAndProvider(
    userId: string,
    provider: IntegrationProvider,
  ): Promise<UserIntegrationDocument | null> {
    return this.model
      .findOne({
        userId: new Types.ObjectId(userId),
        provider,
      })
      .exec();
  }

  /**
   * Delete user integration
   */
  async delete(userId: string, provider: IntegrationProvider): Promise<boolean> {
    const result = await this.model
      .deleteOne({
        userId: new Types.ObjectId(userId),
        provider,
      })
      .exec();
    return result.deletedCount > 0;
  }

  /**
   * Update meta fields
   */
  async updateMeta(
    userId: string,
    provider: IntegrationProvider,
    meta: {
      defaultBoardId?: string;
      defaultListId?: string;
    },
  ): Promise<UserIntegrationDocument | null> {
    const updateFields: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(meta)) {
      if (value !== undefined) {
        updateFields[`meta.${key}`] = value;
      }
    }

    return this.model
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          provider,
        },
        { $set: updateFields },
        { new: true },
      )
      .exec();
  }
}
