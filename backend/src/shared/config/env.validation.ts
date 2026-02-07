import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  
  // MongoDB
  MONGODB_URI: Joi.string().default('mongodb://localhost:27017/tili'),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('dev-jwt-secret-change-in-production'),
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // Cookie
  COOKIE_DOMAIN: Joi.string().default('localhost'),
  
  // Frontend URL
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  
  // Encryption
  ENCRYPTION_KEY: Joi.string().min(32).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('dev-encryption-key-32chars!!'),
  }),
});
