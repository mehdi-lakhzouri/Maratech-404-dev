/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';

/**
 * Interceptor that logs request timing and completion
 */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(TimingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime
          this.logger.info({
            message: 'Request completed',
            method,
            url,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            statusCode: response.statusCode,
            durationMs: duration,
          });
        },
        error: () => {
          const duration = Date.now() - startTime;

          this.logger.error({
            message: 'Request failed',
            method,
            url,
            durationMs: duration,
          });
        },
      }),
    );
  }
}
