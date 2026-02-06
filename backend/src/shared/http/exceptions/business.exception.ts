import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

/**
 * Base business exception class
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any,
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
          ...(details && { details }),
        },
      },
      status,
    );
  }
}

/**
 * Authentication exception
 */
export class AuthenticationException extends BusinessException {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * Authorization exception
 */
export class AuthorizationException extends BusinessException {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, HttpStatus.FORBIDDEN, details);
  }
}

/**
 * Not found exception
 */
export class NotFoundException extends BusinessException {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, HttpStatus.NOT_FOUND, details);
  }
}

/**
 * Conflict exception (e.g., duplicate resource)
 */
export class ConflictException extends BusinessException {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, HttpStatus.CONFLICT, details);
  }
}

/**
 * Validation exception
 */
export class ValidationException extends BusinessException {
  constructor(message: string, details?: any) {
    super('VALIDATION_FAILED', message, HttpStatus.BAD_REQUEST, details);
  }
}
