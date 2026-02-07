'use client';

/**
 * Document List
 * -------------
 * Accessible table display of documents with full CRUD actions.
 * Edit, Download, Archive/Restore, Delete.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Archive,
  RotateCcw,
  MoreVertical,
  Upload,
  Eye,
  Pencil,
  Trash2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { DocumentEditDialog } from '@/components/documents/document-edit-dialog';

import type { DocumentItem, UserRole } from '@/lib/api/types';
import {
  useDownloadDocument,
  useArchiveDocument,
  useRestoreDocument,
  useDeleteDocument,
} from '@/lib/hooks/use-documents';
import { DOCUMENT_TYPES } from '@/lib/validations/documents';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentListProps {
  documents: DocumentItem[];
  isLoading: boolean;
  userRole?: UserRole;
  currentUserId?: string;
  onUpload: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

const TYPE_COLORS: Record<string, string> = {
  REPORT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MEETING_MINUTES: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ADMIN: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  PROJECT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
};

export function DocumentList({
  documents,
  isLoading,
  userRole,
  currentUserId,
  onUpload,
}: DocumentListProps) {
  const { download, isDownloading } = useDownloadDocument();
  const archiveMutation = useArchiveDocument();
  const restoreMutation = useRestoreDocument();
  const deleteMutation = useDeleteDocument();

  const router = useRouter();
  const [editDoc, setEditDoc] = useState<DocumentItem | null>(null);

  // Check if user can manage any documents (upload, etc.)
  const canManageAny = userRole === 'RESPONSABLE' || userRole === 'CHEF_PROJET';

  // Check if user can manage a specific document
  const canManageDoc = (doc: DocumentItem) => {
    if (userRole === 'RESPONSABLE') return true;
    if (userRole === 'CHEF_PROJET') {
      // CHEF_PROJET can only manage their own documents
      const uploaderId = typeof doc.uploadedBy === 'object' ? doc.uploadedBy.id : doc.uploadedBy;
      return uploaderId === currentUserId;
    }
    return false;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3 p-4" role="status" aria-label="Chargement des documents">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
        <span className="sr-only">Chargement en cours...</span>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText
          className="h-16 w-16 text-muted-foreground/40 mb-4"
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold mb-1">Aucun document</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Aucun document ne correspond à vos critères.
        </p>
        {canManageAny && (
          <Button onClick={onUpload}>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Téléverser un document
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 py-4 px-4" aria-label="Icône" />
              <TableHead className="py-4 px-4">Titre</TableHead>
              <TableHead className="py-4 px-4">Type</TableHead>
              <TableHead className="py-4 px-4">Tags</TableHead>
              <TableHead className="py-4 px-4">Taille</TableHead>
              <TableHead className="py-4 px-4">Téléversé par</TableHead>
              <TableHead className="py-4 px-4">Date</TableHead>
              <TableHead className="w-24 py-4 px-4 text-right" aria-label="Actions">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const typeLabel =
                DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ||
                doc.type;
              const uploaderName =
                doc.uploadedBy && typeof doc.uploadedBy === 'object'
                  ? doc.uploadedBy.fullName
                  : 'Inconnu';

              return (
                <TableRow
                  key={doc.publicId}
                  className={cn(doc.isArchived && 'opacity-60')}
                >
                  <TableCell className="py-4 px-4">
                    <FileText
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {doc.originalFileName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', TYPE_COLORS[doc.type])}
                    >
                      {typeLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-38">
                      {doc.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags && doc.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{doc.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                    {formatFileSize(doc.sizeBytes)}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm">{uploaderName}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Preview button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/documents/${doc.publicId}`)}
                        aria-label={`Aperçu de ${doc.title}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions pour ${doc.title}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* View/Show */}
                          <DropdownMenuItem
                            onClick={() => router.push(`/documents/${doc.publicId}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                            Voir
                          </DropdownMenuItem>

                          {/* Download */}
                          <DropdownMenuItem
                            onClick={() =>
                              download(doc.publicId, doc.safeFileName)
                            }
                            disabled={isDownloading}
                          >
                            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                            Télécharger
                          </DropdownMenuItem>

                          {/* Edit */}
                          {canManageDoc(doc) && (
                            <DropdownMenuItem
                              onClick={() => setEditDoc(doc)}
                            >
                              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                              Modifier
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Archive */}
                          {canManageDoc(doc) && !doc.isArchived && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Archive
                                    className="mr-2 h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Archiver
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Archiver ce document ?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Le document « {doc.title} » sera archivé. Vous
                                    pourrez le restaurer ultérieurement.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      archiveMutation.mutate(doc.publicId, {
                                        onSuccess: () => toast.success('Document archivé'),
                                      });
                                    }}
                                  >
                                    Archiver
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Restore */}
                          {canManageDoc(doc) && doc.isArchived && (
                            <DropdownMenuItem
                              onClick={() => {
                                restoreMutation.mutate(doc.publicId, {
                                  onSuccess: () => toast.success('Document restauré'),
                                });
                              }}
                            >
                              <RotateCcw
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              Restaurer
                            </DropdownMenuItem>
                          )}

                          {/* Delete */}
                          {canManageDoc(doc) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2
                                    className="mr-2 h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Supprimer
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Supprimer définitivement ?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Le document « {doc.title} » sera supprimé
                                    définitivement. Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => {
                                      deleteMutation.mutate(doc.publicId, {
                                        onSuccess: () =>
                                          toast.success('Document supprimé'),
                                      });
                                    }}
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <DocumentEditDialog
        open={!!editDoc}
        onOpenChange={(open) => !open && setEditDoc(null)}
        document={editDoc}
      />
    </>
  );
}
