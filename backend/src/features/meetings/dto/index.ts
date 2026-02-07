import { IsString, IsDate, IsOptional, IsMongoId, IsArray, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @IsString({ message: 'Subject must be a string' })
  @MinLength(3, { message: 'Subject must be at least 3 characters' })
  @MaxLength(255, { message: 'Subject must not exceed 255 characters' })
  subject: string;

  @Type(() => Date)
  @IsDate({ message: 'scheduledAt must be a valid date' })
  scheduledAt: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  participantsText?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  participantIds?: string[];

  @IsOptional()
  @IsMongoId()
  projectId?: string;
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  participantsText?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  participantIds?: string[];
}

export class UpdateMeetingMinutesDto {
  @IsString({ message: 'Content must be a string' })
  @MinLength(1, { message: 'Content cannot be empty' })
  content: string;

  @IsOptional()
  format?: 'plain' | 'markdown';
}

export class UpdateDraftNotesDto {
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  draftNotes?: string;
}

export class AttachDocumentDto {
  @IsMongoId()
  documentId: string;
}

export class GetMeetingsQueryDto {
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  limit?: number = 50;

  @IsOptional()
  skip?: number = 0;
}
