import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodes } from '../exceptions/error-codes';
import { createErrorResponse } from '../../types/api-response.types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: ReturnType<typeof createErrorResponse>;

    if (exception instanceof BusinessException) {
      // Our custom business exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      errorResponse = exceptionResponse;
      
      // Log at appropriate level based on status
      if (status >= 500) {
        this.logger.error({
          message: 'Business exception',
          code: exception.code,
          details: exception.details,
          stack: exception.stack,
          path: request.url,
          method: request.method,
        });
      } else {
        this.logger.warn({
          message: 'Business exception',
          code: exception.code,
          details: exception.details,
          path: request.url,
          method: request.method,
        });
      }
    } else if (exception instanceof HttpException) {
      // Standard NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as any;
        
        // Handle class-validator errors
        if (resp.message && Array.isArray(resp.message)) {
          errorResponse = createErrorResponse(
            ErrorCodes.VALIDATION_FAILED,
            'Validation failed',
            resp.message,
          );
        } else {
          errorResponse = createErrorResponse(
            resp.error || 'HTTP_ERROR',
            resp.message || 'An error occurred',
            resp.details,
          );
        }
      } else {
        errorResponse = createErrorResponse(
          'HTTP_ERROR',
          String(exceptionResponse),
        );
      }
      
      this.logger.warn({
        message: 'HTTP exception',
        status,
        response: exceptionResponse,
        path: request.url,
        method: request.method,
      });
    } else if (exception instanceof Error) {
      // Unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        process.env.NODE_ENV === 'production'
          ? 'An internal error occurred'
          : exception.message,
      );
      
      this.logger.error({
        message: 'Unhandled exception',
        error: exception.message,
        stack: exception.stack,
        path: request.url,
        method: request.method,
      });
    } else {
      // Unknown error type
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred',
      );
      
      this.logger.error({
        message: 'Unknown exception type',
        exception,
        path: request.url,
        method: request.method,
      });
    }

    response.status(status).json(errorResponse);
  }
}
