'use client';

/**
 * Chef Projet Hooks
 * -----------------
 * TanStack Query hooks for Chef de Projet functionality.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  getUserById,
  getUserStats,
  getProfile,
  updateProfile,
  changePassword,
  createConsultant,
  createConsultantsBulk,
} from '@/lib/api/chef-projet';
import type {
  UsersQueryParams,
  UpdateUserRequest,
  ChangePasswordRequest,
  CreateConsultantRequest,
  BulkCreateConsultantsRequest,
} from '@/lib/api/types';

/**
 * Query keys for chef projet
 */
export const chefProjetKeys = {
  all: ['chef-projet'] as const,
  users: () => [...chefProjetKeys.all, 'users'] as const,
  usersList: (params: UsersQueryParams) => [...chefProjetKeys.users(), 'list', params] as const,
  userDetail: (id: string) => [...chefProjetKeys.users(), 'detail', id] as const,
  usersStats: () => [...chefProjetKeys.users(), 'stats'] as const,
  profile: () => [...chefProjetKeys.all, 'profile'] as const,
};

// ========================
// USERS HOOKS (READ-ONLY)
// ========================

/**
 * Hook to list users (read-only)
 */
export function useChefProjetUsers(params: UsersQueryParams = {}) {
  return useQuery({
    queryKey: chefProjetKeys.usersList(params),
    queryFn: () => getUsers(params),
  });
}

/**
 * Hook to get user by ID (read-only)
 */
export function useChefProjetUser(id: string) {
  return useQuery({
    queryKey: chefProjetKeys.userDetail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get user statistics (read-only)
 */
export function useChefProjetUserStats() {
  return useQuery({
    queryKey: chefProjetKeys.usersStats(),
    queryFn: () => getUserStats(),
  });
}

// ========================
// PROFILE HOOKS
// ========================

/**
 * Hook to get own profile
 */
export function useChefProjetProfile() {
  return useQuery({
    queryKey: chefProjetKeys.profile(),
    queryFn: () => getProfile(),
  });
}

/**
 * Hook to update own profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chefProjetKeys.profile() });
    },
  });
}

/**
 * Hook to change own password
 */
export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  });
}

// ========================
// CONSULTANTS HOOKS
// ========================

/**
 * Hook to create a single consultant
 */
export function useCreateConsultant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateConsultantRequest) => createConsultant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chefProjetKeys.users() });
    },
  });
}

/**
 * Hook to create multiple consultants in bulk
 */
export function useCreateConsultantsBulk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkCreateConsultantsRequest) => createConsultantsBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chefProjetKeys.users() });
    },
  });
}
