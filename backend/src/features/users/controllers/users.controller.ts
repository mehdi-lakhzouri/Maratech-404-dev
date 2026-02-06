/**
 * Users Controller
 * ----------------
 * REST API endpoints for user management.
 * Requires RESPONSABLE role for all operations.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@features/auth/guards/roles.guard';
import { Roles } from '@features/auth/decorators/roles.decorator';
import { UserRole } from '../entities/user-role.enum';
import { UsersService } from '../services/users.service';
import {
  UsersQueryDto,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  BulkUpdateStatusDto,
  BulkUpdateRoleDto,
  BulkUserIdsDto,
} from '../dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESPONSABLE)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========================
  // CRUD OPERATIONS
  // ========================

  /**
   * GET /users - Get paginated list of users with filters
   */
  @Get()
  async findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /users/stats - Get user statistics
   */
  @Get('stats')
  async getStats() {
    return this.usersService.getStats();
  }

  /**
   * GET /users/:id - Get user by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * POST /users - Create new user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * PUT /users/:id - Update user
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /**
   * PATCH /users/:id/password - Change user password
   */
  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(id, dto);
  }

  /**
   * PATCH /users/:id/activate - Activate user
   */
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  /**
   * PATCH /users/:id/deactivate - Deactivate user
   */
  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * DELETE /users/:id - Soft delete user (deactivate)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  /**
   * DELETE /users/:id/permanent - Hard delete user
   */
  @Delete(':id/permanent')
  async hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id);
  }

  // ========================
  // BULK OPERATIONS
  // ========================

  /**
   * POST /users/bulk/status - Bulk update user status
   */
  @Post('bulk/status')
  async bulkUpdateStatus(@Body() dto: BulkUpdateStatusDto) {
    return this.usersService.bulkUpdateStatus(dto.userIds, dto.isActive);
  }

  /**
   * POST /users/bulk/role - Bulk update user role
   */
  @Post('bulk/role')
  async bulkUpdateRole(@Body() dto: BulkUpdateRoleDto) {
    return this.usersService.bulkUpdateRole(dto.userIds, dto.role);
  }

  /**
   * POST /users/bulk/delete - Bulk soft delete users
   */
  @Post('bulk/delete')
  async bulkDelete(@Body() dto: BulkUserIdsDto) {
    return this.usersService.bulkDelete(dto.userIds);
  }

  /**
   * POST /users/bulk/delete-permanent - Bulk hard delete users
   */
  @Post('bulk/delete-permanent')
  async bulkHardDelete(@Body() dto: BulkUserIdsDto) {
    return this.usersService.bulkHardDelete(dto.userIds);
  }
}
