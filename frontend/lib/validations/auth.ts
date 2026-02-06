/**
 * Validation Schemas
 * ------------------
 * Zod schemas for form validation.
 * French error messages for user experience.
 */

import { z } from 'zod';

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .min(1, 'L\'email est requis')
  .email('Format d\'email invalide');

/**
 * Password validation schema
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre'
  );

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * User roles available for self-registration
 * CHEF_PROJET can only be added by RESPONSABLE
 */
export const USER_ROLES = [
  { 
    value: 'RESPONSABLE', 
    label: 'Responsable',
    description: 'Gérer les projets et les équipes'
  },
  { 
    value: 'CONSULTANT', 
    label: 'Consultant',
    description: 'Contribuer aux projets assignés'
  },
] as const;

/**
 * Register form schema
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
    firstName: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
    lastName: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    role: z.enum(['RESPONSABLE', 'CONSULTANT'], {
      error: 'Veuillez sélectionner un rôle',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * OTP verification schema
 */
export const otpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .length(4, 'Le code OTP doit contenir 4 chiffres')
    .regex(/^\d{4}$/, 'Le code OTP ne doit contenir que des chiffres'),
});

export type OtpFormData = z.infer<typeof otpSchema>;
