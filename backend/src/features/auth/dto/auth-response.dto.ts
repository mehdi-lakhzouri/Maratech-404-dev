import { UserRole } from '../../users/entities/user-role.enum';

/**
 * Response DTO for authenticated user
 */
export class AuthUserResponseDto {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;

  constructor(partial: Partial<AuthUserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for successful login
 */
export class LoginResponseDto {
  user: AuthUserResponseDto;

  constructor(user: AuthUserResponseDto) {
    this.user = user;
  }
}

/**
 * Response DTO for successful registration
 */
export class RegisterResponseDto {
  user: AuthUserResponseDto;
  message: string;

  constructor(
    user: AuthUserResponseDto,
    message: string = 'Registration successful',
  ) {
    this.user = user;
    this.message = message;
  }
}
