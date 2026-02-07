'use client';

/**
 * Document Preview Dialog
 * -----------------------
 * Modal dialog that shows document details and preview.
 * PDFs and images are rendered inline; other types show metadata.
 */

import {
  FileText,
  Download,
  Calendar,
  User,
  Tag,
  FileType,
  HardDrive,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { DocumentItem } from '@/lib/api/types';
import { useDownloadDocument } from '@/lib/hooks/use-documents';
import { DOCUMENT_TYPES } from '@/lib/validations/documents';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentItem | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  document,
}: DocumentPreviewDialogProps) {
  const { download, isDownloading } = useDownloadDocument();
  const isImage = document?.mimeType?.startsWith('image/');
  const isPdf = document?.mimeType === 'application/pdf';
  const canPreview = isImage || isPdf;

  // Build preview URL with timestamp to bypass cache
  const previewUrl = canPreview && document
    // eslint-disable-next-line react-hooks/purity
    ? `${API_CONFIG.baseUrl}${API_ENDPOINTS.documents.download(document.publicId)}?t=${Date.now()}`
    : null;

  if (!document) return null;

  const typeLabel =
    DOCUMENT_TYPES.find((t) => t.value === document.type)?.label || document.type;
  const uploaderName =
    typeof document.uploadedBy === 'object'
      ? document.uploadedBy.fullName
      : 'Inconnu';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            {document.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Preview Area */}
          {canPreview && previewUrl && (
            <div className="rounded-xl border bg-muted/30 overflow-hidden">
              {isPdf ? (
                <iframe
                  src={previewUrl}
                  className="w-full min-h-[500px]"
                  title={`Aperçu de ${document.title}`}
                  style={{ height: '70vh' }}
                />
              ) : isImage ? (
                <div className="flex items-center justify-center p-4 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={document.title}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                  />
                </div>
              ) : null}
            </div>
          )}

          {/* Non-previewable file */}
          {!canPreview && (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border bg-muted/30">
              <FileText className="h-16 w-16 text-muted-foreground/40 mb-3" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Aperçu non disponible pour ce type de fichier
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Téléchargez le fichier pour le consulter
              </p>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <FileType className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Type :</span>
              <Badge variant="secondary">{typeLabel}</Badge>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Taille :</span>
              <span>{formatFileSize(document.sizeBytes)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Par :</span>
              <span>{uploaderName}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Date :</span>
              <span>{formatDate(document.uploadedAt)}</span>
            </div>

            <div className="col-span-2 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Fichier :</span>
              <span className="truncate">{document.originalFileName}</span>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{document.description}</p>
            </div>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {document.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Archive status */}
          {document.isArchived && (
            <Badge variant="destructive" className="text-xs">
              Archivé
              {document.archivedAt && ` le ${formatDate(document.archivedAt)}`}
            </Badge>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
            <Button
              className="flex-1"
              onClick={() => download(document.publicId, document.safeFileName)}
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Télécharger
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
