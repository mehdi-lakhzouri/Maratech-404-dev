/**
 * Update Action Item DTO
 * ----------------------
 * Validation for updating action item fields (not status).
 */

import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateActionItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(120, { message: 'Title must be at most 120 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must be at most 2000 characters' })
  description?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid assignedTo ID' })
  assignedTo?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid due date format' })
  dueDate?: string | null;

  @IsOptional()
  @IsMongoId({ message: 'Invalid project ID' })
  projectId?: string | null;

  @IsOptional()
  @IsMongoId({ message: 'Invalid meeting ID' })
  meetingId?: string | null;
}
