/**
 * Get Action Item Use Case
 * ------------------------
 * Business logic for retrieving a single action item.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActionItemsRepository } from '../repositories/action-items.repository';

@Injectable()
export class GetActionItemUseCase {
  private readonly logger = new Logger(GetActionItemUseCase.name);

  constructor(private readonly actionItemsRepo: ActionItemsRepository) {}

  async execute(id: string) {
    this.logger.debug(`Getting action item: ${id}`);
    
    const actionItem = await this.actionItemsRepo.findById(id);
    
    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    return actionItem;
  }
}
