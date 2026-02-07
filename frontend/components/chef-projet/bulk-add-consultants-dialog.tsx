'use client';

/**
 * Bulk Add Consultants Dialog
 * ---------------------------
 * Dialog for adding multiple consultants via CSV or form.
 */

import { useCallback, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, FileSpreadsheet } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useCreateConsultantsBulk } from '@/lib/hooks/use-chef-projet';

const consultantSchema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Min 8 caractères'),
});

const bulkSchema = z.object({
  consultants: z.array(consultantSchema).min(1, 'Au moins un consultant requis'),
});

type BulkFormData = z.infer<typeof bulkSchema>;

interface BulkAddConsultantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkAddConsultantsDialog({ open, onOpenChange }: BulkAddConsultantsDialogProps) {
  const { mutate: createBulk, isPending } = useCreateConsultantsBulk();
  const [csvError, setCsvError] = useState<string | null>(null);

  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      consultants: [{ fullName: '', email: '', password: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'consultants',
  });

  const handleCsvUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
        
        const consultants = lines.slice(startIndex).map(line => {
          const [fullName, email, password] = line.split(',').map(s => s.trim());
          return { fullName, email, password };
        }).filter(c => c.fullName && c.email && c.password);

        if (consultants.length === 0) {
          setCsvError('Aucun consultant valide trouvé dans le fichier');
          return;
        }

        form.setValue('consultants', consultants);
        toast.success(`${consultants.length} consultants chargés`);
      } catch {
        setCsvError('Erreur lors de la lecture du fichier CSV');
      }
    };

    reader.onerror = () => {
      setCsvError('Erreur lors de la lecture du fichier');
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }, [form]);

  const onSubmit = useCallback(
    (data: BulkFormData) => {
      createBulk(data, {
        onSuccess: (result) => {
          if (result.failed > 0) {
            toast.warning(
              `${result.success} créé(s), ${result.failed} échoué(s)`,
              {
                description: result.errors.map(e => `${e.email}: ${e.message}`).join('\n'),
              }
            );
          } else {
            toast.success(`${result.success} consultant(s) créé(s) avec succès`);
          }
          form.reset({ consultants: [{ fullName: '', email: '', password: '' }] });
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error((error as Error)?.message || 'Erreur lors de la création');
        },
      });
    },
    [createBulk, form, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import en masse de Consultants</DialogTitle>
          <DialogDescription>
            Ajoutez plusieurs consultants à la fois via formulaire ou fichier CSV.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Formulaire</TabsTrigger>
            <TabsTrigger value="csv">Import CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Format CSV attendu: <code>Nom complet,Email,Mot de passe</code>
                <br />
                Exemple: <code>Jean Dupont,jean@example.com,password123</code>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleCsvUpload}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>

            {csvError && (
              <Alert variant="destructive">
                <AlertDescription>{csvError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="form">
            <div className="text-sm text-muted-foreground mb-2">
              Ajoutez les consultants un par un ou importez un CSV.
            </div>
          </TabsContent>
        </Tabs>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid gap-2">
                      <FormField
                        control={form.control}
                        name={`consultants.${index}.fullName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Nom complet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`consultants.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="email" placeholder="Email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`consultants.${index}.password`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="password" placeholder="Mot de passe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ fullName: '', email: '', password: '' })}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un consultant
            </Button>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {fields.length} consultant(s) à créer
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Spinner className="mr-2 h-4 w-4" />}
                  Créer tous
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
