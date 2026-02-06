import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { createSuccessResponse } from '../../types/api-response.types';

export const SKIP_RESPONSE_TRANSFORM = 'skipResponseTransform';

/**
 * Decorator to skip response transformation for specific endpoints
 */
export const SkipResponseTransform = () =>
  (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(SKIP_RESPONSE_TRANSFORM, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(SKIP_RESPONSE_TRANSFORM, true, target);
    return target;
  };

/**
 * Interceptor that wraps successful responses in a standard envelope
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.get<boolean>(
      SKIP_RESPONSE_TRANSFORM,
      context.getHandler(),
    );

    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If the response already has the success property, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Extract meta if present
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return createSuccessResponse(data.data, data.meta);
        }

        return createSuccessResponse(data);
      }),
    );
  }
}
