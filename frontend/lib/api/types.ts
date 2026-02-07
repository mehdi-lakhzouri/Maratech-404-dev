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

// ========================
// DOCUMENT MANAGEMENT TYPES
// ========================

/**
 * Document type categories
 */
export type DocumentType = 'REPORT' | 'MEETING_MINUTES' | 'ADMIN' | 'PROJECT';

/**
 * Document entity returned from API
 */
export interface DocumentItem {
  _id: string;
  publicId: string;
  title: string;
  type: DocumentType;
  description?: string;
  tags: string[];
  projectId?: string;
  meetingId?: string;
  storageProvider: 'local' | 's3';
  storageKey: string;
  fileUrl?: string;
  originalFileName: string;
  safeFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadedBy: { _id: string; fullName: string; email: string } | string;
  uploadedAt: string;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document query parameters
 */
export interface DocumentsQueryParams {
  type?: DocumentType;
  q?: string;
  projectId?: string;
  meetingId?: string;
  uploadedBy?: string;
  archived?: boolean;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated documents response
 */
export interface DocumentsListResponse {
  documents: DocumentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Document upload request (form data fields)
 */
export interface UploadDocumentRequest {
  title: string;
  type: DocumentType;
  description?: string;
  tags?: string[];
  projectId?: string;
  meetingId?: string;
  file: File;
}

export interface UpdateDocumentRequest {
  title?: string;
  type?: DocumentType;
  description?: string;
  tags?: string[];
  file?: File;
}

// ========================
// CHEF PROJET TYPES
// ========================

export interface CreateConsultantRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface BulkCreateConsultantsRequest {
  consultants: CreateConsultantRequest[];
}

export interface BulkCreateResult {
  total: number;
  success: number;
  failed: number;
  created: UserManagement[];
  errors: Array<{ email: string; message: string }>;
}

// ========================
// MEETING MANAGEMENT TYPES
// ========================

/**
 * Meeting minutes sub-document
 */
export interface MeetingMinutes {
  content: string;
  format: 'plain' | 'markdown';
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Participant (populated User ref)
 */
export interface MeetingParticipant {
  _id: string;
  fullName: string;
  email: string;
}

/**
 * Meeting entity returned from API
 */
export interface MeetingItem {
  _id: string;
  subject: string;
  scheduledAt: string;
  endDate?: string;
  location?: string;
  meetingLink?: string;
  participantsText?: string;
  participantIds: MeetingParticipant[] | string[];
  projectId?: string;
  minutes?: MeetingMinutes;
  draftNotes?: string;
  draftUpdatedAt?: string;
  createdBy: { _id: string; fullName: string; email: string } | string;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Meeting with attached documents (from GET /meetings/:id)
 */
export interface MeetingDetail {
  meeting: MeetingItem;
  attachedDocuments: DocumentItem[];
}

/**
 * Meeting query parameters
 */
export interface MeetingsQueryParams {
  projectId?: string;
  from?: string;
  to?: string;
  q?: string;
  archived?: boolean;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated meetings response
 */
export interface MeetingsListResponse {
  meetings: MeetingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Create meeting request
 */
export interface CreateMeetingRequest {
  subject: string;
  scheduledAt: string;
  endDate?: string;
  location?: string;
  participantsText?: string;
  participantIds?: string[];
  projectId?: string;
}

/**
 * Update meeting request
 */
export interface UpdateMeetingRequest {
  subject?: string;
  scheduledAt?: string;
  endDate?: string;
  location?: string;
  participantsText?: string;
  participantIds?: string[];
  projectId?: string;
}

/**
 * Update minutes request
 */
export interface UpdateMinutesRequest {
  content: string;
  format?: 'plain' | 'markdown';
}

/**
 * Save draft notes request
 */
export interface SaveDraftRequest {
  draftNotes: string;
}

/**
 * Attach document to meeting request
 */
export interface AttachDocumentRequest {
  documentId: string;
}

// ========================
// ACTION ITEMS TYPES
// ========================

/**
 * Action item status values
 */
export type ActionItemStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';

/**
 * Action item source values
 */
export type ActionItemSource = 'MANUAL' | 'IMPORT';

/**
 * Trello sync status
 */
export type TrelloSyncStatus = 'NONE' | 'CREATED' | 'FAILED';

/**
 * Trello sync info
 */
export interface ActionItemTrello {
  cardId?: string;
  cardUrl?: string;
  boardId?: string;
  listId?: string;
  syncedAt?: string;
  syncStatus?: TrelloSyncStatus;
}

/**
 * Action item entity returned from API
 */
export interface ActionItem {
  _id: string;
  title: string;
  description?: string;
  status: ActionItemStatus;
  assignedTo?: { _id: string; fullName: string; email: string } | null;
  dueDate?: string;
  projectId?: string;
  meetingId?: string;
  createdBy: { _id: string; fullName: string; email: string };
  source: ActionItemSource;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  trello?: ActionItemTrello;
  createdAt: string;
  updatedAt: string;
}

/**
 * Action items query parameters
 */
export interface ActionItemsQueryParams {
  projectId?: string;
  meetingId?: string;
  assignedTo?: string;
  status?: ActionItemStatus;
  q?: string;
  archived?: boolean;
  limit?: number;
  page?: number;
  cursor?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated action items response
 */
export interface ActionItemsListResponse {
  items: ActionItem[];
  meta: {
    total: number;
    page?: number;
    limit: number;
    totalPages?: number;
    nextCursor?: string | null;
  };
}

/**
 * Create action item request
 */
export interface CreateActionItemRequest {
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  projectId?: string;
  meetingId?: string;
  source?: ActionItemSource;
}

/**
 * Update action item request
 */
export interface UpdateActionItemRequest {
  title?: string;
  description?: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
  meetingId?: string | null;
}

/**
 * Update action item status request
 */
export interface UpdateActionStatusRequest {
  status: ActionItemStatus;
}

// ========================
// TRELLO INTEGRATION TYPES
// ========================

/**
 * Trello connection status
 */
export interface TrelloStatus {
  connected: boolean;
  defaultBoardId?: string;
  defaultListId?: string;
  username?: string;
}

/**
 * Connect Trello request
 */
export interface ConnectTrelloRequest {
  token: string;
  defaultBoardId?: string;
  defaultListId?: string;
}

