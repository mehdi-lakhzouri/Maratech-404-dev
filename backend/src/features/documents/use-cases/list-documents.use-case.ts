import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '../repositories/documents.repository';
import { ListDocumentsQueryDto } from '../dto/document.dto';

@Injectable()
export class ListDocumentsUseCase {
  constructor(private readonly documentsRepo: DocumentsRepository) {}

  async execute(query: ListDocumentsQueryDto) {
    return this.documentsRepo.findAll(query);
  }

  async getAllTags(): Promise<string[]> {
    return this.documentsRepo.getDistinctTags();
  }
}
