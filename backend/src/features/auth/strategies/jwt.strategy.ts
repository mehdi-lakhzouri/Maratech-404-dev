import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Types } from 'mongoose';
import { UsersRepository } from '../../users/repositories/users.repository';
import { AuthenticationException } from '../../../shared/http/exceptions/business.exception';
import { ErrorCodes } from '../../../shared/http/exceptions/error-codes';
import { UserRole } from '../../users/entities/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  sub: string;
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
}

/**
 * Extract JWT from httpOnly cookie
 */
function extractJwtFromCookie(req: Request): string | null {
  if (req && req.cookies) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return req.cookies['access_token'] || null;
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('env.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const userId = payload.sub;
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new AuthenticationException(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Invalid token payload',
      );
    }

    const user = await this.usersRepository.findByIdAndActive(userId);
    
    if (!user) {
      throw new AuthenticationException(
        ErrorCodes.AUTH_USER_DISABLED,
        'User not found or disabled',
      );
    }

    return {
      sub: payload.sub,
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isActive: user.isActive,
    };
  }
}
