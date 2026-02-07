'use client';

/**
 * Document Upload Sheet
 * ---------------------
 * Accessible sheet for uploading documents.
 * WCAG 2.1 AA: keyboard navigation, screen reader support, aria-live progress.
 */

import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useUploadDocument } from '@/lib/hooks/use-documents';
import {
  uploadDocumentSchema,
  type UploadDocumentFormData,
  DOCUMENT_TYPES,
} from '@/lib/validations/documents';
import { cn } from '@/lib/utils';

interface DocumentUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
};

export function DocumentUploadSheet({
  open,
  onOpenChange,
}: DocumentUploadSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mutate: upload, isPending, isSuccess, isError, error, progress } =
    useUploadDocument();

  const form = useForm<UploadDocumentFormData>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      title: '',
      type: undefined,
      description: '',
      tags: '',
    },
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        form.setValue('file', file, { shouldValidate: true });
        // Auto-fill title if empty
        if (!form.getValues('title')) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          form.setValue('title', nameWithoutExt);
        }
      }
    },
    [form],
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    form.setValue('file', undefined as unknown as File);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [form]);

  const onSubmit = useCallback(
    (data: UploadDocumentFormData) => {
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

      upload(
        {
          data: {
            title: data.title,
            type: data.type,
            description: data.description || undefined,
            tags,
            file: data.file,
          },
        },
        {
          onSuccess: () => {
            form.reset();
            setSelectedFile(null);
            setTimeout(() => onOpenChange(false), 1500);
          },
        },
      );
    },
    [upload, form, onOpenChange],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        form.reset();
        setSelectedFile(null);
      }
      onOpenChange(open);
    },
    [form, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto"
        aria-label="Téléverser un document"
      >
        {/* Status bar */}
        <div className="h-1.5 w-full bg-blue-500 absolute top-0 left-0 right-0" />

        <SheetHeader className="pt-4">
          <SheetTitle className="text-xl font-semibold">
            Téléverser un document
          </SheetTitle>
          <SheetDescription>
            Sélectionnez un fichier et renseignez les informations du document.
            Types acceptés : PDF, DOCX, XLSX, PNG, JPG (max 10 Mo).
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
            noValidate
          >
            {/* File Upload Area */}
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel required>Fichier</FormLabel>
                  <FormControl>
                    <div>
                      {!selectedFile ? (
                        <label
                          htmlFor="file-upload"
                          className={cn(
                            'flex flex-col items-center justify-center w-full h-32',
                            'border-2 border-dashed rounded-lg cursor-pointer',
                            'border-muted-foreground/25 hover:border-primary/50',
                            'transition-colors bg-muted/30 hover:bg-muted/50',
                            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                          )}
                        >
                          <Upload
                            className="h-8 w-8 text-muted-foreground mb-2"
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium">
                            Choisir un fichier
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            ou glisser-déposer ici
                          </span>
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                            aria-describedby="file-help"
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <FileText
                            className="h-8 w-8 text-blue-500 shrink-0"
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {MIME_LABELS[selectedFile.type] || selectedFile.type}{' '}
                              — {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={clearFile}
                            aria-label="Retirer le fichier"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <p id="file-help" className="text-xs text-muted-foreground mt-1">
                        PDF, DOCX, XLSX, PNG, JPG — max 10 Mo
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Titre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nom du document"
                      {...field}
                      aria-describedby="title-error"
                    />
                  </FormControl>
                  <FormMessage id="title-error" />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Type de document">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description optionnelle..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="facture, projet-x, urgent"
                      {...field}
                      aria-describedby="tags-help"
                    />
                  </FormControl>
                  <p id="tags-help" className="text-xs text-muted-foreground">
                    Séparez les tags par des virgules
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {isPending && (
              <div role="status" aria-live="polite">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="text-sm font-medium">
                    Téléversement en cours… {progress}%
                  </span>
                </div>
                <Progress
                  value={progress}
                  className="h-2"
                  aria-label={`Progression : ${progress}%`}
                />
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <Alert role="status" aria-live="polite">
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                <AlertDescription className="text-green-700">
                  Document téléversé avec succès
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {isError && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  {(error as Error)?.message || 'Erreur lors du téléversement'}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || isSuccess}
                aria-busy={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Téléversement...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                    Téléverser
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Screen reader announcements */}
        <div aria-live="assertive" className="sr-only">
          {isPending && `Téléversement en cours : ${progress} pour cent`}
          {isSuccess && 'Document téléversé avec succès'}
          {isError && 'Erreur lors du téléversement du document'}
        </div>
      </SheetContent>
    </Sheet>
  );
}
