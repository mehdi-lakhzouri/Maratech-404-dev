'use client';

/**
 * Document Hooks
 * --------------
 * TanStack Query hooks for document management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  getDocuments,
  getDocumentByPublicId,
  uploadDocument,
  archiveDocument,
  restoreDocument,
  downloadDocument,
  updateDocument,
  deleteDocument,
  getAllTags,
} from '@/lib/api/documents';
import type {
  DocumentsQueryParams,
  UploadDocumentRequest,
  UpdateDocumentRequest,
} from '@/lib/api/types';

/**
 * Query keys
 */
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params: DocumentsQueryParams) =>
    [...documentKeys.lists(), params] as const,
  detail: (publicId: string) =>
    [...documentKeys.all, 'detail', publicId] as const,
};

/**
 * Hook to list documents with filters
 */
export function useDocuments(params: DocumentsQueryParams = {}) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => getDocuments(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get a single document by publicId
 */
export function useDocument(publicId: string) {
  return useQuery({
    queryKey: documentKeys.detail(publicId),
    queryFn: () => getDocumentByPublicId(publicId),
    enabled: !!publicId,
  });
}

/**
 * Hook for uploading a document with progress tracking
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: UploadDocumentRequest;
      idempotencyKey?: string;
    }) => uploadDocument(data, idempotencyKey, setProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      setProgress(0);
    },
    onError: () => {
      setProgress(0);
    },
  });

  return { ...mutation, progress };
}

/**
 * Hook for archiving a document
 */
export function useArchiveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => archiveDocument(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Hook for restoring an archived document
 */
export function useRestoreDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => restoreDocument(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Hook for downloading a document
 */
export function useDownloadDocument() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(
    async (publicId: string, fileName: string) => {
      setIsDownloading(true);
      try {
        const blob = await downloadDocument(publicId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } finally {
        setIsDownloading(false);
      }
    },
    [],
  );

  return { download, isDownloading };
}

/**
 * Hook for updating document metadata
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: UpdateDocumentRequest;
    }) => updateDocument(publicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Hook for deleting a document permanently
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => deleteDocument(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Hook to get all distinct tags
 */
export function useTags() {
  return useQuery({
    queryKey: ['document-tags'],
    queryFn: () => getAllTags(),
    staleTime: 60_000,
  });
}
