import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

// Entities
import { DocumentEntity, DocumentEntitySchema } from './entities/document.entity';
import { AuditLog, AuditLogSchema } from './entities/audit-log.entity';

// Repositories
import { DocumentsRepository } from './repositories/documents.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

// Storage
import { FILE_STORAGE_TOKEN } from './storage/file-storage.interface';
import { LocalStorageAdapter } from './storage/local-storage.adapter';

// Use cases
import {
  UploadDocumentUseCase,
  ListDocumentsUseCase,
  GetDocumentUseCase,
  DownloadDocumentUseCase,
  ArchiveDocumentUseCase,
  RestoreDocumentUseCase,
  UpdateDocumentUseCase,
  DeleteDocumentUseCase,
} from './use-cases';

// Controller
import { DocumentsController } from './documents.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentEntitySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [DocumentsController],
  providers: [
    // Repositories
    DocumentsRepository,
    AuditLogRepository,

    // Storage adapter (swap for S3StorageAdapter in production)
    {
      provide: FILE_STORAGE_TOKEN,
      useClass: LocalStorageAdapter,
    },

    // Use cases
    UploadDocumentUseCase,
    ListDocumentsUseCase,
    GetDocumentUseCase,
    DownloadDocumentUseCase,
    ArchiveDocumentUseCase,
    RestoreDocumentUseCase,
    UpdateDocumentUseCase,
    DeleteDocumentUseCase,
  ],
  exports: [DocumentsRepository, AuditLogRepository],
})
export class DocumentsModule {}
