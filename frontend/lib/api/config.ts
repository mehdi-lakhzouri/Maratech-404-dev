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
  chefProjet: {
    users: '/chef-projet/users',
    userById: (id: string) => `/chef-projet/users/${id}`,
    usersStats: '/chef-projet/users/stats',
    profile: '/chef-projet/profile',
    changePassword: '/chef-projet/profile/password',
    consultants: '/chef-projet/consultants',
    consultantsBulk: '/chef-projet/consultants/bulk',
  },
  documents: {
    list: '/documents',
    upload: '/documents',
    byPublicId: (publicId: string) => `/documents/${publicId}`,
    update: (publicId: string) => `/documents/${publicId}`,
    delete: (publicId: string) => `/documents/${publicId}`,
    download: (publicId: string) => `/documents/${publicId}/download`,
    archive: (publicId: string) => `/documents/${publicId}/archive`,
    restore: (publicId: string) => `/documents/${publicId}/restore`,
    tags: '/documents/tags/all',
  },
  meetings: {
    list: '/meetings',
    create: '/meetings',
    byId: (id: string) => `/meetings/${id}`,
    update: (id: string) => `/meetings/${id}`,
    minutes: (id: string) => `/meetings/${id}/minutes`,
    draft: (id: string) => `/meetings/${id}/draft`,
    attachDocument: (id: string) => `/meetings/${id}/attach-document`,
    archive: (id: string) => `/meetings/${id}/archive`,
    restore: (id: string) => `/meetings/${id}/restore`,
  },
  actionItems: {
    list: '/action-items',
    create: '/action-items',
    byId: (id: string) => `/action-items/${id}`,
    update: (id: string) => `/action-items/${id}`,
    status: (id: string) => `/action-items/${id}/status`,
    archive: (id: string) => `/action-items/${id}/archive`,
    restore: (id: string) => `/action-items/${id}/restore`,
    pushToTrello: (id: string) => `/action-items/${id}/push-to-trello`,
  },
  integrations: {
    trello: {
      status: '/integrations/trello/status',
      connect: '/integrations/trello/connect',
      disconnect: '/integrations/trello/disconnect',
    },
  },
} as const;
