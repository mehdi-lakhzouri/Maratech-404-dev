/**
 * Connect Trello DTO
 * ------------------
 * Validation for connecting Trello integration.
 */

import { IsString, IsOptional, MinLength } from 'class-validator';

export class ConnectTrelloDto {
  @IsString()
  @MinLength(1, { message: 'Token is required' })
  token: string;

  @IsOptional()
  @IsString()
  defaultBoardId?: string;

  @IsOptional()
  @IsString()
  defaultListId?: string;
}
