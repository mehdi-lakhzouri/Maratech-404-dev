import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('env.port') || 3001;
  const frontendUrl = configService.get<string>('env.frontendUrl') || 'http://localhost:3000';
  const isProduction = configService.get('env.nodeEnv') === 'production';

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Disable ETag generation to prevent 304 responses
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const expressApp = app.getHttpAdapter().getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  expressApp.set('etag', false);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: isProduction ? frontendUrl : [frontendUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-Id',
      'X-Idempotency-Key',
    ],
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Start server
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 TILI Backend running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Environment: ${configService.get('env.nodeEnv')}`);
}

bootstrap();
