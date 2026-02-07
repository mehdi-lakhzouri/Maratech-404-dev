'use client';

/**
 * Auth Hooks
 * ----------
 * TanStack Query hooks for authentication.
 * These hooks manage auth state and provide optimistic updates.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getCurrentUser,
  verifyOtp as verifyOtpApi,
  resendOtp as resendOtpApi,
} from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import type { LoginRequest, RegisterRequest, User, VerifyOtpRequest, ResendOtpRequest } from '@/lib/api/types';

/**
 * Query keys for auth-related queries
 */
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Hook to get current user
 * Returns undefined while loading, null if not authenticated
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for login
 * Logs in user and redirects to dashboard
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: (response) => {
      // Update the user query cache
      queryClient.setQueryData(authKeys.user(), response.user);
      // Navigate to dashboard
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      console.error('Login failed:', error.message);
    },
  });
}

/**
 * Hook for OTP verification and login completion
 */
export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => verifyOtpApi(data),
    onSuccess: (response) => {
      // Update the user query cache
      queryClient.setQueryData(authKeys.user(), response.user);
      // Navigate to dashboard
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      console.error('OTP verification failed:', error.message);
    },
  });
}

/**
 * Hook for resending OTP
 */
export function useResendOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpRequest) => resendOtpApi(data),
    onError: (error: ApiError) => {
      console.error('Resend OTP failed:', error.message);
    },
  });
}

/**
 * Hook for user registration
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => registerApi(data),
    onSuccess: (response) => {
      // Update the user query cache
      queryClient.setQueryData(authKeys.user(), response.user);
      // Navigate to dashboard
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      console.error('Registration failed:', error.message);
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      // Navigate to home
      router.push('/');
    },
    onError: () => {
      // Even on error, clear local state and redirect
      queryClient.clear();
      router.push('/');
    },
  });
}

/**
 * Hook to check if user is authenticated
 * Useful for conditional rendering
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}

/**
 * Hook to check if user has specific roles
 */
export function useHasRole(...roles: User['role'][]) {
  const { data: user } = useCurrentUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Hook to get user-friendly error message from API errors
 */
export function useAuthErrorMessage() {
  return useCallback((error: ApiError | Error | null): string => {
    if (!error) return '';

    if (error instanceof ApiError) {
      switch (error.code) {
        case 'AUTH_INVALID_CREDENTIALS':
          return 'Email ou mot de passe incorrect';
        case 'AUTH_USER_DISABLED':
          return 'Votre compte a été désactivé. Contactez un administrateur.';
        case 'AUTH_OTP_INVALID':
          return 'Code de vérification incorrect';
        case 'AUTH_OTP_EXPIRED':
          return 'Le code a expiré. Veuillez demander un nouveau code.';
        case 'AUTH_OTP_MAX_ATTEMPTS':
          return 'Trop de tentatives. Veuillez demander un nouveau code.';
        case 'USER_ALREADY_EXISTS':
          return 'Un compte existe déjà avec cet email';
        case 'VALIDATION_FAILED':
          return 'Veuillez vérifier les informations saisies';
        case 'NETWORK_ERROR':
          return 'Erreur de connexion. Vérifiez votre connexion internet.';
        default:
          return error.message || 'Une erreur est survenue';
      }
    }

    return error.message || 'Une erreur est survenue';
  }, []);
}
