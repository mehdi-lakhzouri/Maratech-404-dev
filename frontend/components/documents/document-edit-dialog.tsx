'use client';

/**
 * Document Edit Dialog
 * --------------------
 * Modal dialog for editing document metadata and optionally replacing the file.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Upload, X, File } from 'lucide-react';

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
import { useUpdateDocument, useTags } from '@/lib/hooks/use-documents';
import {
  updateDocumentSchema,
  type UpdateDocumentFormData,
  DOCUMENT_TYPES,
} from '@/lib/validations/documents';
import type { DocumentItem } from '@/lib/api/types';
import { toast } from 'sonner';

interface DocumentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentItem | null;
}

export function DocumentEditDialog({
  open,
  onOpenChange,
  document,
}: DocumentEditDialogProps) {
  const { mutate: update, isPending } = useUpdateDocument();
  const { data: existingTags = [] } = useTags();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFile, setNewFile] = useState<File | null>(null);

  const form = useForm<UpdateDocumentFormData>({
    resolver: zodResolver(updateDocumentSchema),
    defaultValues: {
      title: '',
      type: undefined,
      description: '',
      tags: [],
    },
  });

  // Reset form and file when document changes
  useEffect(() => {
    if (document && open) {
      form.reset({
        title: document.title,
        type: document.type,
        description: document.description || '',
        tags: document.tags || [],
      });
      setNewFile(null);
    }
  }, [document, open, form]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setNewFile(file);
      }
    },
    [],
  );

  const clearFile = useCallback(() => {
    setNewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const onSubmit = useCallback(
    (data: UpdateDocumentFormData) => {
      if (!document) return;
      update(
        {
          publicId: document.publicId,
          data: {
            title: data.title,
            type: data.type,
            description: data.description || undefined,
            tags: data.tags && data.tags.length > 0 ? data.tags : [],
            file: newFile || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success('Document mis à jour');
            setNewFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error((err as Error)?.message || 'Erreur lors de la mise à jour');
          },
        },
      );
    },
    [document, update, onOpenChange, newFile, fileInputRef],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Modifier le document
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du document.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 mt-2"
            noValidate
          >
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
                    value={field.value}
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

            {/* File Replacement */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Remplacer le fichier (optionnel)
              </label>
              <div className="space-y-2">
                {!newFile ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                      className="hidden"
                      id="file-replace"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choisir un nouveau fichier
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fichier actuel : {document?.originalFileName}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{newFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(newFile.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={clearFile}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PDF, DOCX, XLSX, PNG, JPG (max 10 Mo)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    Enregistrer
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
