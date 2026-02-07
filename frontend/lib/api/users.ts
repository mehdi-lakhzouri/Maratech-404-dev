/**
 * Users API Functions
 * -------------------
 * API functions for user management endpoints.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type {
  UserManagement,
  UsersQueryParams,
  UsersListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  BulkUserIdsRequest,
  BulkUpdateStatusRequest,
  BulkUpdateRoleRequest,
  BulkOperationResponse,
  UserStats,
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
// CRUD OPERATIONS
// ========================

/**
 * Get paginated list of users with filters
 */
export async function getUsers(params: UsersQueryParams = {}): Promise<UsersListResponse> {
  const queryString = buildQueryString(params);
  return apiClient.get<UsersListResponse>(`${API_ENDPOINTS.users.list}${queryString}`);
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserManagement> {
  return apiClient.get<UserManagement>(API_ENDPOINTS.users.byId(id));
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserRequest): Promise<UserManagement> {
  return apiClient.post<UserManagement>(API_ENDPOINTS.users.create, data);
}

/**
 * Update user
 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<UserManagement> {
  return apiClient.put<UserManagement>(API_ENDPOINTS.users.update(id), data);
}

/**
 * Change user password
 */
export async function changeUserPassword(id: string, data: ChangePasswordRequest): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>(API_ENDPOINTS.users.changePassword(id), data);
}

/**
 * Activate user
 */
export async function activateUser(id: string): Promise<UserManagement> {
  return apiClient.patch<UserManagement>(API_ENDPOINTS.users.activate(id));
}

/**
 * Deactivate user
 */
export async function deactivateUser(id: string): Promise<UserManagement> {
  return apiClient.patch<UserManagement>(API_ENDPOINTS.users.deactivate(id));
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(id: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.users.delete(id));
}

/**
 * Permanently delete user
 */
export async function hardDeleteUser(id: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.users.hardDelete(id));
}

// ========================
// BULK OPERATIONS
// ========================

/**
 * Bulk update user status
 */
export async function bulkUpdateStatus(data: BulkUpdateStatusRequest): Promise<BulkOperationResponse> {
  return apiClient.post<BulkOperationResponse>(API_ENDPOINTS.users.bulkStatus, data);
}

/**
 * Bulk update user role
 */
export async function bulkUpdateRole(data: BulkUpdateRoleRequest): Promise<BulkOperationResponse> {
  return apiClient.post<BulkOperationResponse>(API_ENDPOINTS.users.bulkRole, data);
}

/**
 * Bulk delete users (soft delete)
 */
export async function bulkDeleteUsers(data: BulkUserIdsRequest): Promise<BulkOperationResponse> {
  return apiClient.post<BulkOperationResponse>(API_ENDPOINTS.users.bulkDelete, data);
}

/**
 * Bulk permanently delete users
 */
export async function bulkHardDeleteUsers(data: BulkUserIdsRequest): Promise<BulkOperationResponse> {
  return apiClient.post<BulkOperationResponse>(API_ENDPOINTS.users.bulkHardDelete, data);
}

// ========================
// STATISTICS
// ========================

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  return apiClient.get<UserStats>(API_ENDPOINTS.users.stats);
}
