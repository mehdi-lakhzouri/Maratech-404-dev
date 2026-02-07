/**
 * API Client
 * ----------
 * Fetch wrapper with credentials support for httpOnly cookie authentication.
 * All requests include credentials to send/receive cookies.
 */

import { API_CONFIG } from './config';
import type { ApiResponse, ApiErrorResponse } from './types';

/**
 * Custom API Error class for better error handling
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Request options type
 */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * API Client class
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { body, headers, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      credentials: 'include', // Important: Include cookies in requests
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        const errorData = data as ApiErrorResponse;
        throw new ApiError(
          errorData.error?.code || 'UNKNOWN_ERROR',
          errorData.error?.message || 'An unexpected error occurred',
          response.status,
          errorData.error?.details
        );
      }

      return (data as { success: true; data: T }).data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error or JSON parse error
      throw new ApiError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed',
        0
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient(API_CONFIG.baseUrl);
