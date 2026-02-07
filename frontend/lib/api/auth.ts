/**
 * Auth API Functions
 * ------------------
 * API functions for authentication endpoints.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type {
  User,
  LoginRequest,
  LoginInitResponse,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyOtpRequest,
  ResendOtpRequest,
  ResendOtpResponse,
} from './types';

/**
 * Parse fullName into firstName and lastName
 */
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * Transform user data to include firstName and lastName
 */
function transformUser(user: Omit<User, 'firstName' | 'lastName'>): User {
  const { firstName, lastName } = parseFullName(user.fullName);
  return { ...user, firstName, lastName };
}

/**
 * Login - Login with email and password
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, data);
  return {
    ...response,
    user: transformUser(response.user),
  };
}

/**
 * Verify OTP and complete login
 */
export async function verifyOtp(data: VerifyOtpRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.auth.verifyOtp, data);
  return {
    ...response,
    user: transformUser(response.user),
  };
}

/**
 * Resend OTP code
 */
export async function resendOtp(data: ResendOtpRequest): Promise<ResendOtpResponse> {
  return apiClient.post<ResendOtpResponse>(API_ENDPOINTS.auth.resendOtp, data);
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(API_ENDPOINTS.auth.register, data);
  return {
    ...response,
    user: transformUser(response.user),
  };
}

/**
 * Logout current user
 */
export async function logout(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(API_ENDPOINTS.auth.logout);
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(API_ENDPOINTS.auth.refresh);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const user = await apiClient.get<User>(API_ENDPOINTS.auth.me);
  return transformUser(user);
}
