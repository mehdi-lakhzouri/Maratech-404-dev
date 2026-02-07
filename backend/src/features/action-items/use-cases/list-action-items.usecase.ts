/**
 * List Action Items Use Case
 * --------------------------
 * Business logic for listing action items with filters.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ActionItemsRepository } from '../repositories/action-items.repository';
import { ListActionItemsDto } from '../dto/list-action-items.dto';

@Injectable()
export class ListActionItemsUseCase {
  private readonly logger = new Logger(ListActionItemsUseCase.name);

  constructor(private readonly actionItemsRepo: ActionItemsRepository) {}

  async execute(query: ListActionItemsDto) {
    this.logger.debug(`Listing action items with query: ${JSON.stringify(query)}`);
    return this.actionItemsRepo.findAll(query);
  }
}
