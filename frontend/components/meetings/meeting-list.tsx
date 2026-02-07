'use client';

/**
 * Meeting List
 * ------------
 * Table display of meetings with actions (view, archive/restore).
 */

import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  MoreVertical,
  Eye,
  Archive,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { MeetingItem, UserRole } from '@/lib/api/types';
import {
  useArchiveMeeting,
  useRestoreMeeting,
} from '@/lib/hooks/use-meetings';
import { toast } from 'sonner';

interface MeetingListProps {
  meetings: MeetingItem[];
  isLoading: boolean;
  userRole?: UserRole;
  currentUserId?: string;
  onCreate: () => void;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatTimeRange(startDate: string, endDate?: string): string {
  const startTime = formatTime(startDate);
  if (!endDate) return startTime;
  const endTime = formatTime(endDate);
  return `${startTime} - ${endTime}`;
}

function formatLocation(location?: string): string {
  if (!location) return '—';
  
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

function getParticipantCount(meeting: MeetingItem): number {
  return Array.isArray(meeting.participantIds) ? meeting.participantIds.length : 0;
}

export function MeetingList({
  meetings,
  isLoading,
  userRole,
  currentUserId,
  onCreate,
}: MeetingListProps) {
  const router = useRouter();
  const archiveMutation = useArchiveMeeting();
  const restoreMutation = useRestoreMeeting();

  const canManage = userRole === 'RESPONSABLE' || userRole === 'CHEF_PROJET';

  const canManageMeeting = (meeting: MeetingItem) => {
    if (userRole === 'RESPONSABLE') return true;
    if (userRole === 'CHEF_PROJET') {
      return getCreatorId(meeting) === currentUserId;
    }
    return false;
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast.success('Réunion archivée');
    } catch {
      toast.error("Erreur lors de l'archivage");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      toast.success('Réunion restaurée');
    } catch {
      toast.error('Erreur lors de la restauration');
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium mb-1">Aucune réunion</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Commencez par créer une nouvelle réunion.
        </p>
        {canManage && (
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nouvelle réunion
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="py-4 px-4">Sujet</TableHead>
          <TableHead className="py-4 px-4">Date</TableHead>
          <TableHead className="py-4 px-4">Heure</TableHead>
          <TableHead className="py-4 px-4">Lieu</TableHead>
          <TableHead className="py-4 px-4">Participants</TableHead>
          <TableHead className="py-4 px-4">Créé par</TableHead>
          <TableHead className="py-4 px-4">Statut</TableHead>
          <TableHead className="py-4 px-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meetings.map((meeting) => {
          const canAct = canManageMeeting(meeting);
          const isPast = new Date(meeting.scheduledAt) < new Date();

          return (
            <TableRow
              key={meeting._id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/meetings/${meeting._id}`)}
            >
              <TableCell className="py-4 px-4 font-medium max-w-[250px] truncate">
                {meeting.subject}
              </TableCell>
              <TableCell className="py-4 px-4 text-muted-foreground">
                {formatDate(meeting.scheduledAt)}
              </TableCell>
              <TableCell className="py-4 px-4 text-muted-foreground">
                {formatTimeRange(meeting.scheduledAt, meeting.endDate)}
              </TableCell>
              <TableCell className="py-4 px-4 text-muted-foreground">
                {meeting.location ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {formatLocation(meeting.location)}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="py-4 px-4">
                <Badge variant="secondary">
                  {getParticipantCount(meeting)} participant{getParticipantCount(meeting) !== 1 ? 's' : ''}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-4 text-muted-foreground">
                {getCreatorName(meeting)}
              </TableCell>
              <TableCell className="py-4 px-4">
                {meeting.isArchived ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Archivée
                  </Badge>
                ) : isPast ? (
                  <Badge variant="outline" className="text-gray-500 border-gray-300">
                    Passée
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                    À venir
                  </Badge>
                )}
              </TableCell>
              <TableCell className="py-4 px-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      onClick={() => router.push(`/meetings/${meeting._id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </DropdownMenuItem>

                    {canAct && !meeting.isArchived && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleArchive(meeting._id)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archiver
                        </DropdownMenuItem>
                      </>
                    )}

                    {canAct && meeting.isArchived && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRestore(meeting._id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
