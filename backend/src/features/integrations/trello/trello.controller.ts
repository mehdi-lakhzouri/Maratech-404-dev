/**
 * Trello Controller
 * -----------------
 * REST endpoints for Trello integration management.
 * Routes under /api/v1/integrations/trello
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@features/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@features/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@features/auth/strategies/jwt.strategy';
import { TrelloService } from './trello.service';
import { ConnectTrelloDto } from './dto/connect-trello.dto';

@Controller('integrations/trello')
@UseGuards(JwtAuthGuard)
export class TrelloController {
  constructor(private readonly trelloService: TrelloService) {}

  /**
   * GET /integrations/trello/status – Get Trello connection status
   */
  @Get('status')
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.trelloService.getStatus(user.id);
  }

  /**
   * POST /integrations/trello/connect – Connect Trello account
   */
  @Post('connect')
  @HttpCode(HttpStatus.OK)
  async connect(
    @Body() dto: ConnectTrelloDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.trelloService.connect(user.id, dto.token, {
      defaultBoardId: dto.defaultBoardId,
      defaultListId: dto.defaultListId,
    });
  }

  /**
   * DELETE /integrations/trello/disconnect – Disconnect Trello account
   */
  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(@CurrentUser() user: AuthenticatedUser) {
    const disconnected = await this.trelloService.disconnect(user.id);
    return { disconnected };
  }
}
