/**
 * Documents API Functions
 * -----------------------
 * API functions for document management endpoints.
 * Uses raw fetch for multipart uploads (not JSON).
 */

import { API_CONFIG, API_ENDPOINTS } from './config';
import { apiClient, ApiError } from './client';
import type {
  DocumentItem,
  DocumentsQueryParams,
  DocumentsListResponse,
  UploadDocumentRequest,
  UpdateDocumentRequest,
} from './types';

/**
 * Build query string from document params
 */
function buildDocQueryString(params: DocumentsQueryParams): string {
  const sp = new URLSearchParams();

  if (params.type) sp.set('type', params.type);
  if (params.q) sp.set('q', params.q);
  if (params.projectId) sp.set('projectId', params.projectId);
  if (params.meetingId) sp.set('meetingId', params.meetingId);
  if (params.uploadedBy) sp.set('uploadedBy', params.uploadedBy);
  if (params.archived !== undefined) sp.set('archived', String(params.archived));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.page) sp.set('page', String(params.page));
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * List documents with filters
 */
export async function getDocuments(
  params: DocumentsQueryParams = {},
): Promise<DocumentsListResponse> {
  const qs = buildDocQueryString(params);
  return apiClient.get<DocumentsListResponse>(
    `${API_ENDPOINTS.documents.list}${qs}`,
  );
}

/**
 * Get document by publicId
 */
export async function getDocumentByPublicId(
  publicId: string,
): Promise<DocumentItem> {
  return apiClient.get<DocumentItem>(
    API_ENDPOINTS.documents.byPublicId(publicId),
  );
}

/**
 * Upload a document (multipart/form-data)
 * Uses raw fetch because apiClient sets Content-Type: application/json
 */
export async function uploadDocument(
  data: UploadDocumentRequest,
  idempotencyKey?: string,
  onProgress?: (percent: number) => void,
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('type', data.type);
  if (data.description) formData.append('description', data.description);
  if (data.tags?.length) formData.append('tags', data.tags.join(','));
  if (data.projectId) formData.append('projectId', data.projectId);
  if (data.meetingId) formData.append('meetingId', data.meetingId);
  formData.append('file', data.file);

  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  // Use XMLHttpRequest for progress tracking
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_CONFIG.baseUrl}${API_ENDPOINTS.documents.upload}`);
      xhr.withCredentials = true;

      if (idempotencyKey) {
        xhr.setRequestHeader('X-Idempotency-Key', idempotencyKey);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res.success) {
            resolve(res.data as DocumentItem);
          } else {
            reject(
              new ApiError(
                res.error?.code || 'UPLOAD_ERROR',
                res.error?.message || 'Upload failed',
                xhr.status,
              ),
            );
          }
        } catch {
          reject(new ApiError('PARSE_ERROR', 'Failed to parse response', xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError('NETWORK_ERROR', 'Network request failed', 0));
      };

      xhr.send(formData);
    });
  }

  // Simple fetch for no-progress case
  const url = `${API_CONFIG.baseUrl}${API_ENDPOINTS.documents.upload}`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.code || 'UPLOAD_ERROR',
      json.error?.message || 'Upload failed',
      response.status,
    );
  }

  return json.data as DocumentItem;
}

/**
 * Download document – returns blob URL
 */
export async function downloadDocument(publicId: string): Promise<Blob> {
  const url = `${API_CONFIG.baseUrl}${API_ENDPOINTS.documents.download(publicId)}`;
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError('DOWNLOAD_ERROR', 'Download failed', response.status);
  }

  return response.blob();
}

/**
 * Archive a document
 */
export async function archiveDocument(publicId: string): Promise<DocumentItem> {
  return apiClient.post<DocumentItem>(
    API_ENDPOINTS.documents.archive(publicId),
  );
}

/**
 * Restore an archived document
 */
export async function restoreDocument(publicId: string): Promise<DocumentItem> {
  return apiClient.post<DocumentItem>(
    API_ENDPOINTS.documents.restore(publicId),
  );
}

/**
 * Update document metadata and optionally replace file
 */
export async function updateDocument(
  publicId: string,
  data: UpdateDocumentRequest,
): Promise<DocumentItem> {
  // If file is included, use FormData (multipart)
  if (data.file) {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.type) formData.append('type', data.type);
    if (data.description) formData.append('description', data.description);
    if (data.tags?.length) formData.append('tags', data.tags.join(','));
    formData.append('file', data.file);

    const url = `${API_CONFIG.baseUrl}${API_ENDPOINTS.documents.update(publicId)}`;
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.code || 'UPDATE_ERROR',
        json.error?.message || 'Update failed',
        response.status,
      );
    }

    return json.data as DocumentItem;
  }

  // Otherwise, use JSON body
  return apiClient.patch<DocumentItem>(
    API_ENDPOINTS.documents.update(publicId),
    data,
  );
}

/**
 * Delete a document permanently
 */
export async function deleteDocument(publicId: string): Promise<{ deleted: boolean; publicId: string }> {
  return apiClient.delete<{ deleted: boolean; publicId: string }>(
    API_ENDPOINTS.documents.delete(publicId),
  );
}

/**
 * Get all distinct tags
 */
export async function getAllTags(): Promise<string[]> {
  return apiClient.get<string[]>(API_ENDPOINTS.documents.tags);
}
