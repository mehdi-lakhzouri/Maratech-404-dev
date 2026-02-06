import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

/**
 * Global validation pipe options
 */
export const validationPipeOptions: ValidationPipeOptions = {
  // Transform payloads to be objects typed according to their DTO classes
  transform: true,
  
  // Enable type conversion for primitives (e.g., "1" -> 1 for numbers)
  transformOptions: {
    enableImplicitConversion: true,
  },
  
  // Automatically strip properties that do not have any decorators
  whitelist: true,
  
  // Throw an error if non-whitelisted properties are present
  forbidNonWhitelisted: true,
  
  // Validate nested objects
  validationError: {
    target: false,
    value: false,
  },
  
  // Stop validation of a property on the first error
  stopAtFirstError: false,
};

/**
 * Create a configured validation pipe instance
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe(validationPipeOptions);
}
