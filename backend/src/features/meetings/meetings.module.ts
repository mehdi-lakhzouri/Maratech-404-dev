import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema, MeetingDocument, MeetingDocumentSchema } from '@shared/db/schemas';
import { MeetingsController } from './controllers/meetings.controller';
import { MeetingsService } from './services/meetings.service';
import { MeetingsRepository } from './repositories/meetings.repository';
import { AuditService, IdempotencyService } from '@shared/services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      { name: MeetingDocument.name, schema: MeetingDocumentSchema },
    ]),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsRepository, AuditService, IdempotencyService],
  exports: [MeetingsService, MeetingsRepository, AuditService, IdempotencyService],
})
export class MeetingsModule {}
