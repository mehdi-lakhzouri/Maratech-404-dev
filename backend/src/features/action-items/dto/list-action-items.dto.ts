/**
 * List Action Items Query DTO
 * ---------------------------
 * Query parameters for filtering and paginating action items.
 */

import {
  IsOptional,
  IsMongoId,
  IsEnum,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ActionItemStatus } from '../schemas/action-item.schema';

export class ListActionItemsDto {
  @IsOptional()
  @IsMongoId({ message: 'Invalid project ID' })
  projectId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid meeting ID' })
  meetingId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid assignedTo ID' })
  assignedTo?: string;

  @IsOptional()
  @IsEnum(ActionItemStatus, { message: 'Invalid status filter' })
  status?: ActionItemStatus;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['createdAt', 'dueDate', 'status', 'title'], { 
    message: 'Sort by must be one of: createdAt, dueDate, status, title' 
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be asc or desc' })
  sortOrder?: 'asc' | 'desc';
}
