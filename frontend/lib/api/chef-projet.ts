/**
 * Chef Projet API Functions
 * -------------------------
 * API functions for Chef de Projet specific endpoints.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type {
  UserManagement,
  UsersQueryParams,
  UsersListResponse,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserStats,
  CreateConsultantRequest,
  BulkCreateConsultantsRequest,
  BulkCreateResult,
} from './types';

/**
 * Build query string from params
 */
function buildQueryString(params: UsersQueryParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.search) searchParams.set('search', params.search);
  if (params.role) searchParams.set('role', params.role);
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ========================
// USERS - READ ONLY
// ========================

/**
 * Get paginated list of users (read-only for Chef Projet)
 */
export async function getUsers(params: UsersQueryParams = {}): Promise<UsersListResponse> {
  const queryString = buildQueryString(params);
  return apiClient.get<UsersListResponse>(`${API_ENDPOINTS.chefProjet.users}${queryString}`);
}

/**
 * Get user by ID (read-only)
 */
export async function getUserById(id: string): Promise<UserManagement> {
  return apiClient.get<UserManagement>(API_ENDPOINTS.chefProjet.userById(id));
}

/**
 * Get user statistics (read-only)
 */
export async function getUserStats(): Promise<UserStats> {
  return apiClient.get<UserStats>(API_ENDPOINTS.chefProjet.usersStats);
}

// ========================
// PROFILE - SELF EDIT
// ========================

/**
 * Get own profile
 */
export async function getProfile(): Promise<UserManagement> {
  return apiClient.get<UserManagement>(API_ENDPOINTS.chefProjet.profile);
}

/**
 * Update own profile
 */
export async function updateProfile(data: UpdateUserRequest): Promise<UserManagement> {
  return apiClient.put<UserManagement>(API_ENDPOINTS.chefProjet.profile, data);
}

/**
 * Change own password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>(API_ENDPOINTS.chefProjet.changePassword, data);
}

// ========================
// CONSULTANTS MANAGEMENT
// ========================

/**
 * Create a single consultant
 */
export async function createConsultant(data: CreateConsultantRequest): Promise<UserManagement> {
  return apiClient.post<UserManagement>(API_ENDPOINTS.chefProjet.consultants, data);
}

/**
 * Create multiple consultants in bulk
 */
export async function createConsultantsBulk(data: BulkCreateConsultantsRequest): Promise<BulkCreateResult> {
  return apiClient.post<BulkCreateResult>(API_ENDPOINTS.chefProjet.consultantsBulk, data);
}
