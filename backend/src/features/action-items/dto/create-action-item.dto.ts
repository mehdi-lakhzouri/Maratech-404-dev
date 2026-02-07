/**
 * Create Action Item DTO
 * ----------------------
 * Validation for creating new action items.
 */

import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActionItemSource } from '../schemas/action-item.schema';

export class CreateActionItemDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(120, { message: 'Title must be at most 120 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must be at most 2000 characters' })
  description?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid assignedTo ID' })
  assignedTo?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid due date format' })
  dueDate?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid project ID' })
  projectId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid meeting ID' })
  meetingId?: string;

  @IsOptional()
  @IsEnum(ActionItemSource, { message: 'Invalid source' })
  source?: ActionItemSource;
}
