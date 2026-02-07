/**
 * Document Validation Schemas
 * ---------------------------
 * Zod schemas for document forms. French error messages.
 */

import { z } from 'zod';

export const DOCUMENT_TYPES = [
  { value: 'REPORT', label: 'Rapport' },
  { value: 'MEETING_MINUTES', label: 'Compte rendu' },
  { value: 'ADMIN', label: 'Administratif' },
  { value: 'PROJECT', label: 'Projet' },
] as const;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const uploadDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  type: z.enum(['REPORT', 'MEETING_MINUTES', 'ADMIN', 'PROJECT'], {
    error: 'Veuillez sélectionner un type',
  }),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  tags: z.array(z.string()).optional(),
  file: z
    .instanceof(File, { message: 'Veuillez sélectionner un fichier' })
    .refine((f) => f.size <= MAX_FILE_SIZE, 'Le fichier ne doit pas dépasser 10 Mo')
    .refine(
      (f) => ALLOWED_MIME_TYPES.includes(f.type),
      'Type de fichier non autorisé. Types acceptés : PDF, DOCX, XLSX, PNG, JPG',
    ),
});

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  type: z.enum(['REPORT', 'MEETING_MINUTES', 'ADMIN', 'PROJECT'], {
    error: 'Veuillez sélectionner un type',
  }),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateDocumentFormData = z.infer<typeof updateDocumentSchema>;
