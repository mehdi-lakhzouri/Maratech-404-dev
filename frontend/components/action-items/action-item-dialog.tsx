'use client';

/**
 * Action Item Dialog
 * ------------------
 * Accessible dialog for creating and editing action items.
 * 
 * Accessibility features:
 * - Focus trap within dialog
 * - Escape key to close
 * - Labeled form controls
 * - Error announcements
 */

import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Save, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCreateActionItem,
  useUpdateActionItem,
} from '@/lib/hooks/use-action-items';
import { useUsers } from '@/lib/hooks/use-users';
import type { ActionItem, UserManagement } from '@/lib/api/types';
import { toast } from 'sonner';

// Form validation schema
const actionItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

type ActionItemFormValues = z.infer<typeof actionItemSchema>;

interface ActionItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionItem?: ActionItem;
  onSuccess?: () => void;
  defaultMeetingId?: string;
  defaultProjectId?: string;
}

// Helper to format date for input
function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

export function ActionItemDialog({
  open,
  onOpenChange,
  actionItem,
  onSuccess,
  defaultMeetingId,
  defaultProjectId,
}: ActionItemDialogProps) {
  const formId = useId();
  const isEditing = !!actionItem;

  const createMutation = useCreateActionItem();
  const updateMutation = useUpdateActionItem();
  const { data: usersData } = useUsers({ limit: 100 });

  const users = usersData?.users ?? [];

  const form = useForm<ActionItemFormValues>({
    resolver: zodResolver(actionItemSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedTo: undefined,
      dueDate: '',
    },
  });

  // Reset form when dialog opens/closes or action item changes
  useEffect(() => {
    if (open) {
      if (actionItem) {
        form.reset({
          title: actionItem.title,
          description: actionItem.description ?? '',
          assignedTo: actionItem.assignedTo?._id ?? undefined,
          dueDate: formatDateForInput(actionItem.dueDate),
        });
      } else {
        form.reset({
          title: '',
          description: '',
          assignedTo: undefined,
          dueDate: '',
        });
      }
    }
  }, [open, actionItem, form]);

  const onSubmit = async (data: ActionItemFormValues) => {
    try {
      const dueDateISO = data.dueDate ? new Date(data.dueDate).toISOString() : undefined;
      
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: actionItem._id,
          data: {
            title: data.title,
            description: data.description || undefined,
            assignedTo: data.assignedTo || null,
            dueDate: dueDateISO || null,
          },
        });
        toast.success('Tâche mise à jour avec succès');
      } else {
        await createMutation.mutateAsync({
          data: {
            title: data.title,
            description: data.description || undefined,
            assignedTo: data.assignedTo || undefined,
            dueDate: dueDateISO,
            meetingId: defaultMeetingId,
            projectId: defaultProjectId,
          },
          idempotencyKey: crypto.randomUUID(),
        });
        toast.success('Tâche créée avec succès');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save action item:', error);
      toast.error(
        isEditing
          ? 'Erreur lors de la mise à jour de la tâche'
          : 'Erreur lors de la création de la tâche'
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-125"
        aria-describedby={`${formId}-description`}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
          <DialogDescription id={`${formId}-description`}>
            {isEditing
              ? 'Modifiez les informations de la tâche ci-dessous.'
              : 'Créez une nouvelle tâche à assigner à un membre de votre équipe.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Titre <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Entrez le titre de la tâche"
                      aria-required="true"
                      autoFocus
                    />
                  </FormControl>
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
                      {...field}
                      placeholder="Décrivez la tâche en détail (optionnel)"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Une description claire aide les membres de l&apos;équipe à
                    comprendre ce qui est attendu.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned To */}
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigner à</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Sélectionner un utilisateur">
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Non assigné</SelectItem>
                      {users.map((user: UserManagement) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    La personne responsable de cette tâche.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d&apos;échéance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                        aria-hidden="true"
                      />
                      <Input
                        type="date"
                        {...field}
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                        aria-label="Sélectionner une date d'échéance"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    La date limite pour accomplir cette tâche.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Enregistrement...</span>
              </>
            ) : isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Enregistrer</span>
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Créer</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
