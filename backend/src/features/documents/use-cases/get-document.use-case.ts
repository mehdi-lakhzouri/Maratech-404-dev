import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentsRepository } from '../repositories/documents.repository';

@Injectable()
export class GetDocumentUseCase {
  constructor(private readonly documentsRepo: DocumentsRepository) {}

  async execute(publicId: string) {
    const doc = await this.documentsRepo.findByPublicId(publicId);
    if (!doc) {
      throw new NotFoundException(`Document introuvable: ${publicId}`);
    }
    return doc;
  }
}
