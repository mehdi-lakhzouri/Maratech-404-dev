'use client';

/**
 * Action Item Detail Sheet
 * ------------------------
 * Accessible side sheet showing full details of an action item.
 * 
 * Accessibility features:
 * - Focus management on open/close
 * - Keyboard navigation
 * - Screen reader content structure
 */

import {
  Calendar,
  User,
  Clock,
  CheckSquare,
  Pencil,
  Archive,
  RotateCcw,
  ExternalLink,
  Tag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ActionItemStatusSelect } from '@/components/action-items/action-item-status-select';
import {
  useArchiveActionItem,
  useRestoreActionItem,
} from '@/lib/hooks/use-action-items';
import type { ActionItem, ActionItemStatus, UserRole } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionItemDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionItem: ActionItem;
  userRole?: UserRole;
  currentUserId?: string;
  onEdit?: () => void;
}

// Status configuration
const STATUS_CONFIG: Record<
  ActionItemStatus,
  { label: string; className: string; description: string }
> = {
  TODO: {
    label: 'À faire',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    description: 'Cette tâche n\'a pas encore été commencée',
  },
  IN_PROGRESS: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Cette tâche est en cours de réalisation',
  },
  DONE: {
    label: 'Terminé',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    description: 'Cette tâche a été complétée',
  },
  CANCELED: {
    label: 'Annulé',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    description: 'Cette tâche a été annulée',
  },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function isOverdue(dueDate?: string, status?: ActionItemStatus): boolean {
  if (!dueDate) return false;
  if (status === 'DONE' || status === 'CANCELED') return false;
  return new Date(dueDate) < new Date();
}

export function ActionItemDetailSheet({
  open,
  onOpenChange,
  actionItem,
  userRole,
  currentUserId,
  onEdit,
}: ActionItemDetailSheetProps) {
  const archiveMutation = useArchiveActionItem();
  const restoreMutation = useRestoreActionItem();

  const statusConfig = STATUS_CONFIG[actionItem.status];
  const overdue = isOverdue(actionItem.dueDate, actionItem.status);

  // RBAC checks
  const canArchive = userRole === 'RESPONSABLE';
  const canEdit =
    userRole === 'RESPONSABLE' ||
    (userRole === 'CHEF_PROJET' && actionItem.createdBy?._id === currentUserId);
  const canChangeStatus =
    userRole === 'RESPONSABLE' ||
    (userRole === 'CHEF_PROJET' && actionItem.createdBy?._id === currentUserId) ||
    (userRole === 'CONSULTANT' && actionItem.assignedTo?._id === currentUserId);

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(actionItem._id);
      toast.success('Tâche archivée avec succès');
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'archivage");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(actionItem._id);
      toast.success('Tâche restaurée avec succès');
    } catch {
      toast.error('Erreur lors de la restauration');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-md overflow-y-auto"
        aria-describedby="action-item-detail-description"
      >
        <SheetHeader>
          <div className="flex items-start gap-3">
            <CheckSquare
              className={cn(
                'h-6 w-6 mt-0.5 shrink-0',
                actionItem.status === 'DONE' && 'text-green-600',
                actionItem.status === 'CANCELED' && 'text-red-400',
                actionItem.status === 'IN_PROGRESS' && 'text-blue-600',
                actionItem.status === 'TODO' && 'text-slate-400'
              )}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <SheetTitle
                className={cn(
                  'text-left',
                  (actionItem.status === 'DONE' || actionItem.status === 'CANCELED') &&
                    'line-through text-muted-foreground'
                )}
              >
                {actionItem.title}
              </SheetTitle>
              <SheetDescription id="action-item-detail-description" className="text-left mt-1">
                {statusConfig.description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <section aria-labelledby="status-heading">
            <h3 id="status-heading" className="text-sm font-medium mb-3">
              Statut
            </h3>
            {canChangeStatus && !actionItem.isArchived ? (
              <ActionItemStatusSelect
                itemId={actionItem._id}
                currentStatus={actionItem.status}
                userRole={userRole}
                isAssigned={actionItem.assignedTo?._id === currentUserId}
              />
            ) : (
              <Badge className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            )}
          </section>

          <Separator />

          {/* Description */}
          {actionItem.description && (
            <>
              <section aria-labelledby="description-heading">
                <h3 id="description-heading" className="text-sm font-medium mb-2">
                  Description
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {actionItem.description}
                </p>
              </section>
              <Separator />
            </>
          )}

          {/* Details Grid */}
          <section aria-labelledby="details-heading">
            <h3 id="details-heading" className="text-sm font-medium mb-3">
              Détails
            </h3>
            <dl className="space-y-3">
              {/* Assigned To */}
              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Assigné à:</span>
                </dt>
                <dd className="text-sm">
                  {actionItem.assignedTo?.fullName ?? 'Non assigné'}
                </dd>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Date d&apos;échéance:</span>
                </dt>
                <dd className={cn('text-sm', overdue && 'text-red-600 font-medium')}>
                  {actionItem.dueDate ? (
                    <>
                      {formatDate(actionItem.dueDate)}
                      {overdue && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          En retard
                        </span>
                      )}
                    </>
                  ) : (
                    'Non définie'
                  )}
                </dd>
              </div>

              {/* Created By */}
              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Créé par:</span>
                </dt>
                <dd className="text-sm">
                  {actionItem.createdBy?.fullName ?? '—'}
                </dd>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Date de création:</span>
                </dt>
                <dd className="text-sm text-muted-foreground">
                  Créé le {formatDateTime(actionItem.createdAt)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Trello Info */}
          {actionItem.trello?.cardUrl && (
            <>
              <Separator />
              <section aria-labelledby="trello-heading">
                <h3 id="trello-heading" className="text-sm font-medium mb-2">
                  Trello
                </h3>
                <a
                  href={actionItem.trello.cardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Voir sur Trello
                  <span className="sr-only">(ouvre dans un nouvel onglet)</span>
                </a>
              </section>
            </>
          )}

          {/* Archive Notice */}
          {actionItem.isArchived && (
            <>
              <Separator />
              <div
                className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
                role="status"
              >
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <Archive className="h-4 w-4 inline mr-2" aria-hidden="true" />
                  Cette tâche a été archivée
                  {actionItem.archivedAt && ` le ${formatDate(actionItem.archivedAt)}`}.
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {canEdit && !actionItem.isArchived && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Modifier
              </Button>
            )}

            {canArchive && (
              <>
                {actionItem.isArchived ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestore}
                    disabled={restoreMutation.isPending}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Restaurer
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchive}
                    disabled={archiveMutation.isPending}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Archive className="h-4 w-4" aria-hidden="true" />
                    Archiver
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
