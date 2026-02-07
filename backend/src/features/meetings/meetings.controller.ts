/**
 * Meetings Controller
 * -------------------
 * Thin REST controller – delegates all logic to use-cases.
 * Routes under /api/v1/meetings
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
  CreateMeetingDto,
  UpdateMeetingDto,
  UpdateMinutesDto,
  SaveDraftDto,
  AttachDocumentDto,
  ListMeetingsQueryDto,
} from './dto/meeting.dto';

import {
  CreateMeetingUseCase,
  ListMeetingsUseCase,
  GetMeetingUseCase,
  UpdateMeetingUseCase,
  UpdateMinutesUseCase,
  SaveDraftNotesUseCase,
  AttachDocumentUseCase,
  ArchiveMeetingUseCase,
  RestoreMeetingUseCase,
} from './use-cases';

@Controller('meetings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(
    private readonly createMeetingUC: CreateMeetingUseCase,
    private readonly listMeetingsUC: ListMeetingsUseCase,
    private readonly getMeetingUC: GetMeetingUseCase,
    private readonly updateMeetingUC: UpdateMeetingUseCase,
    private readonly updateMinutesUC: UpdateMinutesUseCase,
    private readonly saveDraftUC: SaveDraftNotesUseCase,
    private readonly attachDocUC: AttachDocumentUseCase,
    private readonly archiveMeetingUC: ArchiveMeetingUseCase,
    private readonly restoreMeetingUC: RestoreMeetingUseCase,
  ) {}

  /**
   * POST /meetings – Create a new meeting
   */
  @Post()
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.createMeetingUC.execute(dto, user.id, idempotencyKey);
  }

  /**
   * GET /meetings – List meetings with filters
   */
  @Get()
  async list(
    @Query() query: ListMeetingsQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    const rawArchived = req.query.archived as string | undefined;
    const archived = rawArchived === 'true';

    return this.listMeetingsUC.execute({ ...query, archived });
  }

  /**
   * GET /meetings/:id – Get meeting details + attached documents
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getMeetingUC.execute(id);
  }

  /**
   * PATCH /meetings/:id – Update meeting fields
   */
  @Patch(':id')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateMeetingUC.execute(id, dto, user.id, user.role);
  }

  /**
   * PATCH /meetings/:id/minutes – Update meeting minutes (compte rendu)
   */
  @Patch(':id/minutes')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async updateMinutes(
    @Param('id') id: string,
    @Body() dto: UpdateMinutesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateMinutesUC.execute(id, dto, user.id, user.role);
  }

  /**
   * PATCH /meetings/:id/draft – Auto-save draft notes
   */
  @Patch(':id/draft')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async saveDraft(
    @Param('id') id: string,
    @Body() dto: SaveDraftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.saveDraftUC.execute(id, dto, user.id, user.role);
  }

  /**
   * POST /meetings/:id/attach-document – Attach an existing document
   */
  @Post(':id/attach-document')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async attachDocument(
    @Param('id') id: string,
    @Body() dto: AttachDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachDocUC.execute(id, dto, user.id);
  }

  /**
   * POST /meetings/:id/archive – Archive a meeting
   */
  @Post(':id/archive')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.archiveMeetingUC.execute(id, user.id, user.role);
  }

  /**
   * POST /meetings/:id/restore – Restore an archived meeting
   */
  @Post(':id/restore')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restoreMeetingUC.execute(id, user.id, user.role);
  }
}
