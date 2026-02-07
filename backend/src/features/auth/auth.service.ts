import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../users/repositories/users.repository';
import { SessionsRepository } from './repositories/sessions.repository';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import {
  AuthUserResponseDto,
  LoginResponseDto,
  RegisterResponseDto,
} from './dto/auth-response.dto';
import { JwtPayload, AuthenticatedUser } from './strategies/jwt.strategy';
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
} from '../../shared/security/crypto.utils';
import {
  AuthenticationException,
  ConflictException,
} from '../../shared/http/exceptions/business.exception';
import { ErrorCodes } from '../../shared/http/exceptions/error-codes';

export interface CookieOptions {
  accessToken: string;
  refreshToken: string;
  accessMaxAge: number;
  refreshMaxAge: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  /**
   * Register a new user
   */
  async register(
    dto: RegisterDto,
    requestMetadata?: { ip?: string; userAgent?: string },
  ): Promise<{ response: RegisterResponseDto; cookies: CookieOptions }> {
    this.logger.info(
      { email: dto.email, role: dto.role },
      'Attempting user registration',
    );

    // Check if user already exists
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      this.logger.warn(
        { email: dto.email },
        'Registration failed: email already exists',
      );
      throw new ConflictException(
        ErrorCodes.USER_ALREADY_EXISTS,
        'A user with this email already exists',
      );
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password);

    // Create user
    const user = await this.usersRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isActive: true,
    });

    this.logger.info(
      { userId: user._id.toString(), email: user.email, role: user.role },
      'User registered successfully',
    );

    // Generate tokens and create session
    const cookies = await this.createSession(user._id, user.email, user.role, requestMetadata);

    const userResponse = new AuthUserResponseDto({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    return {
      response: new RegisterResponseDto(userResponse, 'Registration successful'),
      cookies,
    };
  }

  /**
   * Login - validate credentials and create session
   */
  async login(
    dto: LoginDto,
    requestMetadata?: { ip?: string; userAgent?: string },
  ): Promise<{ response: LoginResponseDto; cookies: CookieOptions }> {
    this.logger.info({ email: dto.email }, 'Login attempt');

    // Find user by email
    const user = await this.usersRepository.findByEmail(dto.email);
    
    if (!user) {
      this.logger.warn({ email: dto.email }, 'Login failed: user not found');
      throw new AuthenticationException(
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn({ userId: user._id.toString() }, 'Login failed: user disabled');
      throw new AuthenticationException(
        ErrorCodes.AUTH_USER_DISABLED,
        'Your account has been disabled. Please contact an administrator.',
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      this.logger.warn({ email: dto.email }, 'Login failed: invalid password');
      throw new AuthenticationException(
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    // Update last login
    await this.usersRepository.updateLastLogin(user._id);

    // Generate tokens and create session
    const cookies = await this.createSession(
      user._id,
      user.email,
      user.role,
      requestMetadata,
      dto.rememberMe,
    );

    this.logger.info({ userId: user._id.toString() }, 'Login successful');

    const userResponse = new AuthUserResponseDto({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    return {
      response: new LoginResponseDto(userResponse),
      cookies,
    };
  }

  /**
   * Logout user - revoke refresh token
   */
  async logout(refreshTokenHash?: string): Promise<void> {
    if (refreshTokenHash) {
      await this.sessionsRepository.revokeByTokenHash(refreshTokenHash);
      this.logger.info('Session revoked successfully');
    }
  }

  /**
   * Refresh access token
   */
  async refresh(
    refreshToken: string,
    requestMetadata?: { ip?: string; userAgent?: string },
  ): Promise<CookieOptions> {
    const refreshTokenHash = hashToken(refreshToken);
    
    // Find session
    const session = await this.sessionsRepository.findByTokenHash(refreshTokenHash);
    
    if (!session) {
      this.logger.warn('Refresh failed: session not found or expired');
      throw new AuthenticationException(
        ErrorCodes.AUTH_REFRESH_INVALID,
        'Invalid or expired refresh token',
      );
    }

    // Get user
    const user = await this.usersRepository.findByIdAndActive(session.userId);
    
    if (!user) {
      // Revoke the session since user is no longer valid
      await this.sessionsRepository.revokeById(session._id);
      this.logger.warn({ userId: session.userId.toString() }, 'Refresh failed: user not found or disabled');
      throw new AuthenticationException(
        ErrorCodes.AUTH_USER_DISABLED,
        'User not found or disabled',
      );
    }

    // Revoke old session and create new one (token rotation)
    await this.sessionsRepository.revokeById(session._id);
    
    // Create new session
    const cookies = await this.createSession(
      user._id,
      user.email,
      user.role,
      requestMetadata,
    );

    this.logger.info({ userId: user._id.toString() }, 'Token refresh successful');

    return cookies;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(user: AuthenticatedUser): Promise<AuthUserResponseDto> {
    return new AuthUserResponseDto({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  }

  /**
   * Create session and generate tokens
   */
  private async createSession(
    userId: Types.ObjectId,
    email: string,
    role: string,
    requestMetadata?: { ip?: string; userAgent?: string },
    rememberMe?: boolean,
  ): Promise<CookieOptions> {
    // Generate tokens
    const accessExpiresIn = this.configService.get<string>('env.jwtAccessExpiresIn') || '15m';
    const refreshExpiresIn = rememberMe 
      ? '30d' 
      : (this.configService.get<string>('env.jwtRefreshExpiresIn') || '7d');

    const payload: JwtPayload = {
      sub: userId.toString(),
      email,
      role: role as any,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiresIn } as JwtSignOptions);
    const refreshToken = generateSecureToken(48);
    const refreshTokenHash = hashToken(refreshToken);

    // Calculate expiration dates
    const accessMaxAge = this.parseExpiresIn(accessExpiresIn);
    const refreshMaxAge = this.parseExpiresIn(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + refreshMaxAge);

    // Create session in database
    await this.sessionsRepository.create({
      userId,
      refreshTokenHash,
      expiresAt,
      ip: requestMetadata?.ip,
      userAgent: requestMetadata?.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      accessMaxAge,
      refreshMaxAge,
    };
  }

  /**
   * Parse expires in string to milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 15 * 60 * 1000; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  /**
   * Hash a refresh token (for logout when we only have the raw token from cookie)
   */
  hashRefreshToken(token: string): string {
    return hashToken(token);
  }
}
