'use client';

/**
 * Action Item Status Select
 * -------------------------
 * Accessible dropdown for changing action item status.
 * Respects RBAC rules for CONSULTANT role.
 */

import { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpdateActionItemStatus } from '@/lib/hooks/use-action-items';
import type { ActionItemStatus, UserRole } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionItemStatusSelectProps {
  itemId: string;
  currentStatus: ActionItemStatus;
  userRole?: UserRole;
  isAssigned?: boolean;
}

// Status configuration
const STATUS_CONFIG: Record<
  ActionItemStatus,
  { label: string; className: string; icon: string }
> = {
  TODO: {
    label: 'À faire',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
    icon: '○',
  },
  IN_PROGRESS: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300',
    icon: '◐',
  },
  DONE: {
    label: 'Terminé',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300',
    icon: '●',
  },
  CANCELED: {
    label: 'Annulé',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300',
    icon: '✕',
  },
};

const ALL_STATUSES: ActionItemStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

// Consultant can only set these statuses when assigned
const CONSULTANT_ALLOWED_STATUSES: ActionItemStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export function ActionItemStatusSelect({
  itemId,
  currentStatus,
  userRole,
  isAssigned,
}: ActionItemStatusSelectProps) {
  const updateStatusMutation = useUpdateActionItemStatus();
  const [isOpen, setIsOpen] = useState(false);

  // Determine available statuses based on role
  const getAvailableStatuses = (): ActionItemStatus[] => {
    if (userRole === 'CONSULTANT' && isAssigned) {
      return CONSULTANT_ALLOWED_STATUSES;
    }
    return ALL_STATUSES;
  };

  const availableStatuses = getAvailableStatuses();
  const currentConfig = STATUS_CONFIG[currentStatus];

  const handleStatusChange = async (newStatus: ActionItemStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: itemId,
        data: { status: newStatus },
      });
      toast.success(`Statut mis à jour: ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
    setIsOpen(false);
  };

  const isPending = updateStatusMutation.isPending;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className={cn(
            'h-auto px-2 py-1 gap-1 font-medium border',
            currentConfig.className,
            'hover:opacity-80 focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          aria-label={`Statut actuel: ${currentConfig.label}. Cliquer pour changer`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">{currentConfig.icon}</span>
          )}
          <span>{currentConfig.label}</span>
          <ChevronDown className="h-3 w-3 ml-1" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-44"
        role="listbox"
        aria-label="Sélectionner un statut"
      >
        {availableStatuses.map((status) => {
          const config = STATUS_CONFIG[status];
          const isSelected = status === currentStatus;

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className={cn(
                'gap-2 cursor-pointer',
                isSelected && 'bg-accent'
              )}
              role="option"
              aria-selected={isSelected}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full text-xs border',
                  config.className
                )}
                aria-hidden="true"
              >
                {config.icon}
              </span>
              <span className="flex-1">{config.label}</span>
              {isSelected && (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}

        {userRole === 'CONSULTANT' && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1 pt-2">
            En tant que consultant, vous ne pouvez pas annuler une tâche.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
