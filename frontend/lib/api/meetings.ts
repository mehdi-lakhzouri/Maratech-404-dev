/**
 * Meetings API Functions
 * ----------------------
 * API functions for meeting management endpoints.
 */

import { API_ENDPOINTS } from './config';
import { apiClient } from './client';
import type {
  MeetingItem,
  MeetingDetail,
  MeetingsQueryParams,
  MeetingsListResponse,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  UpdateMinutesRequest,
  SaveDraftRequest,
  AttachDocumentRequest,
} from './types';

/**
 * Build query string from meeting params
 */
function buildMeetingsQueryString(params: MeetingsQueryParams): string {
  const sp = new URLSearchParams();

  if (params.projectId) sp.set('projectId', params.projectId);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.q) sp.set('q', params.q);
  if (params.archived !== undefined) sp.set('archived', String(params.archived));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.page) sp.set('page', String(params.page));
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * List meetings with filters
 */
export async function getMeetings(
  params: MeetingsQueryParams = {},
): Promise<MeetingsListResponse> {
  const qs = buildMeetingsQueryString(params);
  return apiClient.get<MeetingsListResponse>(
    `${API_ENDPOINTS.meetings.list}${qs}`,
  );
}

/**
 * Get meeting details + attached documents
 */
export async function getMeetingById(id: string): Promise<MeetingDetail> {
  return apiClient.get<MeetingDetail>(API_ENDPOINTS.meetings.byId(id));
}

/**
 * Create a new meeting
 */
export async function createMeeting(
  data: CreateMeetingRequest,
  idempotencyKey?: string,
): Promise<MeetingItem> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  return apiClient.post<MeetingItem>(API_ENDPOINTS.meetings.create, data, {
    headers,
  });
}

/**
 * Update a meeting
 */
export async function updateMeeting(
  id: string,
  data: UpdateMeetingRequest,
): Promise<MeetingItem> {
  return apiClient.patch<MeetingItem>(API_ENDPOINTS.meetings.update(id), data);
}

/**
 * Update meeting minutes (compte rendu)
 */
export async function updateMinutes(
  id: string,
  data: UpdateMinutesRequest,
): Promise<MeetingItem> {
  return apiClient.patch<MeetingItem>(API_ENDPOINTS.meetings.minutes(id), data);
}

/**
 * Auto-save draft notes
 */
export async function saveDraft(
  id: string,
  data: SaveDraftRequest,
): Promise<MeetingItem> {
  return apiClient.patch<MeetingItem>(API_ENDPOINTS.meetings.draft(id), data);
}

/**
 * Attach a document to a meeting
 */
export async function attachDocument(
  id: string,
  data: AttachDocumentRequest,
): Promise<{ attached: boolean }> {
  return apiClient.post<{ attached: boolean }>(
    API_ENDPOINTS.meetings.attachDocument(id),
    data,
  );
}

/**
 * Archive a meeting
 */
export async function archiveMeeting(id: string): Promise<MeetingItem> {
  return apiClient.post<MeetingItem>(API_ENDPOINTS.meetings.archive(id));
}

/**
 * Restore an archived meeting
 */
export async function restoreMeeting(id: string): Promise<MeetingItem> {
  return apiClient.post<MeetingItem>(API_ENDPOINTS.meetings.restore(id));
}
