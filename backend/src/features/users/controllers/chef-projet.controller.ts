/**
 * Chef Projet Controller
 * ----------------------
 * REST API endpoints for Chef de Projet role.
 * - View all users (read-only)
 * - Edit own profile
 * - Add consultants (single and bulk)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@features/auth/guards/roles.guard';
import { Roles } from '@features/auth/decorators/roles.decorator';
import { CurrentUser } from '@features/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@features/auth/strategies/jwt.strategy';
import { UserRole } from '../entities/user-role.enum';
import { UsersService } from '../services/users.service';
import { ChefProjetService } from '../services/chef-projet.service';
import {
  UsersQueryDto,
  UpdateUserDto,
  ChangePasswordDto,
  CreateConsultantDto,
  BulkCreateConsultantsDto,
} from '../dto/user.dto';

@Controller('chef-projet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CHEF_PROJET)
export class ChefProjetController {
  constructor(
    private readonly usersService: UsersService,
    private readonly chefProjetService: ChefProjetService,
  ) {}

  // ========================
  // USERS - READ ONLY
  // ========================

  /**
   * GET /chef-projet/users - Get paginated list of users (read-only)
   */
  @Get('users')
  async listUsers(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /chef-projet/users/:id - Get user by ID (read-only)
   */
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * GET /chef-projet/users/stats - Get user statistics (read-only)
   */
  @Get('users/stats')
  async getUserStats() {
    return this.usersService.getStats();
  }

  // ========================
  // PROFILE - SELF EDIT
  // ========================

  /**
   * GET /chef-projet/profile - Get own profile
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  /**
   * PUT /chef-projet/profile - Update own profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ) {
    // Prevent role change
    if (dto.role && dto.role !== UserRole.CHEF_PROJET) {
      throw new ForbiddenException('Vous ne pouvez pas changer votre propre rôle');
    }
    return this.usersService.update(user.id, dto);
  }

  /**
   * PATCH /chef-projet/profile/password - Change own password
   */
  @Patch('profile/password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  // ========================
  // CONSULTANTS MANAGEMENT
  // ========================

  /**
   * POST /chef-projet/consultants - Add single consultant
   */
  @Post('consultants')
  @HttpCode(HttpStatus.CREATED)
  async addConsultant(@Body() dto: CreateConsultantDto) {
    return this.chefProjetService.createConsultant(dto);
  }

  /**
   * POST /chef-projet/consultants/bulk - Add multiple consultants
   */
  @Post('consultants/bulk')
  @HttpCode(HttpStatus.CREATED)
  async addConsultantsBulk(@Body() dto: BulkCreateConsultantsDto) {
    return this.chefProjetService.createConsultantsBulk(dto.consultants);
  }
}
