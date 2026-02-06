/**
 * Users Service
 * -------------
 * Business logic for user management operations.
 */

import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UserDocument } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';
import { hashPassword } from '@shared/security/crypto.utils';
import {
  UsersQueryDto,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserResponseDto,
  UsersListResponseDto,
  BulkOperationResponseDto,
  UserStatsDto,
} from '../dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Transform user document to response DTO
   */
  private toResponseDto(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get paginated list of users with filters
   */
  async findAll(query: UsersQueryDto): Promise<UsersListResponseDto> {
    const { search, role, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const { users, total } = await this.usersRepository.findWithFilters({
      search,
      role,
      isActive,
      skip: (page - 1) * limit,
      limit,
      sortBy,
      sortOrder,
    });

    return {
      users: users.map((user) => this.toResponseDto(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponseDto(user);
  }

  /**
   * Create new user
   */
  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const exists = await this.usersRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
    
    const user = await this.usersRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isActive: dto.isActive ?? true,
    });

    this.logger.log(`Created user: ${user.email} with role ${user.role}`);
    return this.toResponseDto(user);
  }

  /**
   * Update user
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if changing email
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.usersRepository.existsByEmail(dto.email);
      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const user = await this.usersRepository.updateById(id, dto);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Updated user: ${user.email}`);
    return this.toResponseDto(user);
  }

  /**
   * Change user password
   */
  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.usersRepository.updateById(id, { passwordHash });

    this.logger.log(`Password changed for user: ${existingUser.email}`);
    return { message: 'Password updated successfully' };
  }

  /**
   * Delete user (soft delete by deactivation)
   */
  async delete(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.deactivate(id);
    this.logger.log(`Deactivated user: ${user.email}`);
    return { message: 'User deactivated successfully' };
  }

  /**
   * Hard delete user (permanent)
   */
  async hardDelete(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.deleteById(id);
    this.logger.log(`Permanently deleted user: ${user.email}`);
    return { message: 'User permanently deleted' };
  }

  /**
   * Activate user
   */
  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.activate(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.logger.log(`Activated user: ${user.email}`);
    return this.toResponseDto(user);
  }

  /**
   * Deactivate user
   */
  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.deactivate(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.logger.log(`Deactivated user: ${user.email}`);
    return this.toResponseDto(user);
  }

  // ========================
  // BULK OPERATIONS
  // ========================

  /**
   * Bulk update user status
   */
  async bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<BulkOperationResponseDto> {
    const result = await this.usersRepository.bulkUpdateStatus(userIds, isActive);
    this.logger.log(`Bulk status update: ${result.modifiedCount} users ${isActive ? 'activated' : 'deactivated'}`);
    return {
      success: true,
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} users ${isActive ? 'activated' : 'deactivated'}`,
    };
  }

  /**
   * Bulk update user role
   */
  async bulkUpdateRole(userIds: string[], role: UserRole): Promise<BulkOperationResponseDto> {
    const result = await this.usersRepository.bulkUpdateRole(userIds, role);
    this.logger.log(`Bulk role update: ${result.modifiedCount} users changed to ${role}`);
    return {
      success: true,
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} users updated to role ${role}`,
    };
  }

  /**
   * Bulk delete users (soft delete)
   */
  async bulkDelete(userIds: string[]): Promise<BulkOperationResponseDto> {
    const result = await this.usersRepository.bulkUpdateStatus(userIds, false);
    this.logger.log(`Bulk delete: ${result.modifiedCount} users deactivated`);
    return {
      success: true,
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} users deactivated`,
    };
  }

  /**
   * Bulk hard delete users (permanent)
   */
  async bulkHardDelete(userIds: string[]): Promise<BulkOperationResponseDto> {
    const result = await this.usersRepository.bulkDelete(userIds);
    this.logger.log(`Bulk hard delete: ${result.deletedCount} users permanently deleted`);
    return {
      success: true,
      modifiedCount: result.deletedCount,
      message: `${result.deletedCount} users permanently deleted`,
    };
  }

  // ========================
  // STATISTICS
  // ========================

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStatsDto> {
    return this.usersRepository.getStats();
  }
}
