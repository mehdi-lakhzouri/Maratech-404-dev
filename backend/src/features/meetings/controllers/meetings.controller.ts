import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  // UseGuards, // 🔓 DISABLED
  HttpCode,
} from '@nestjs/common';
import { MeetingsService } from '../services/meetings.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  UpdateMeetingMinutesDto,
  UpdateDraftNotesDto,
  AttachDocumentDto,
  GetMeetingsQueryDto,
} from '../dto';

// 🔓 DISABLED AUTH IMPORTS
// import { JwtAuthGuard } from '@features/auth/guards';
// import { CurrentUser } from '@features/auth/decorators';
// import { AuthenticatedUser } from '@features/auth/strategies';

// 🛠️ HACK: Hardcoded "Fake" User ID (Must be 24 chars for MongoDB)
const MOCK_USER_ID = '507f1f77bcf86cd799439011';

@Controller('meetings')
// @UseGuards(JwtAuthGuard) // 🔓 SECURITY DISABLED
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @HttpCode(201)
  // Removed @CurrentUser() user argument
  async create(@Body() createDto: CreateMeetingDto) {
    // Using MOCK_USER_ID instead of user.sub
    return this.meetingsService.createMeeting(createDto, MOCK_USER_ID, undefined);
  }

  @Get()
  async getAll(@Query() query: GetMeetingsQueryDto) {
    return this.meetingsService.getMeetings({
      projectId: query.projectId,
      from: query.from,
      to: query.to,
      skip: query.skip,
      limit: query.limit,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.meetingsService.getMeeting(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMeetingDto,
  ) {
    // Using MOCK_USER_ID
    return this.meetingsService.updateMeeting(id, updateDto, MOCK_USER_ID);
  }

  @Patch(':id/minutes')
  async updateMinutes(
    @Param('id') id: string,
    @Body() updateDto: UpdateMeetingMinutesDto,
  ) {
    return this.meetingsService.updateMeetingMinutes(id, updateDto, MOCK_USER_ID);
  }

  @Patch(':id/draft')
  async updateDraft(
    @Param('id') id: string,
    @Body() updateDto: UpdateDraftNotesDto,
  ) {
    return this.meetingsService.updateDraftNotes(id, updateDto, MOCK_USER_ID);
  }

  @Post(':id/attach-document')
  async attachDocument(
    @Param('id') id: string,
    @Body() attachDto: AttachDocumentDto,
  ) {
    return this.meetingsService.attachDocument(id, attachDto, MOCK_USER_ID);
  }

  @Get(':id/documents')
  async getAttachedDocuments(@Param('id') id: string) {
    return this.meetingsService.getAttachedDocuments(id);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.meetingsService.archiveMeeting(id, MOCK_USER_ID);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.meetingsService.restoreMeeting(id, MOCK_USER_ID);
  }
}