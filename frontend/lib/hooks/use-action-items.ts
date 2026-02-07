'use client';

/**
 * Action Items Hooks
 * ------------------
 * TanStack Query hooks for action items management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getActionItems,
  getActionItemById,
  createActionItem,
  updateActionItem,
  updateActionItemStatus,
  archiveActionItem,
  restoreActionItem,
} from '@/lib/api/action-items';
import type {
  ActionItemsQueryParams,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  UpdateActionStatusRequest,
} from '@/lib/api/types';

/**
 * Query keys for action items
 */
export const actionItemKeys = {
  all: ['actionItems'] as const,
  lists: () => [...actionItemKeys.all, 'list'] as const,
  list: (params: ActionItemsQueryParams) =>
    [...actionItemKeys.lists(), params] as const,
  detail: (id: string) => [...actionItemKeys.all, 'detail', id] as const,
};

/**
 * Hook to list action items with filters
 */
export function useActionItems(params: ActionItemsQueryParams = {}) {
  return useQuery({
    queryKey: actionItemKeys.list(params),
    queryFn: () => getActionItems(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get a single action item by ID
 */
export function useActionItem(id: string) {
  return useQuery({
    queryKey: actionItemKeys.detail(id),
    queryFn: () => getActionItemById(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating an action item
 */
export function useCreateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: CreateActionItemRequest;
      idempotencyKey?: string;
    }) => createActionItem(data, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all });
    },
  });
}

/**
 * Hook for updating an action item
 */
export function useUpdateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActionItemRequest }) =>
      updateActionItem(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all });
      queryClient.invalidateQueries({
        queryKey: actionItemKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook for updating action item status
 */
export function useUpdateActionItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateActionStatusRequest;
    }) => updateActionItemStatus(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all });
      queryClient.invalidateQueries({
        queryKey: actionItemKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook for archiving an action item
 */
export function useArchiveActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveActionItem(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all });
      queryClient.invalidateQueries({ queryKey: actionItemKeys.detail(id) });
    },
  });
}

/**
 * Hook for restoring an archived action item
 */
export function useRestoreActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreActionItem(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all });
      queryClient.invalidateQueries({ queryKey: actionItemKeys.detail(id) });
    },
  });
}
