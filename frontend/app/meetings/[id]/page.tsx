'use client';

/**
 * Meeting Detail Page
 * -------------------
 * Shows meeting details, minutes editor (compte rendu),
 * draft auto-save, and attached documents.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  FileText,
  Save,
  Loader2,
  Pencil,
  Paperclip,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeeting, useUpdateMinutes, useSaveDraft } from '@/lib/hooks/use-meetings';
import { useCurrentUser } from '@/lib/hooks/use-auth';
import type { MeetingItem, DocumentItem } from '@/lib/api/types';
import { toast } from 'sonner';

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatDateTimeRange(startDate: string, endDate?: string): string {
  const start = formatDateTime(startDate);
  if (!endDate) return start;
  
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  // If same day, just show date once with time range
  if (startDateObj.toDateString() === endDateObj.toDateString()) {
    const dateOnly = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(startDateObj);
    
    const startTime = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(startDateObj);
    
    const endTime = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(endDateObj);
    
    return `${dateOnly}, ${startTime} - ${endTime}`;
  }
  
  // Different days
  return `${start} - ${formatDateTime(endDate)}`;
}

function formatLocation(location?: string): string {
  if (!location) return 'Non spécifié';
  
  const locationMap: Record<string, string> = {
    'online': 'En ligne (Visio)',
    'presentiel': 'Présentiel',
    'hybrid': 'Hybride',
    'salle_a': 'Salle A',
    'salle_b': 'Salle B',
    'salle_c': 'Salle C',
    'other': 'Autre',
  };
  
  return locationMap[location] || location;
}

function formatRelative(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function getCreatorName(meeting: MeetingItem): string {
  if (typeof meeting.createdBy === 'object' && meeting.createdBy?.fullName) {
    return meeting.createdBy.fullName;
  }
  return '—';
}

function getCreatorId(meeting: MeetingItem): string {
  if (typeof meeting.createdBy === 'object' && meeting.createdBy?._id) {
    return meeting.createdBy._id;
  }
  return typeof meeting.createdBy === 'string' ? meeting.createdBy : '';
}

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const { data: user } = useCurrentUser();
  const { data, isLoading, error } = useMeeting(meetingId);
  const updateMinutesMutation = useUpdateMinutes();
  const saveDraftMutation = useSaveDraft();

  const meeting = data?.meeting;
  const attachedDocuments = data?.attachedDocuments || [];

  // Minutes editor state
  const [minutesContent, setMinutesContent] = useState('');
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);

  // Draft auto-save state
  const [draftContent, setDraftContent] = useState('');
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Initialize from meeting data
  useEffect(() => {
    if (meeting) {
      setMinutesContent(meeting.minutes?.content || '');
      setDraftContent(meeting.draftNotes || '');
    }
  }, [meeting]);

  // Can this user edit (RESPONSABLE or creator)?
  const canEdit =
    user?.role === 'RESPONSABLE' ||
    (user?.role === 'CHEF_PROJET' && meeting && getCreatorId(meeting) === user?.id);

  // Auto-save draft (debounced 2s)
  const handleDraftChange = useCallback(
    (value: string) => {
      setDraftContent(value);
      setDraftSaved(false);

      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }

      draftTimerRef.current = setTimeout(async () => {
        try {
          await saveDraftMutation.mutateAsync({
            id: meetingId,
            data: { draftNotes: value },
          });
          setDraftSaved(true);
        } catch {
          // silent – draft save is best-effort
        }
      }, 2000);
    },
    [meetingId, saveDraftMutation],
  );

  // Save minutes
  const handleSaveMinutes = async () => {
    try {
      await updateMinutesMutation.mutateAsync({
        id: meetingId,
        data: { content: minutesContent, format: 'plain' },
      });
      setIsEditingMinutes(false);
      toast.success('Compte rendu enregistré');
    } catch {
      toast.error("Erreur lors de l'enregistrement du compte rendu");
    }
  };

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/meetings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <p className="text-destructive">Réunion introuvable.</p>
      </div>
    );
  }

  const participantNames = Array.isArray(meeting.participantIds)
    ? meeting.participantIds
        .filter((p): p is { _id: string; fullName: string; email: string } => typeof p === 'object')
        .map((p) => p.fullName)
    : [];

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/meetings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{meeting.subject}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {formatDateTimeRange(meeting.scheduledAt, meeting.endDate)}
          </p>
        </div>
        {meeting.isArchived && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            Archivée
          </Badge>
        )}
      </div>

      {/* Meeting info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lieu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatLocation(meeting.location)}</p>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participantNames.length > 0 ? (
              <div className="space-y-1">
                {participantNames.map((name, i) => (
                  <p key={i} className="text-sm">{name}</p>
                ))}
              </div>
            ) : meeting.participantsText ? (
              <p className="text-sm whitespace-pre-line">{meeting.participantsText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun participant</p>
            )}
          </CardContent>
        </Card>

        {/* Created by */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Créé par :</span>{' '}
              {getCreatorName(meeting)}
            </p>
            <p>
              <span className="text-muted-foreground">Créé le :</span>{' '}
              {formatRelative(meeting.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Minutes (Compte rendu) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compte rendu
          </CardTitle>
          {canEdit && !isEditingMinutes && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingMinutes(true)}
            >
              <Pencil className="mr-2 h-3 w-3" />
              Modifier
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingMinutes ? (
            <div className="space-y-3">
              <Textarea
                value={minutesContent}
                onChange={(e) => setMinutesContent(e.target.value)}
                rows={10}
                placeholder="Rédigez le compte rendu de la réunion..."
                className="font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMinutesContent(meeting.minutes?.content || '');
                    setIsEditingMinutes(false);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveMinutes}
                  disabled={updateMinutesMutation.isPending}
                >
                  {updateMinutesMutation.isPending ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3 w-3" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : meeting.minutes?.content ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {meeting.minutes.content}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Aucun compte rendu rédigé.
            </p>
          )}
          {meeting.minutes?.updatedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Dernière mise à jour : {formatRelative(meeting.minutes.updatedAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Draft Notes (auto-save) */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Brouillon / Notes
              {draftSaved && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Enregistré
                </Badge>
              )}
              {saveDraftMutation.isPending && (
                <Loader2 className="h-3 w-3 animate-spin ml-2 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={draftContent}
              onChange={(e) => handleDraftChange(e.target.value)}
              rows={5}
              placeholder="Notes de travail (sauvegardé automatiquement)..."
              className="font-mono text-sm"
            />
            {meeting.draftUpdatedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Dernier brouillon : {formatRelative(meeting.draftUpdatedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attached Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Documents attachés
            <Badge variant="secondary" className="ml-2">
              {attachedDocuments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachedDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Aucun document attaché à cette réunion.
            </p>
          ) : (
            <div className="space-y-2">
              {attachedDocuments.map((doc: DocumentItem) => (
                <div
                  key={doc._id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/documents`)}
                >
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.originalFileName}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {doc.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
