import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

interface PinoRequest {
  id?: string;
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
}

interface PinoResponse {
  statusCode?: number;
}

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('env.nodeEnv') === 'production';

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',

            // Generate correlation ID for request tracing
            genReqId: (req: Request) =>
              (req.headers['x-correlation-id'] as string) || randomUUID(),

            // Custom serializers
            serializers: {
              req: (req: PinoRequest) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                query: req.query,
                headers: {
                  'user-agent': req.headers?.['user-agent'],
                  'content-type': req.headers?.['content-type'],
                  'x-correlation-id': req.headers?.['x-correlation-id'],
                },
              }),
              res: (res: PinoResponse) => ({
                statusCode: res.statusCode,
              }),
            },

            // Redact sensitive fields
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.passwordHash',
              ],
              censor: '[REDACTED]',
            },

            // Custom log level based on status code
            customLogLevel: (_req: Request, res: Response, err?: Error) => {
              if (res.statusCode >= 500 || err) {
                return 'error';
              }
              if (res.statusCode >= 400) {
                return 'warn';
              }
              return 'info';
            },

            // Custom success message
            customSuccessMessage: (req: Request) => {
              return `${req.method} ${req.url} completed`;
            },

            // Custom error message
            customErrorMessage: (req: Request, _res: Response, err: Error) => {
              return `${req.method} ${req.url} failed: ${err.message}`;
            },

            // Pretty print in development
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
