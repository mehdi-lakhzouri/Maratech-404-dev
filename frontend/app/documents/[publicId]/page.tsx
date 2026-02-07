'use client';

/**
 * Document View Page
 * ------------------
 * Full page view for individual documents.
 * Shows document details and preview in full screen.
 */

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, FileText, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useDocument } from '@/lib/hooks/use-documents';
import { useDownloadDocument } from '@/lib/hooks/use-documents';
import { downloadDocument } from '@/lib/api/documents';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const publicId = params.publicId as string;

  const { data: document, isLoading, error } = useDocument(publicId);
  const { download, isDownloading } = useDownloadDocument();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load document blob for preview
  useEffect(() => {
    if (!document) return;

    let objectUrl: string | null = null;

    const loadPreview = async () => {
      setLoadingPreview(true);
      try {
        const blob = await downloadDocument(publicId);
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (err) {
        console.error('Error loading preview:', err);
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreview();

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document, publicId]);

  const handleDownload = () => {
    if (!document) return;
    download(document.publicId, document.originalFileName || document.safeFileName);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertDescription>
              {error?.message || 'Document introuvable'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/documents')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux documents
          </Button>
        </div>
      </div>
    );
  }

  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';
  const canPreview = isImage || isPdf;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/documents')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {document.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {document.type} • {formatFileSize(document.sizeBytes)}
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Téléchargement...' : 'Télécharger'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Détails du document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Titre
                  </label>
                  <p className="text-sm text-gray-900">{document.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <p className="text-sm text-gray-900">{document.type}</p>
                </div>

                {document.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p className="text-sm text-gray-900">{document.description}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Taille
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatFileSize(document.sizeBytes)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Téléchargé par
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {document.uploadedBy && typeof document.uploadedBy === 'object'
                      ? document.uploadedBy.fullName
                      : 'Inconnu'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date d&apos;ajout
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {document.tags && document.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Aperçu</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : canPreview && previewUrl ? (
                  <div className="w-full">
                    {isPdf ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-96 border rounded-lg"
                        title={`Aperçu de ${document.title}`}
                      />
                    ) : isImage ? (
                      <div className="flex justify-center">
                        <img
                          src={previewUrl}
                          alt={`Aperçu de ${document.title}`}
                          className="max-w-full max-h-96 object-contain rounded-lg border"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">
                      Ce type de fichier ne peut pas être aperçu directement.
                    </p>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger pour voir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}