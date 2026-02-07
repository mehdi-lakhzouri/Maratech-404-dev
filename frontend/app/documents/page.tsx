'use client';

/**
 * Documents Page
 * --------------
 * Main document management page.
 * Accessible: WCAG 2.1 AA, keyboard navigation, screen reader support.
 */

import { useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DocumentUploadDialog } from '@/components/documents/document-upload-dialog';
import { DocumentFilters } from '@/components/documents/document-filters';
import { DocumentList } from '@/components/documents/document-list';

import { useDocuments } from '@/lib/hooks/use-documents';
import { useCurrentUser, useHasRole } from '@/lib/hooks/use-auth';
import type { DocumentType, DocumentsQueryParams } from '@/lib/api/types';

// Removed unused Pagination import - using Button-based pagination

export default function DocumentsPage() {
  const { data: user } = useCurrentUser();
  const canUpload = useHasRole('RESPONSABLE', 'CHEF_PROJET');

  // State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<DocumentType | undefined>();
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  const params: DocumentsQueryParams = {
    q: search || undefined,
    type,
    archived: showArchived,
    page,
    limit: 20,
    // CHEF_PROJET sees all documents but can only CRUD their own (handled by document-list)
  };

  const { data, isLoading } = useDocuments(params);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTypeChange = useCallback((value: DocumentType | undefined) => {
    setType(value);
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
            <FileText className="h-6 w-6" aria-hidden="true" />
            Gestion des Documents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.meta?.total ?? 0} document{(data?.meta?.total ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Téléverser
          </Button>
        )}
      </header>

      {/* White card container */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Filters */}
        <div className="p-6 pb-4">
          <DocumentFilters
            search={search}
            onSearchChange={handleSearchChange}
            type={type}
            onTypeChange={handleTypeChange}
            showArchived={showArchived}
            onArchivedChange={handleArchivedChange}
          />
        </div>

        {/* Document list */}
        <div className="border-t">
          <DocumentList
            documents={data?.documents || []}
            isLoading={isLoading}
            userRole={user?.role}
            currentUserId={user?.id}
            onUpload={() => setUploadOpen(true)}
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

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </div>
  );
}
