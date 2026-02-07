import { registerAs } from '@nestjs/config';

export const envConfig = registerAs('env', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tili',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Cookie
  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
  cookieSecure: process.env.NODE_ENV === 'production',

  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Encryption key for sensitive data (e.g., integration tokens)
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32chars!!',

  // Trello integration
  trelloApiKey: process.env.TRELLO_API_KEY || '',
  trelloDefaultBoardId: process.env.TRELLO_DEFAULT_BOARD_ID || '',
  trelloDefaultListId: process.env.TRELLO_DEFAULT_LIST_ID || '',
}));

export type EnvConfig = ReturnType<typeof envConfig>;
