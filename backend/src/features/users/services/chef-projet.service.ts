/**
 * Chef Projet Service
 * -------------------
 * Business logic for Chef de Projet specific operations.
 */

import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UserRole } from '../entities/user-role.enum';
import { hashPassword } from '@shared/security/crypto.utils';
import { CreateConsultantDto, UserResponseDto, BulkCreateResultDto } from '../dto/user.dto';
import { UserDocument } from '../entities/user.entity';

@Injectable()
export class ChefProjetService {
  private readonly logger = new Logger(ChefProjetService.name);

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
   * Create a single consultant
   */
  async createConsultant(dto: CreateConsultantDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(`L'email ${dto.email} est déjà utilisé`);
    }

    // Hash password
    const hashedPassword = await hashPassword(dto.password);

    // Create consultant with CONSULTANT role
    const user = await this.usersRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash: hashedPassword,
      role: UserRole.CONSULTANT,
      isActive: true,
    });

    this.logger.log(`Consultant created: ${user.email}`);
    return this.toResponseDto(user);
  }

  /**
   * Create multiple consultants in bulk
   */
  async createConsultantsBulk(consultants: CreateConsultantDto[]): Promise<BulkCreateResultDto> {
    const results: BulkCreateResultDto = {
      total: consultants.length,
      success: 0,
      failed: 0,
      created: [],
      errors: [],
    };

    for (const dto of consultants) {
      try {
        const user = await this.createConsultant(dto);
        results.success++;
        results.created.push(user);
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: dto.email,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    this.logger.log(
      `Bulk consultant creation: ${results.success} success, ${results.failed} failed`,
    );

    return results;
  }
}
