import {
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ========================
// CREATE
// ========================

export class CreateMeetingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subject: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  participantsText?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  participantIds?: string[];

  @IsOptional()
  @IsMongoId()
  projectId?: string;
}

// ========================
// UPDATE
// ========================

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subject?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  participantsText?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  participantIds?: string[];
}

// ========================
// MINUTES
// ========================

export class UpdateMinutesDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['plain', 'markdown'])
  format?: 'plain' | 'markdown';
}

// ========================
// DRAFT
// ========================

export class SaveDraftDto {
  @IsString()
  draftNotes: string;
}

// ========================
// ATTACH DOCUMENT
// ========================

export class AttachDocumentDto {
  @IsMongoId()
  documentId: string;
}

// ========================
// LIST / QUERY
// ========================

export class ListMeetingsQueryDto {
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
  }, { toClassOnly: true })
  archived?: boolean;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
