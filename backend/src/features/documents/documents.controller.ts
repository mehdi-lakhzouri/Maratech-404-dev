/**
 * Documents Controller
 * --------------------
 * Thin REST controller – delegates all logic to use-cases.
 * Routes under /api/v1/documents
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@features/auth/guards/roles.guard';
import { Roles } from '@features/auth/decorators/roles.decorator';
import { CurrentUser } from '@features/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@features/auth/strategies/jwt.strategy';
import { UserRole } from '@features/users/entities/user-role.enum';

import { CreateDocumentDto, ListDocumentsQueryDto, UpdateDocumentDto } from './dto/document.dto';
import {
  UploadDocumentUseCase,
  ListDocumentsUseCase,
  GetDocumentUseCase,
  DownloadDocumentUseCase,
  ArchiveDocumentUseCase,
  RestoreDocumentUseCase,
  UpdateDocumentUseCase,
  DeleteDocumentUseCase,
} from './use-cases';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private readonly uploadUC: UploadDocumentUseCase,
    private readonly listUC: ListDocumentsUseCase,
    private readonly getUC: GetDocumentUseCase,
    private readonly downloadUC: DownloadDocumentUseCase,
    private readonly archiveUC: ArchiveDocumentUseCase,
    private readonly restoreUC: RestoreDocumentUseCase,
    private readonly updateUC: UpdateDocumentUseCase,
    private readonly deleteUC: DeleteDocumentUseCase,
  ) {}

  /**
   * POST /documents – Upload a new document (multipart/form-data)
   */
  @Post()
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @Body() dto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.uploadUC.execute(dto, file, user.id, idempotencyKey);
  }

  /**
   * GET /documents – List documents with filters
   */
  @Get()
  async list(
    @Query() query: ListDocumentsQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Fix: Get raw archived value from query string to avoid implicit conversion bug
    const rawArchived = req.query.archived as string | undefined;
    const archived = rawArchived === 'true';
    
    return this.listUC.execute({ ...query, archived });
  }

  /**
   * GET /documents/:publicId – Get document details
   */
  @Get(':publicId')
  async getByPublicId(@Param('publicId') publicId: string) {
    return this.getUC.execute(publicId);
  }

  /**
   * GET /documents/:publicId/download – Secure file download
   */
  @Get(':publicId/download')
  async download(
    @Param('publicId') publicId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, safeFileName } = await this.downloadUC.execute(
      publicId,
      user.id,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    });

    res.end(buffer);
  }

  /**
   * POST /documents/:publicId/archive – Soft-archive a document
   */
  @Post(':publicId/archive')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async archive(
    @Param('publicId') publicId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.archiveUC.execute(publicId, user.id, user.role);
  }

  /**
   * POST /documents/:publicId/restore – Restore an archived document
   */
  @Post(':publicId/restore')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('publicId') publicId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restoreUC.execute(publicId, user.id, user.role);
  }

  /**
   * PATCH /documents/:publicId – Update document metadata and optionally replace file
   */
  @Patch(':publicId')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(
    @Param('publicId') publicId: string,
    @Body() dto: UpdateDocumentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.updateUC.execute(publicId, dto, user.id, user.role, file);
  }

  /**
   * DELETE /documents/:publicId – Hard-delete a document
   */
  @Delete(':publicId')
  @Roles(UserRole.RESPONSABLE, UserRole.CHEF_PROJET)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('publicId') publicId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.deleteUC.execute(publicId, user.id, user.role);
  }

  /**
   * GET /documents/tags – Get all distinct tags
   */
  @Get('tags/all')
  async getAllTags() {
    return await this.listUC.getAllTags();
  }
}
