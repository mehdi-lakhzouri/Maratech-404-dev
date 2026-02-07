import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

// Shared modules
import { envConfig, envValidationSchema } from './shared/config';
import { DatabaseModule } from './shared/db';
import { LoggerModule } from './shared/logger';
import { GlobalExceptionFilter } from './shared/http/filters';
import { ResponseTransformInterceptor } from './shared/http/interceptors';
import { createValidationPipe } from './shared/http/pipes';

// Feature modules
import { AuthModule } from './features/auth';
import { UsersModule } from './features/users/users.module';
import { DocumentsModule } from './features/documents/documents.module';
import { MeetingsModule } from './features/meetings/meetings.module';
import { ActionItemsModule } from './features/action-items/action-items.module';
import { TrelloModule } from './features/integrations/trello/trello.module';
import { JwtAuthGuard, RolesGuard } from './features/auth/guards';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [envConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),

    // Database
    DatabaseModule,

    // Logger
    LoggerModule,

    // Feature modules
    AuthModule,
    UsersModule,
    DocumentsModule,
    MeetingsModule,
    ActionItemsModule,
    TrelloModule,
  ],
  providers: [
    // Global validation pipe
    {
      provide: APP_PIPE,
      useFactory: () => createValidationPipe(),
    },

    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Global response transform interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },

    // Global JWT auth guard (applied to all routes, use @Public() to exclude)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
