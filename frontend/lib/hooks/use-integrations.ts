'use client';

/**
 * Trello Integration Hooks
 * ------------------------
 * TanStack Query hooks for Trello integration.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTrelloStatus,
  connectTrello,
  disconnectTrello,
} from '@/lib/api/integrations';
import type { ConnectTrelloRequest } from '@/lib/api/types';

/**
 * Query keys for Trello integration
 */
export const trelloKeys = {
  all: ['trello'] as const,
  status: () => [...trelloKeys.all, 'status'] as const,
};

/**
 * Hook to get Trello connection status
 */
export function useTrelloStatus() {
  return useQuery({
    queryKey: trelloKeys.status(),
    queryFn: getTrelloStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to connect Trello
 */
export function useConnectTrello() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConnectTrelloRequest) => connectTrello(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trelloKeys.all });
    },
  });
}

/**
 * Hook to disconnect Trello
 */
export function useDisconnectTrello() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectTrello,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trelloKeys.all });
    },
  });
}
