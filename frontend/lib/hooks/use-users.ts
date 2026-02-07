'use client';

/**
 * Users Hooks
 * -----------
 * TanStack Query hooks for user management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserPassword,
  activateUser,
  deactivateUser,
  deleteUser,
  hardDeleteUser,
  bulkUpdateStatus,
  bulkUpdateRole,
  bulkDeleteUsers,
  bulkHardDeleteUsers,
  getUserStats,
} from '@/lib/api/users';
import type {
  UsersQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  BulkUpdateStatusRequest,
  BulkUpdateRoleRequest,
  BulkUserIdsRequest,
} from '@/lib/api/types';

/**
 * Query keys for users
 */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UsersQueryParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  stats: () => [...usersKeys.all, 'stats'] as const,
};

// ========================
// QUERY HOOKS
// ========================

/**
 * Get paginated users list
 */
export function useUsers(params: UsersQueryParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => getUsers(params),
    staleTime: 30 * 1000, // 30 seconds
    enabled: options?.enabled !== false, // Default to true
  });
}

/**
 * Get user by ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

/**
 * Get user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: usersKeys.stats(),
    queryFn: getUserStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ========================
// MUTATION HOOKS
// ========================

/**
 * Create new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

/**
 * Update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => 
      updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) });
    },
  });
}

/**
 * Change user password
 */
export function useChangeUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePasswordRequest }) =>
      changeUserPassword(id, data),
  });
}

/**
 * Activate user
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

/**
 * Deactivate user
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

/**
 * Delete user (soft delete)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

/**
 * Hard delete user
 */
export function useHardDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => hardDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

// ========================
// BULK MUTATION HOOKS
// ========================

/**
 * Bulk update user status
 */
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateStatusRequest) => bulkUpdateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

/**
 * Bulk update user role
 */
export function useBulkUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateRoleRequest) => bulkUpdateRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

/**
 * Bulk delete users (soft delete)
 */
export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUserIdsRequest) => bulkDeleteUsers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}

/**
 * Bulk hard delete users
 */
export function useBulkHardDeleteUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUserIdsRequest) => bulkHardDeleteUsers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.stats() });
    },
  });
}
