/**
 * Action Items API Functions
 * --------------------------
 * API functions for action items management endpoints.
 */

import { API_ENDPOINTS } from './config';
import { apiClient } from './client';
import type {
  ActionItem,
  ActionItemsQueryParams,
  ActionItemsListResponse,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  UpdateActionStatusRequest,
} from './types';

/**
 * Build query string from action items params
 */
function buildActionItemsQueryString(params: ActionItemsQueryParams): string {
  const sp = new URLSearchParams();

  if (params.projectId) sp.set('projectId', params.projectId);
  if (params.meetingId) sp.set('meetingId', params.meetingId);
  if (params.assignedTo) sp.set('assignedTo', params.assignedTo);
  if (params.status) sp.set('status', params.status);
  if (params.q) sp.set('q', params.q);
  if (params.archived !== undefined) sp.set('archived', String(params.archived));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.page) sp.set('page', String(params.page));
  if (params.cursor) sp.set('cursor', params.cursor);
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * List action items with filters
 */
export async function getActionItems(
  params: ActionItemsQueryParams = {},
): Promise<ActionItemsListResponse> {
  const qs = buildActionItemsQueryString(params);
  return apiClient.get<ActionItemsListResponse>(
    `${API_ENDPOINTS.actionItems.list}${qs}`,
  );
}

/**
 * Get action item by ID
 */
export async function getActionItemById(id: string): Promise<ActionItem> {
  return apiClient.get<ActionItem>(API_ENDPOINTS.actionItems.byId(id));
}

/**
 * Create a new action item
 */
export async function createActionItem(
  data: CreateActionItemRequest,
  idempotencyKey?: string,
): Promise<ActionItem> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  return apiClient.post<ActionItem>(API_ENDPOINTS.actionItems.create, data, {
    headers,
  });
}

/**
 * Update an action item
 */
export async function updateActionItem(
  id: string,
  data: UpdateActionItemRequest,
): Promise<ActionItem> {
  return apiClient.patch<ActionItem>(API_ENDPOINTS.actionItems.update(id), data);
}

/**
 * Update action item status
 */
export async function updateActionItemStatus(
  id: string,
  data: UpdateActionStatusRequest,
): Promise<ActionItem> {
  return apiClient.patch<ActionItem>(API_ENDPOINTS.actionItems.status(id), data);
}

/**
 * Archive an action item
 */
export async function archiveActionItem(id: string): Promise<ActionItem> {
  return apiClient.post<ActionItem>(API_ENDPOINTS.actionItems.archive(id));
}

/**
 * Restore an archived action item
 */
export async function restoreActionItem(id: string): Promise<ActionItem> {
  return apiClient.post<ActionItem>(API_ENDPOINTS.actionItems.restore(id));
}

/**
 * Push action item to Trello (stub - not implemented yet)
 */
export async function pushActionItemToTrello(
  id: string,
  idempotencyKey?: string,
): Promise<{ message: string; status: string }> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  return apiClient.post<{ message: string; status: string }>(
    API_ENDPOINTS.actionItems.pushToTrello(id),
    {},
    { headers },
  );
}
