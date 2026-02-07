/**
 * Action Items Module
 * -------------------
 * Feature module for action items (tasks) management.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schema
import { ActionItem, ActionItemSchema } from './schemas/action-item.schema';

// Repository
import { ActionItemsRepository } from './repositories/action-items.repository';

// Policy
import { ActionItemsPolicy } from './policies/action-items.policy';

// Use cases
import {
  CreateActionItemUseCase,
  ListActionItemsUseCase,
  GetActionItemUseCase,
  UpdateActionItemUseCase,
  UpdateActionStatusUseCase,
  ArchiveActionItemUseCase,
  RestoreActionItemUseCase,
} from './use-cases';

// Controller
import { ActionItemsController } from './action-items.controller';

// Cross-feature dependencies
import { DocumentsModule } from '@features/documents/documents.module';
import { MeetingsModule } from '@features/meetings/meetings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActionItem.name, schema: ActionItemSchema },
    ]),
    // Import modules that export required repositories
    DocumentsModule, // Exports AuditLogRepository
    MeetingsModule,  // Exports MeetingsRepository
  ],
  controllers: [ActionItemsController],
  providers: [
    // Repository
    ActionItemsRepository,

    // Policy
    ActionItemsPolicy,

    // Use cases
    CreateActionItemUseCase,
    ListActionItemsUseCase,
    GetActionItemUseCase,
    UpdateActionItemUseCase,
    UpdateActionStatusUseCase,
    ArchiveActionItemUseCase,
    RestoreActionItemUseCase,
  ],
  exports: [ActionItemsRepository],
})
export class ActionItemsModule {}
