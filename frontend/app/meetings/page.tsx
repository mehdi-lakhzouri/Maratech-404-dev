'use client';

/**
 * Meetings Page
 * -------------
 * Main meeting management page.
 */

import { useState, useCallback } from 'react';
import { Plus, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MeetingFilters } from '@/components/meetings/meeting-filters';
import { MeetingList } from '@/components/meetings/meeting-list';
import { CreateMeetingDialog } from '@/components/meetings/create-meeting-dialog';

import { useMeetings } from '@/lib/hooks/use-meetings';
import { useCurrentUser, useHasRole } from '@/lib/hooks/use-auth';
import type { MeetingsQueryParams } from '@/lib/api/types';

export default function MeetingsPage() {
  const { data: user } = useCurrentUser();
  const canCreate = useHasRole('RESPONSABLE', 'CHEF_PROJET');

  // State
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  const params: MeetingsQueryParams = {
    q: search || undefined,
    archived: showArchived,
    page,
    limit: 20,
    sortBy: 'scheduledAt',
    sortOrder: 'desc',
  };

  const { data, isLoading } = useMeetings(params);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleArchivedChange = useCallback((value: boolean) => {
    setShowArchived(value);
    setPage(1);
  }, []);

  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6" aria-hidden="true" />
            Gestion des Réunions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.meta?.total ?? 0} réunion{(data?.meta?.total ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nouvelle réunion
          </Button>
        )}
      </header>

      {/* White card container */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Filters */}
        <div className="p-6 pb-4">
          <MeetingFilters
            search={search}
            onSearchChange={handleSearchChange}
            showArchived={showArchived}
            onArchivedChange={handleArchivedChange}
          />
        </div>

        {/* Meeting list */}
        <div className="border-t">
          <MeetingList
            meetings={data?.meetings || []}
            isLoading={isLoading}
            userRole={user?.role}
            currentUserId={user?.id}
            onCreate={() => setCreateOpen(true)}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center py-4 px-6 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                title="Première page"
              >
                <span className="text-lg">«</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                title="Précédent"
              >
                <span className="text-lg">‹</span>
              </Button>
              <span className="text-sm px-3">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                title="Suivant"
              >
                <span className="text-lg">›</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                title="Dernière page"
              >
                <span className="text-lg">»</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateMeetingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
