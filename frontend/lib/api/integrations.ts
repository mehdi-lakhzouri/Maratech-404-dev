/**
 * Trello Integration API Functions
 * --------------------------------
 * API functions for Trello integration endpoints.
 */

import { API_ENDPOINTS } from './config';
import { apiClient } from './client';
import type { TrelloStatus, ConnectTrelloRequest } from './types';

/**
 * Get Trello connection status
 */
export async function getTrelloStatus(): Promise<TrelloStatus> {
  return apiClient.get<TrelloStatus>(API_ENDPOINTS.integrations.trello.status);
}

/**
 * Connect Trello account
 */
export async function connectTrello(
  data: ConnectTrelloRequest,
): Promise<TrelloStatus> {
  return apiClient.post<TrelloStatus>(
    API_ENDPOINTS.integrations.trello.connect,
    data,
  );
}

/**
 * Disconnect Trello account
 */
export async function disconnectTrello(): Promise<{ disconnected: boolean }> {
  return apiClient.delete<{ disconnected: boolean }>(
    API_ENDPOINTS.integrations.trello.disconnect,
  );
}
