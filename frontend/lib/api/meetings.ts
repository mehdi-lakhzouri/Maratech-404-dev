/**
 * Meetings API Client
 * -------------------
 * TanStack Query hooks for meetings endpoints with idempotency support
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface Meeting {
  _id: string;
  subject: string;
  scheduledAt: string;
  location?: string;
  participantsText?: string;
  participantIds?: string[];
  projectId?: string;
  minutes?: {
    content: string;
    format: "plain" | "markdown";
    updatedAt?: string;
    updatedBy?: string;
  };
  draftNotes?: string;
  draftUpdatedAt?: string;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  projectId?: {
    _id: string;
    name: string;
  };
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingDocument {
  _id: string;
  meetingId: string;
  documentId: {
    _id: string;
    title: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes: number;
  };
  attachedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  attachedAt: string;
}

const MEETINGS_QUERY_KEYS = {
  all: ["meetings"] as const,
  list: (filters?: any) =>
    [...MEETINGS_QUERY_KEYS.all, "list", filters] as const,
  detail: (id: string) => [...MEETINGS_QUERY_KEYS.all, "detail", id] as const,
  documents: (id: string) =>
    [...MEETINGS_QUERY_KEYS.all, "documents", id] as const,
};

// GET all meetings with filters
export function useGetMeetings(filters?: {
  projectId?: string;
  from?: string;
  to?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery<{ data: Meeting[]; total: number }, Error>({
    queryKey: MEETINGS_QUERY_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.projectId) params.append("projectId", filters.projectId);
      if (filters?.from) params.append("from", filters.from);
      if (filters?.to) params.append("to", filters.to);
      params.append("skip", String(filters?.skip ?? 0));
      params.append("limit", String(filters?.limit ?? 50));

      return apiClient.get(`/meetings?${params.toString()}`);
    },
  });
}

// GET single meeting
export function useGetMeeting(id: string) {
  return useQuery<Meeting, Error>({
    queryKey: MEETINGS_QUERY_KEYS.detail(id),
    queryFn: () => apiClient.get(`/meetings/${id}`),
    enabled: !!id,
  });
}

// CREATE meeting with idempotency
export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const idempotencyKey = `meeting-${Date.now()}-${Math.random()}`;
      return apiClient.post("/meetings", data, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
    },
    onSuccess: (newMeeting: Meeting) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.setQueryData(
        MEETINGS_QUERY_KEYS.detail(newMeeting._id),
        newMeeting,
      );
    },
  });
}

// UPDATE meeting
export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/meetings/${id}`, data),
    onSuccess: (updated: Meeting) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.list() });
      queryClient.setQueryData(
        MEETINGS_QUERY_KEYS.detail(updated._id),
        updated,
      );
    },
  });
}

// UPDATE meeting minutes
export function useUpdateMeetingMinutes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      format,
    }: {
      id: string;
      content: string;
      format: "plain" | "markdown";
    }) => apiClient.patch(`/meetings/${id}/minutes`, { content, format }),
    onSuccess: (updated: Meeting) => {
      queryClient.setQueryData(
        MEETINGS_QUERY_KEYS.detail(updated._id),
        updated,
      );
    },
  });
}

// UPDATE draft notes
export function useUpdateDraftNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      draftNotes,
    }: {
      id: string;
      draftNotes: string;
    }) => apiClient.patch(`/meetings/${id}/draft`, { draftNotes }),
    onSuccess: (updated: Meeting) => {
      queryClient.setQueryData(
        MEETINGS_QUERY_KEYS.detail(updated._id),
        updated,
      );
    },
  });
}

// GET attached documents
export function useGetMeetingDocuments(meetingId: string) {
  return useQuery<MeetingDocument[], Error>({
    queryKey: MEETINGS_QUERY_KEYS.documents(meetingId),
    queryFn: () => apiClient.get(`/meetings/${meetingId}/documents`),
    enabled: !!meetingId,
  });
}

// ATTACH document to meeting
export function useAttachDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetingId,
      documentId,
    }: {
      meetingId: string;
      documentId: string;
    }) =>
      apiClient.post(`/meetings/${meetingId}/attach-document`, { documentId }),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({
        queryKey: MEETINGS_QUERY_KEYS.documents(meetingId),
      });
    },
  });
}

// ARCHIVE meeting
export function useArchiveMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      apiClient.post(`/meetings/${id}/archive`, {}),
    onSuccess: (updated: Meeting) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.list() });
      queryClient.setQueryData(
        MEETINGS_QUERY_KEYS.detail(updated._id),
        updated,
      );
    },
  });
}

// RESTORE meeting
export function useRestoreMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      apiClient.post(`/meetings/${id}/restore`, {}),
    onSuccess: (updated: Meeting) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.list() });
      queryClient.setQueryData(
        MEETINGS_QUERY_KEYS.detail(updated._id),
        updated,
      );
    },
  });
}
