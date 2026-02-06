/**
 * API Configuration
 * -----------------
 * Centralized API configuration for the TILI application.
 */

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
} as const;

/**
 * API Endpoints
 * -------------
 * All API endpoints in one place for easy maintenance.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    verifyOtp: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  users: {
    list: '/users',
    stats: '/users/stats',
    byId: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    hardDelete: (id: string) => `/users/${id}/permanent`,
    activate: (id: string) => `/users/${id}/activate`,
    deactivate: (id: string) => `/users/${id}/deactivate`,
    changePassword: (id: string) => `/users/${id}/password`,
    bulkStatus: '/users/bulk/status',
    bulkRole: '/users/bulk/role',
    bulkDelete: '/users/bulk/delete',
    bulkHardDelete: '/users/bulk/delete-permanent',
  },
} as const;
