/**
 * API Response Types
 * ------------------
 * Standard API response envelope types matching the backend.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * User roles available in the system
 */
export type UserRole = 'RESPONSABLE' | 'CHEF_PROJET' | 'CONSULTANT';

/**
 * User data returned from API
 */
export interface User {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * OTP verification request payload
 */
export interface VerifyOtpRequest {
  email: string;
  otp: string;
  rememberMe?: boolean;
}

/**
 * Resend OTP request payload
 */
export interface ResendOtpRequest {
  email: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Login initiation response (OTP required)
 */
export interface LoginInitResponse {
  requiresOtp: true;
  email: string;
  expiresAt: string;
  message: string;
}

/**
 * Login response data (after OTP verification)
 */
export interface LoginResponse {
  user: User;
}

/**
 * Register response data
 */
export interface RegisterResponse {
  user: User;
  message: string;
}

/**
 * Resend OTP response data
 */
export interface ResendOtpResponse {
  email: string;
  expiresAt: string;
  message: string;
}

/**
 * Error codes from the API
 */
export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_DISABLED: 'AUTH_USER_DISABLED',
  AUTH_REFRESH_INVALID: 'AUTH_REFRESH_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_OTP_INVALID: 'AUTH_OTP_INVALID',
  AUTH_OTP_EXPIRED: 'AUTH_OTP_EXPIRED',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ========================
// USER MANAGEMENT TYPES
// ========================

/**
 * Extended user for management views
 */
export interface UserManagement extends User {
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User query parameters
 */
export interface UsersQueryParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated users response
 */
export interface UsersListResponse {
  users: UserManagement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Password change request
 */
export interface ChangePasswordRequest {
  newPassword: string;
}

/**
 * Bulk operation request
 */
export interface BulkUserIdsRequest {
  userIds: string[];
}

/**
 * Bulk status update request
 */
export interface BulkUpdateStatusRequest {
  userIds: string[];
  isActive: boolean;
}

/**
 * Bulk role update request
 */
export interface BulkUpdateRoleRequest {
  userIds: string[];
  role: UserRole;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success: boolean;
  modifiedCount: number;
  message: string;
}

/**
 * User statistics
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Record<UserRole, number>;
  recentSignups: number;
}
