'use client';

/**
 * Action Items Page
 * -----------------
 * Main action items (tasks) management page with full accessibility support.
 * 
 * Accessibility features:
 * - Keyboard navigation (Tab, Arrow keys, Enter, Space)
 * - Screen reader announcements
 * - Focus management
 * - ARIA live regions for dynamic updates
 * - High contrast support
 */

import { useState, useCallback, useMemo } from 'react';
import { Plus, CheckSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ActionItemFilters } from '@/components/action-items/action-item-filters';
import { ActionItemList } from '@/components/action-items/action-item-list';
import { ActionItemDialog } from '@/components/action-items/action-item-dialog';

import { useActionItems } from '@/lib/hooks/use-action-items';
import { useCurrentUser, useHasRole } from '@/lib/hooks/use-auth';
import type { ActionItemsQueryParams, ActionItemStatus } from '@/lib/api/types';

export default function ActionItemsPage() {
  const { data: user } = useCurrentUser();
  const canCreate = useHasRole('RESPONSABLE', 'CHEF_PROJET');

  // State
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ActionItemStatus | 'ALL'>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [assignedFilter, setAssignedFilter] = useState<'ALL' | 'ME' | string>('ALL');
  const [page, setPage] = useState(1);

  // Build query params
  const params: ActionItemsQueryParams = {
    q: search || undefined,
    archived: showArchived,
    page,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  if (statusFilter !== 'ALL') {
    params.status = statusFilter;
  }

  if (assignedFilter === 'ME' && user?.id) {
    params.assignedTo = user.id;
  } else if (assignedFilter !== 'ALL' && assignedFilter !== 'ME') {
    params.assignedTo = assignedFilter;
  }

  const { data, isLoading } = useActionItems(params);

  // Compute announcement for screen readers
  const announcement = useMemo(() => {
    if (!data || isLoading) return '';
    const count = data.meta?.total ?? 0;
    return `${count} tâche${count !== 1 ? 's' : ''} trouvée${count !== 1 ? 's' : ''}`;
  }, [data, isLoading]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: ActionItemStatus | 'ALL') => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleArchivedChange = useCallback((value: boolean) => {
    setShowArchived(value);
    setPage(1);
  }, []);

  const handleAssignedChange = useCallback((value: 'ALL' | 'ME' | string) => {
    setAssignedFilter(value);
    setPage(1);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#action-items-list"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Aller à la liste des tâches
      </a>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6" aria-hidden="true" />
            <span>Gestion des Tâches</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.meta?.total ?? 0} tâche{(data?.meta?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Button 
            onClick={() => setCreateOpen(true)}
            aria-label="Créer une nouvelle tâche"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nouvelle tâche
          </Button>
        )}
      </header>

      {/* Main content card */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Filters */}
        <div className="p-6 pb-4">
          <ActionItemFilters
            search={search}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            showArchived={showArchived}
            onArchivedChange={handleArchivedChange}
            assignedFilter={assignedFilter}
            onAssignedChange={handleAssignedChange}
            currentUserId={user?.id}
          />
        </div>

        {/* Action Items List */}
        <div id="action-items-list" tabIndex={-1}>
          <ActionItemList
            actionItems={data?.items ?? []}
            isLoading={isLoading}
            userRole={user?.role}
            currentUserId={user?.id}
            onCreate={() => setCreateOpen(true)}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Create Action Item Dialog */}
      <ActionItemDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
