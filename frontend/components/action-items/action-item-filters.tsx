'use client';

/**
 * Action Item Filters
 * -------------------
 * Accessible filter bar for action items list.
 * 
 * Accessibility features:
 * - Labeled form controls
 * - Keyboard accessible tabs/selects
 * - Screen reader announcements for filter changes
 */

import { useId } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ActionItemStatus } from '@/lib/api/types';

interface ActionItemFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ActionItemStatus | 'ALL';
  onStatusChange: (value: ActionItemStatus | 'ALL') => void;
  showArchived: boolean;
  onArchivedChange: (value: boolean) => void;
  assignedFilter: 'ALL' | 'ME' | string;
  onAssignedChange: (value: 'ALL' | 'ME' | string) => void;
  currentUserId?: string;
}

const STATUS_OPTIONS: { value: ActionItemStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'TODO', label: 'À faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Terminé' },
  { value: 'CANCELED', label: 'Annulé' },
];

export function ActionItemFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  showArchived,
  onArchivedChange,
  assignedFilter,
  onAssignedChange,
  currentUserId,
}: ActionItemFiltersProps) {
  const searchId = useId();
  const statusId = useId();
  const assignedId = useId();

  const hasActiveFilters =
    search ||
    statusFilter !== 'ALL' ||
    showArchived ||
    assignedFilter !== 'ALL';

  const clearFilters = () => {
    onSearchChange('');
    onStatusChange('ALL');
    onArchivedChange(false);
    onAssignedChange('ALL');
  };

  return (
    <div className="space-y-4" role="search" aria-label="Filtres des tâches">
      {/* Search Input */}
      <div className="relative">
        <Label htmlFor={searchId} className="sr-only">
          Rechercher une tâche
        </Label>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={searchId}
          type="search"
          placeholder="Rechercher une tâche..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Rechercher une tâche par titre ou description"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Archive Toggle */}
        <Tabs
          value={showArchived ? 'archived' : 'active'}
          onValueChange={(v) => onArchivedChange(v === 'archived')}
        >
          <TabsList className="bg-transparent p-0 gap-1" aria-label="Filtrer par état d'archivage">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Actives
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Archivées
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={statusId} className="text-xs text-muted-foreground">
            Statut
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusChange(value as ActionItemStatus | 'ALL')}
          >
            <SelectTrigger
              id={statusId}
              className="w-[160px] focus:ring-2 focus:ring-primary"
              aria-label="Filtrer par statut"
            >
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assigned Filter */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={assignedId} className="text-xs text-muted-foreground">
            Assignation
          </Label>
          <Select
            value={assignedFilter}
            onValueChange={onAssignedChange}
          >
            <SelectTrigger
              id={assignedId}
              className="w-[160px] focus:ring-2 focus:ring-primary"
              aria-label="Filtrer par assignation"
            >
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              {currentUserId && (
                <SelectItem value="ME">Mes tâches</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer tous les filtres"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Active Filters Summary for Screen Readers */}
      {hasActiveFilters && (
        <div className="sr-only" role="status" aria-live="polite">
          Filtres actifs:
          {search && ` Recherche: ${search}.`}
          {statusFilter !== 'ALL' &&
            ` Statut: ${STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}.`}
          {showArchived && ' Affichage des tâches archivées.'}
          {assignedFilter === 'ME' && ' Mes tâches uniquement.'}
        </div>
      )}
    </div>
  );
}
