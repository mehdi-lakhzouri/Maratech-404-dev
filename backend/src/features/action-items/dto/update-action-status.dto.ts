/**
 * Update Action Status DTO
 * ------------------------
 * Validation for status transitions.
 */

import { IsEnum } from 'class-validator';
import { ActionItemStatus } from '../schemas/action-item.schema';

export class UpdateActionStatusDto {
  @IsEnum(ActionItemStatus, {
    message: 'Status must be one of: TODO, IN_PROGRESS, DONE, CANCELED',
  })
  status: ActionItemStatus;
}
