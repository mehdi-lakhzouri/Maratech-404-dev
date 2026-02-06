import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';

export interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
  lastLoginAt?: Date;
}

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: CreateUserData): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByIdAndActive(
    id: string | Types.ObjectId,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, isActive: true }).exec();
  }

  async findAll(options?: {
    role?: UserRole;
    isActive?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<UserDocument[]> {
    const query: Record<string, any> = {};

    if (options?.role) {
      query.role = options.role;
    }
    if (options?.isActive !== undefined) {
      query.isActive = options.isActive;
    }

    return this.userModel
      .find(query)
      .skip(options?.skip || 0)
      .limit(options?.limit || 50)
      .sort({ createdAt: -1 })
      .exec();
  }

  async count(options?: {
    role?: UserRole;
    isActive?: boolean;
  }): Promise<number> {
    const query: Record<string, any> = {};

    if (options?.role) {
      query.role = options.role;
    }
    if (options?.isActive !== undefined) {
      query.isActive = options.isActive;
    }

    return this.userModel.countDocuments(query).exec();
  }

  async updateById(
    id: string | Types.ObjectId,
    data: UpdateUserData,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async updateLastLogin(id: string | Types.ObjectId): Promise<void> {
    await this.userModel
      .updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } })
      .exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userModel
      .countDocuments({ email: email.toLowerCase() })
      .exec();
    return count > 0;
  }

  async deactivate(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .exec();
  }

  async activate(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { isActive: true } }, { new: true })
      .exec();
  }

  // ========================
  // EXTENDED METHODS
  // ========================

  /**
   * Find users with advanced filters and pagination
   */
  async findWithFilters(options: {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: UserDocument[]; total: number }> {
    const query: Record<string, any> = {};

    // Text search on fullName and email
    if (options.search) {
      const searchRegex = new RegExp(options.search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
      ];
    }

    if (options.role) {
      query.role = options.role;
    }

    if (options.isActive !== undefined) {
      query.isActive = options.isActive;
    }

    const sortField = options.sortBy || 'createdAt';
    const sortDirection = options.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ [sortField]: sortDirection })
        .skip(options.skip || 0)
        .limit(options.limit || 10)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { users, total };
  }

  /**
   * Delete user by ID (hard delete)
   */
  async deleteById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  /**
   * Bulk update status for multiple users
   */
  async bulkUpdateStatus(
    userIds: string[],
    isActive: boolean,
  ): Promise<{ modifiedCount: number }> {
    const objectIds = userIds.map((id) => new Types.ObjectId(id));
    const result = await this.userModel
      .updateMany(
        { _id: { $in: objectIds } },
        { $set: { isActive } },
      )
      .exec();
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Bulk update role for multiple users
   */
  async bulkUpdateRole(
    userIds: string[],
    role: UserRole,
  ): Promise<{ modifiedCount: number }> {
    const objectIds = userIds.map((id) => new Types.ObjectId(id));
    const result = await this.userModel
      .updateMany(
        { _id: { $in: objectIds } },
        { $set: { role } },
      )
      .exec();
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Bulk delete users (hard delete)
   */
  async bulkDelete(userIds: string[]): Promise<{ deletedCount: number }> {
    const objectIds = userIds.map((id) => new Types.ObjectId(id));
    const result = await this.userModel
      .deleteMany({ _id: { $in: objectIds } })
      .exec();
    return { deletedCount: result.deletedCount };
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    byRole: Record<UserRole, number>;
    recentSignups: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleStats,
      recentSignups,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
      this.userModel.countDocuments({ isActive: false }).exec(),
      this.userModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }).exec(),
    ]);

    const byRole = {
      [UserRole.RESPONSABLE]: 0,
      [UserRole.CHEF_PROJET]: 0,
      [UserRole.CONSULTANT]: 0,
    };

    for (const stat of roleStats) {
      if (stat._id in byRole) {
        byRole[stat._id as UserRole] = stat.count;
      }
    }

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      byRole,
      recentSignups,
    };
  }
}
