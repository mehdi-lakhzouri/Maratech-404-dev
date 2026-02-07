'use client';

/**
 * Action Item List
 * ----------------
 * Accessible list display of action items with full CRUD actions.
 * 
 * Accessibility features:
 * - Keyboard navigation within table
 * - Status badges with accessible colors
 * - Screen reader support for actions
 * - Focus indicators
 */

import { useState, useRef, useCallback } from 'react';
import {
  CheckSquare,
  MoreVertical,
  Eye,
  Pencil,
  Archive,
  RotateCcw,
  Plus,
  Calendar,
  User,

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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { ActionItemDialog } from '@/components/action-items/action-item-dialog';
import { ActionItemStatusSelect } from '@/components/action-items/action-item-status-select';
import { ActionItemDetailSheet } from '@/components/action-items/action-item-detail-sheet';

import type { ActionItem, ActionItemStatus, UserRole } from '@/lib/api/types';
import {
  useArchiveActionItem,
  useRestoreActionItem,
} from '@/lib/hooks/use-action-items';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionItemListProps {
  actionItems: ActionItem[];
  isLoading: boolean;
  userRole?: UserRole;
  currentUserId?: string;
  onCreate: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Status display configuration with accessible colors
const STATUS_CONFIG: Record<
  ActionItemStatus,
  { label: string; className: string; description: string }
> = {
  TODO: {
    label: 'À faire',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
    description: 'Tâche non commencée',
  },
  IN_PROGRESS: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300',
    description: 'Tâche en cours de réalisation',
  },
  DONE: {
    label: 'Terminé',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300',
    description: 'Tâche terminée',
  },
  CANCELED: {
    label: 'Annulé',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300',
    description: 'Tâche annulée',
  },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getAssigneeName(item: ActionItem): string {
  if (!item.assignedTo) return 'Non assigné';
  if (typeof item.assignedTo === 'object' && item.assignedTo?.fullName) {
    return item.assignedTo.fullName;
  }
  return 'Assigné';
}

function getCreatorName(item: ActionItem): string {
  if (typeof item.createdBy === 'object' && item.createdBy?.fullName) {
    return item.createdBy.fullName;
  }
  return '—';
}

function getCreatorId(item: ActionItem): string {
  if (typeof item.createdBy === 'object' && item.createdBy?._id) {
    return item.createdBy._id;
  }
  return '';
}

function getAssigneeId(item: ActionItem): string | undefined {
  if (!item.assignedTo) return undefined;
  if (typeof item.assignedTo === 'object' && item.assignedTo?._id) {
    return item.assignedTo._id;
  }
  return undefined;
}

export function ActionItemList({
  actionItems,
  isLoading,
  userRole,
  currentUserId,
  onCreate,
  page,
  totalPages,
  onPageChange,
}: ActionItemListProps) {
  const archiveMutation = useArchiveActionItem();
  const restoreMutation = useRestoreActionItem();

  const [editItem, setEditItem] = useState<ActionItem | null>(null);
  const [detailItem, setDetailItem] = useState<ActionItem | null>(null);

  const tableRef = useRef<HTMLTableElement>(null);

  // RBAC checks
  const canManageAny = userRole === 'RESPONSABLE' || userRole === 'CHEF_PROJET';
  const canArchive = userRole === 'RESPONSABLE';

  const canManageItem = useCallback(
    (item: ActionItem) => {
      if (userRole === 'RESPONSABLE') return true;
      if (userRole === 'CHEF_PROJET') {
        return getCreatorId(item) === currentUserId;
      }
      return false;
    },
    [userRole, currentUserId]
  );

  const canChangeStatus = useCallback(
    (item: ActionItem) => {
      if (userRole === 'RESPONSABLE') return true;
      if (userRole === 'CHEF_PROJET') {
        return getCreatorId(item) === currentUserId;
      }
      if (userRole === 'CONSULTANT') {
        // Consultant can only change status if assigned to them
        return getAssigneeId(item) === currentUserId;
      }
      return false;
    },
    [userRole, currentUserId]
  );

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast.success('Tâche archivée avec succès');
    } catch {
      toast.error("Erreur lors de l'archivage de la tâche");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      toast.success('Tâche restaurée avec succès');
    } catch {
      toast.error('Erreur lors de la restauration de la tâche');
    }
  };

  // Keyboard navigation for table rows
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    item: ActionItem,
    index: number
  ) => {
    const rows = tableRef.current?.querySelectorAll('tbody tr');
    if (!rows) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        (rows[Math.min(index + 1, rows.length - 1)] as HTMLElement)?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        (rows[Math.max(index - 1, 0)] as HTMLElement)?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setDetailItem(item);
        break;
      case 'Home':
        event.preventDefault();
        (rows[0] as HTMLElement)?.focus();
        break;
      case 'End':
        event.preventDefault();
        (rows[rows.length - 1] as HTMLElement)?.focus();
        break;
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="space-y-3 p-4"
        role="status"
        aria-label="Chargement des tâches"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
        <span className="sr-only">Chargement en cours...</span>
      </div>
    );
  }

  // Empty state
  if (actionItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckSquare
          className="h-16 w-16 text-muted-foreground/40 mb-4"
          aria-hidden="true"
        />
        <h3 className="text-lg font-medium mb-1">Aucune tâche trouvée</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Commencez par créer une nouvelle tâche pour votre équipe.
        </p>
        {canManageAny && (
          <Button onClick={onCreate} aria-label="Créer une nouvelle tâche">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nouvelle tâche
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table ref={tableRef}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">
                <span className="sr-only">Indicateur de priorité</span>
                Tâche
              </TableHead>
              <TableHead className="w-[15%]">Statut</TableHead>
              <TableHead className="w-[15%]">Assigné à</TableHead>
              <TableHead className="w-[15%]">Échéance</TableHead>
              <TableHead className="w-[15%] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actionItems.map((item, index) => {
              const overdue = isOverdue(item.dueDate) && item.status !== 'DONE' && item.status !== 'CANCELED';
              const statusConfig = STATUS_CONFIG[item.status];

              return (
                <TableRow
                  key={item._id}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, item, index)}
                  onClick={() => setDetailItem(item)}
                  className={cn(
                    'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                    item.isArchived && 'opacity-60',
                    overdue && 'bg-red-50/50 dark:bg-red-950/20'
                  )}
                  aria-label={`Tâche: ${item.title}. Statut: ${statusConfig.label}. ${overdue ? 'En retard.' : ''}`}
                >
                  {/* Task Title & Description */}
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <CheckSquare
                        className={cn(
                          'h-5 w-5 mt-0.5 shrink-0',
                          item.status === 'DONE' && 'text-green-600',
                          item.status === 'CANCELED' && 'text-red-400',
                          item.status === 'IN_PROGRESS' && 'text-blue-600',
                          item.status === 'TODO' && 'text-slate-400'
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'font-medium truncate',
                            item.status === 'DONE' && 'line-through text-muted-foreground',
                            item.status === 'CANCELED' && 'line-through text-muted-foreground'
                          )}
                        >
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-75">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Créé par {getCreatorName(item)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Status with interactive select */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canChangeStatus(item) && !item.isArchived ? (
                      <ActionItemStatusSelect
                        itemId={item._id}
                        currentStatus={item.status}
                        userRole={userRole}
                        isAssigned={getAssigneeId(item) === currentUserId}
                      />
                    ) : (
                      <Badge
                        className={cn('border', statusConfig.className)}
                        aria-label={statusConfig.description}
                      >
                        {statusConfig.label}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Assignee */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm truncate">{getAssigneeName(item)}</span>
                    </div>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>
                    <div
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        overdue && 'text-red-600 dark:text-red-400 font-medium'
                      )}
                    >
                      {item.dueDate ? (
                        <>
                          <Calendar
                            className={cn('h-4 w-4', overdue ? 'text-red-500' : 'text-muted-foreground')}
                            aria-hidden="true"
                          />
                          <span>{formatDate(item.dueDate)}</span>
                          {overdue && (
                            <span className="sr-only">(En retard)</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions pour ${item.title}`}
                          aria-haspopup="menu"
                        >
                          <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => setDetailItem(item)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span>Voir les détails</span>
                        </DropdownMenuItem>

                        {canManageItem(item) && !item.isArchived && (
                          <DropdownMenuItem
                            onClick={() => setEditItem(item)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span>Modifier</span>
                          </DropdownMenuItem>
                        )}

                        {canArchive && (
                          <>
                            <DropdownMenuSeparator />
                            {item.isArchived ? (
                              <DropdownMenuItem
                                onClick={() => handleRestore(item._id)}
                                className="gap-2"
                              >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                <span>Restaurer</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleArchive(item._id)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Archive className="h-4 w-4" aria-hidden="true" />
                                <span>Archiver</span>
                              </DropdownMenuItem>
                            )}
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center py-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  aria-disabled={page === 1}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  aria-label="Page précédente"
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={page === pageNum}
                      aria-label={`Page ${pageNum}`}
                      aria-current={page === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {totalPages > 5 && page < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis aria-hidden="true" />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  aria-label="Page suivante"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Edit Dialog */}
      {editItem && (
        <ActionItemDialog
          open={!!editItem}
          onOpenChange={(open: boolean) => !open && setEditItem(null)}
          actionItem={editItem}
          onSuccess={() => setEditItem(null)}
        />
      )}

      {/* Detail Sheet */}
      {detailItem && (
        <ActionItemDetailSheet
          open={!!detailItem}
          onOpenChange={(open: boolean) => !open && setDetailItem(null)}
          actionItem={detailItem}
          userRole={userRole}
          currentUserId={currentUserId}
          onEdit={() => {
            setEditItem(detailItem);
            setDetailItem(null);
          }}
        />
      )}
    </>
  );
}
