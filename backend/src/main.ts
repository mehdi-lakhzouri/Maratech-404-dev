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
  
  // FIX 1: Read directly from .env (fallback to 3001)
  const port = configService.get('env.port') || process.env.PORT || 3001;
  
  const frontendUrl = configService.get('env.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
  const isProduction = configService.get('env.nodeEnv') === 'production';

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // FIX 2: Enhanced CORS configuration
  app.enableCors({
    origin: [
      frontendUrl,                // The config URL
      'http://localhost:3000',    // Standard localhost
      'http://127.0.0.1:3000'     // FIX: Explicit IPv4
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-Id',
      'X-Idempotency-Key',
      'Idempotency-Key', // 👈 THIS WAS MISSING! (Required for creation)
    ],
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // FIX 3: Bind to 0.0.0.0 to ensure IPv4 availability
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`🚀 TILI Backend running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();