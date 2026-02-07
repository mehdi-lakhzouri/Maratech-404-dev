import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Entities
import { Meeting, MeetingSchema } from './entities/meeting.entity';
import {
  MeetingDocumentLink,
  MeetingDocumentLinkSchema,
} from './entities/meeting-document.entity';

// Repositories
import { MeetingsRepository } from './repositories/meetings.repository';
import { MeetingDocumentsRepository } from './repositories/meeting-documents.repository';

// Use cases
import {
  CreateMeetingUseCase,
  ListMeetingsUseCase,
  GetMeetingUseCase,
  UpdateMeetingUseCase,
  UpdateMinutesUseCase,
  SaveDraftNotesUseCase,
  AttachDocumentUseCase,
  ArchiveMeetingUseCase,
  RestoreMeetingUseCase,
} from './use-cases';

// Controller
import { MeetingsController } from './meetings.controller';

// Cross-feature – DocumentsModule exports DocumentsRepository + AuditLogRepository
import { DocumentsModule } from '@features/documents/documents.module';

// Shared services
import { MeetingLinkService } from '@shared';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      { name: MeetingDocumentLink.name, schema: MeetingDocumentLinkSchema },
    ]),
    DocumentsModule,
  ],
  controllers: [MeetingsController],
  providers: [
    // Repositories
    MeetingsRepository,
    MeetingDocumentsRepository,

    // Services
    MeetingLinkService,

    // Use cases
    CreateMeetingUseCase,
    ListMeetingsUseCase,
    GetMeetingUseCase,
    UpdateMeetingUseCase,
    UpdateMinutesUseCase,
    SaveDraftNotesUseCase,
    AttachDocumentUseCase,
    ArchiveMeetingUseCase,
    RestoreMeetingUseCase,
  ],
  exports: [MeetingsRepository],
})
export class MeetingsModule {}
