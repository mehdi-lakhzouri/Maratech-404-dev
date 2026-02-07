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
 * Response DTO for login initiation (OTP required)
 */
export class LoginInitResponseDto {
  requiresOtp: true;
  email: string;
  expiresAt: Date;
  message: string;

  constructor(email: string, expiresAt: Date) {
    this.requiresOtp = true;
    this.email = email;
    this.expiresAt = expiresAt;
    this.message = 'OTP sent to your email. Please verify to complete login.';
  }
}

/**
 * Response DTO for successful login (after OTP verification)
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

/**
 * Response DTO for OTP resend
 */
export class ResendOtpResponseDto {
  email: string;
  expiresAt: Date;
  message: string;

  constructor(email: string, expiresAt: Date) {
    this.email = email;
    this.expiresAt = expiresAt;
    this.message = 'A new OTP has been sent to your email.';
  }
}
