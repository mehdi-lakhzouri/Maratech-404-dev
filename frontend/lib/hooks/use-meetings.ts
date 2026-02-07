'use client';

/**
 * Meeting Hooks
 * -------------
 * TanStack Query hooks for meeting management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  updateMinutes,
  saveDraft,
  attachDocument,
  archiveMeeting,
  restoreMeeting,
} from '@/lib/api/meetings';
import type {
  MeetingsQueryParams,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  UpdateMinutesRequest,
  SaveDraftRequest,
  AttachDocumentRequest,
} from '@/lib/api/types';

/**
 * Query keys
 */
export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (params: MeetingsQueryParams) =>
    [...meetingKeys.lists(), params] as const,
  detail: (id: string) => [...meetingKeys.all, 'detail', id] as const,
};

/**
 * Hook to list meetings with filters
 */
export function useMeetings(params: MeetingsQueryParams = {}) {
  return useQuery({
    queryKey: meetingKeys.list(params),
    queryFn: () => getMeetings(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get a single meeting by ID
 */
export function useMeeting(id: string) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => getMeetingById(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating a meeting
 */
export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: CreateMeetingRequest;
      idempotencyKey?: string;
    }) => createMeeting(data, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}

/**
 * Hook for updating a meeting
 */
export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMeetingRequest }) =>
      updateMeeting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}

/**
 * Hook for updating meeting minutes
 */
export function useUpdateMinutes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMinutesRequest }) =>
      updateMinutes(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: meetingKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook for saving draft notes (lightweight, no full invalidation)
 */
export function useSaveDraft() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveDraftRequest }) =>
      saveDraft(id, data),
  });
}

/**
 * Hook for attaching a document to a meeting
 */
export function useAttachDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      meetingId,
      data,
    }: {
      meetingId: string;
      data: AttachDocumentRequest;
    }) => attachDocument(meetingId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: meetingKeys.detail(variables.meetingId),
      });
    },
  });
}

/**
 * Hook for archiving a meeting
 */
export function useArchiveMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}

/**
 * Hook for restoring a meeting
 */
export function useRestoreMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}
