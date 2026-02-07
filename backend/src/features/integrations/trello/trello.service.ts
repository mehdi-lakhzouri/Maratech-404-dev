/**
 * Trello Service
 * --------------
 * Service for Trello integration operations.
 * Currently handles token storage only; full sync will be implemented later.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserIntegrationsRepository } from './repositories/user-integrations.repository';
import { IntegrationProvider } from './schemas/user-integration.schema';
import { encryptData, decryptData } from '@shared/security/crypto.utils';

export interface TrelloStatus {
  connected: boolean;
  defaultBoardId?: string;
  defaultListId?: string;
  username?: string;
}

@Injectable()
export class TrelloService {
  private readonly logger = new Logger(TrelloService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly integrationsRepo: UserIntegrationsRepository,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('env.encryptionKey')!;
  }

  /**
   * Get Trello connection status for a user
   */
  async getStatus(userId: string): Promise<TrelloStatus> {
    const integration = await this.integrationsRepo.findByUserAndProvider(
      userId,
      IntegrationProvider.TRELLO,
    );

    if (!integration) {
      return { connected: false };
    }

    return {
      connected: true,
      defaultBoardId: integration.meta?.defaultBoardId,
      defaultListId: integration.meta?.defaultListId,
      username: integration.meta?.username,
    };
  }

  /**
   * Connect Trello for a user (store encrypted token)
   */
  async connect(
    userId: string,
    token: string,
    options?: {
      defaultBoardId?: string;
      defaultListId?: string;
    },
  ): Promise<TrelloStatus> {
    // Encrypt the token
    const encryptedToken = encryptData(token, this.encryptionKey);

    // Store the integration
    await this.integrationsRepo.upsert({
      userId,
      provider: IntegrationProvider.TRELLO,
      accessTokenEncrypted: encryptedToken,
      meta: {
        defaultBoardId: options?.defaultBoardId,
        defaultListId: options?.defaultListId,
      },
    });

    this.logger.log(`Trello connected for user ${userId}`);

    return {
      connected: true,
      defaultBoardId: options?.defaultBoardId,
      defaultListId: options?.defaultListId,
    };
  }

  /**
   * Disconnect Trello for a user
   */
  async disconnect(userId: string): Promise<boolean> {
    const deleted = await this.integrationsRepo.delete(
      userId,
      IntegrationProvider.TRELLO,
    );

    if (deleted) {
      this.logger.log(`Trello disconnected for user ${userId}`);
    }

    return deleted;
  }

  /**
   * Get decrypted token for API calls (internal use)
   */
  async getDecryptedToken(userId: string): Promise<string | null> {
    const integration = await this.integrationsRepo.findByUserAndProvider(
      userId,
      IntegrationProvider.TRELLO,
    );

    if (!integration) {
      return null;
    }

    try {
      return decryptData(integration.accessTokenEncrypted, this.encryptionKey);
    } catch (error) {
      this.logger.error(`Failed to decrypt Trello token for user ${userId}`, error);
      return null;
    }
  }

  /**
   * Update default board/list settings
   */
  async updateDefaults(
    userId: string,
    defaults: {
      defaultBoardId?: string;
      defaultListId?: string;
    },
  ): Promise<TrelloStatus> {
    const updated = await this.integrationsRepo.updateMeta(
      userId,
      IntegrationProvider.TRELLO,
      defaults,
    );

    if (!updated) {
      return { connected: false };
    }

    return {
      connected: true,
      defaultBoardId: updated.meta?.defaultBoardId,
      defaultListId: updated.meta?.defaultListId,
      username: updated.meta?.username,
    };
  }
}
