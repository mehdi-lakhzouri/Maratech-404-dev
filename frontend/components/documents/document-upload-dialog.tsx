'use client';

/**
 * Document Upload Dialog
 * ----------------------
 * Modal dialog with drag & drop file upload area.
 * Tags use the TagInput component with autocomplete.
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

import { TagInput } from '@/components/documents/tag-input';
import { useUploadDocument, useTags } from '@/lib/hooks/use-documents';
import {
  uploadDocumentSchema,
  type UploadDocumentFormData,
  DOCUMENT_TYPES,
} from '@/lib/validations/documents';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface DocumentUploadDialogProps {
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

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
];

export function DocumentUploadDialog({
  open,
  onOpenChange,
}: DocumentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { mutate: upload, isPending, isSuccess, isError, error, progress } =
    useUploadDocument();
  const { data: existingTags = [] } = useTags();
  const queryClient = useQueryClient();

  const form = useForm<UploadDocumentFormData>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      title: '',
      type: undefined,
      description: '',
      tags: [],
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (file.size > 10 * 1024 * 1024) return;
      setSelectedFile(file);
      form.setValue('file', file, { shouldValidate: true });
      if (!form.getValues('title')) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        form.setValue('title', nameWithoutExt);
      }
    },
    [form],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
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
      upload(
        {
          data: {
            title: data.title,
            type: data.type,
            description: data.description || undefined,
            tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
            file: data.file,
          },
        },
        {
          onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['documents'] });
            form.reset();
            setSelectedFile(null);
            setTimeout(() => onOpenChange(false), 1200);
          },
        },
      );
    },
    [upload, form, onOpenChange, queryClient],
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Téléverser un document
          </DialogTitle>
          <DialogDescription>
            Glissez-déposez un fichier ou cliquez pour sélectionner.
            Types acceptés : PDF, DOCX, XLSX, PNG, JPG (max 10 Mo).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 mt-2"
            noValidate
          >
            {/* Drag & Drop File Area */}
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
                          htmlFor="file-upload-dialog"
                          className={cn(
                            'flex flex-col items-center justify-center w-full h-40',
                            'border-2 border-dashed rounded-xl cursor-pointer',
                            'transition-all duration-200',
                            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                            isDragging
                              ? 'border-primary bg-primary/5 scale-[1.02]'
                              : 'border-muted-foreground/25 hover:border-primary/50 bg-muted/30 hover:bg-muted/50',
                          )}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <div className={cn(
                            'rounded-full p-3 mb-3 transition-colors',
                            isDragging ? 'bg-primary/10' : 'bg-muted',
                          )}>
                            <Upload
                              className={cn(
                                'h-6 w-6 transition-colors',
                                isDragging ? 'text-primary' : 'text-muted-foreground',
                              )}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {isDragging ? 'Déposez le fichier ici' : 'Glisser-déposer un fichier'}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            ou <span className="text-primary underline">parcourir</span>
                          </span>
                          <span className="text-xs text-muted-foreground mt-2">
                            PDF, DOCX, XLSX, PNG, JPG — max 10 Mo
                          </span>
                          <input
                            id="file-upload-dialog"
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-2">
                            <FileText
                              className="h-6 w-6 text-blue-500"
                              aria-hidden="true"
                            />
                          </div>
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
                    <Input placeholder="Nom du document" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={existingTags}
                      placeholder="Ajouter un tag..."
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Tapez pour chercher ou créer un nouveau tag
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
      </DialogContent>
    </Dialog>
  );
}
