/**
 * Trello Module
 * -------------
 * Feature module for Trello integration.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schema
import {
  UserIntegration,
  UserIntegrationSchema,
} from './schemas/user-integration.schema';

// Repository
import { UserIntegrationsRepository } from './repositories/user-integrations.repository';

// Service
import { TrelloService } from './trello.service';

// Controller
import { TrelloController } from './trello.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: UserIntegration.name, schema: UserIntegrationSchema },
    ]),
  ],
  controllers: [TrelloController],
  providers: [
    UserIntegrationsRepository,
    TrelloService,
  ],
  exports: [TrelloService, UserIntegrationsRepository],
})
export class TrelloModule {}
