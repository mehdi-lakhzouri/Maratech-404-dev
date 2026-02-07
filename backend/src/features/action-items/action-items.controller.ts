/**
 * Action Items Controller
 * -----------------------
 * Thin REST controller – delegates all logic to use-cases.
 * Routes under /api/v1/action-items
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@features/auth/guards/roles.guard';
import { Roles } from '@features/auth/decorators/roles.decorator';
import { CurrentUser } from '@features/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@features/auth/strategies/jwt.strategy';
import { UserRole } from '@features/users/entities/user-role.enum';

import {
  CreateActionItemDto,
  UpdateActionItemDto,
  UpdateActionStatusDto,
  ListActionItemsDto,
} from './dto';

import {
  CreateActionItemUseCase,
  ListActionItemsUseCase,
  GetActionItemUseCase,
  UpdateActionItemUseCase,
  UpdateActionStatusUseCase,
  ArchiveActionItemUseCase,
  RestoreActionItemUseCase,
} from './use-cases';

@Controller('action-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActionItemsController {
  constructor(
    private readonly createActionItemUC: CreateActionItemUseCase,
    private readonly listActionItemsUC: ListActionItemsUseCase,
    private readonly getActionItemUC: GetActionItemUseCase,
    private readonly updateActionItemUC: UpdateActionItemUseCase,
    private readonly updateActionStatusUC: UpdateActionStatusUseCase,
    private readonly archiveActionItemUC: ArchiveActionItemUseCase,
    private readonly restoreActionItemUC: RestoreActionItemUseCase,
  ) {}

  /**
   * POST /action-items – Create a new action item
   */
  @Post()
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateActionItemDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.createActionItemUC.execute(
      dto,
      { id: user.id, role: user.role },
      idempotencyKey,
    );
  }

  /**
   * GET /action-items – List action items with filters
   */
  @Get()
  async list(
    @Query() query: ListActionItemsDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    // Parse archived from raw query
    const rawArchived = req.query.archived as string | undefined;
    const archived = rawArchived === 'true';

    return this.listActionItemsUC.execute({ ...query, archived });
  }

  /**
   * GET /action-items/:id – Get action item details
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getActionItemUC.execute(id);
  }

  /**
   * PATCH /action-items/:id – Update action item fields
   */
  @Patch(':id')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActionItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateActionItemUC.execute(id, dto, {
      id: user.id,
      role: user.role,
    });
  }

  /**
   * PATCH /action-items/:id/status – Update action item status
   * Special RBAC: Consultants can update if assigned
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateActionStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateActionStatusUC.execute(id, dto, {
      id: user.id,
      role: user.role,
    });
  }

  /**
   * POST /action-items/:id/archive – Archive action item
   */
  @Post(':id/archive')
  @Roles(UserRole.RESPONSABLE)
  @HttpCode(HttpStatus.OK)
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.archiveActionItemUC.execute(id, {
      id: user.id,
      role: user.role,
    });
  }

  /**
   * POST /action-items/:id/restore – Restore archived action item
   */
  @Post(':id/restore')
  @Roles(UserRole.RESPONSABLE)
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restoreActionItemUC.execute(id, {
      id: user.id,
      role: user.role,
    });
  }

  /**
   * POST /action-items/:id/push-to-trello – Push to Trello (stub for later)
   * This endpoint is prepared but not fully implemented.
   */
  @Post(':id/push-to-trello')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async pushToTrello(
    @Param('id') _id: string,
    @CurrentUser() _user: AuthenticatedUser,
    @Headers('x-idempotency-key') _idempotencyKey?: string,
  ) {
    return {
      message: 'Trello integration not yet implemented',
      status: 'NOT_IMPLEMENTED',
    };
  }
}
