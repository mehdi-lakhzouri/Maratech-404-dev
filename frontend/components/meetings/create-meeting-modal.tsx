"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateMeeting } from "@/lib/api/meetings";
import { useGetProjects } from "@/lib/api/projects";
import { useGetUsers } from "@/lib/api/users";
import { UserSelector } from "@/components/meetings/user-selector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Helper component for Accessible Required Label (RGAA)
function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel>
      {children}
      {/* Visual Star (Hidden from Screen Readers) */}
      <span className="text-destructive ml-1" aria-hidden="true">
        *
      </span>
      {/* Text for Screen Readers Only */}
      <span className="sr-only"> (champ obligatoire)</span>
    </FormLabel>
  );
}

const createMeetingSchema = z
  .object({
    subject: z
      .string()
      .min(3, "Le sujet doit contenir au moins 3 caractères")
      .max(255),
    scheduledAt: z.string().min(1, "La date et heure sont requises"),
    location: z.string().optional(),
    participantIds: z.array(z.string()).optional(),
    projectId: z.string().optional(),
  })
  .refine(
    (data) => {
      const date = new Date(data.scheduledAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return date > oneHourAgo;
    },
    {
      message: "La date doit être dans le futur",
      path: ["scheduledAt"],
    },
  );

type CreateMeetingFormValues = z.infer<typeof createMeetingSchema>;

interface CreateMeetingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMeetingModal({
  isOpen,
  onOpenChange,
}: CreateMeetingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMeeting = useCreateMeeting();

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects();
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsers();

  // Safe Data Extraction
  const usersList = Array.isArray(usersData)
    ? usersData
    : (usersData as any)?.users || (usersData as any)?.data || [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateMeetingFormValues>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      subject: "",
      location: "",
      participantIds: [],
      projectId: "",
    },
  });

  async function onSubmit(values: CreateMeetingFormValues) {
    try {
      setIsSubmitting(true);
      await createMeeting.mutateAsync(values);
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });

      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) form.reset();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Créer une nouvelle réunion</DialogTitle>
          <DialogDescription>
            Remplissez les détails pour créer une réunion
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[80vh]">
          <div className="px-6 pb-6 pt-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Subject */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      {/* ✅ Uses the new accessible label component */}
                      <RequiredLabel>Sujet</RequiredLabel>
                      <FormControl>
                        <Input
                          placeholder="Exemple: Réunion de planification Q1"
                          {...field}
                          // RGAA: Autocomplete helps users fill forms faster
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <RequiredLabel>Date et heure</RequiredLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projet</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger aria-label="Sélectionner un projet">
                            <SelectValue placeholder="Sélectionnez un projet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProjects ? (
                            <SelectItem value="loading" disabled>
                              Chargement...
                            </SelectItem>
                          ) : (
                            projects?.map((project) => (
                              <SelectItem key={project._id} value={project._id}>
                                {project.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Exemple: Salle 301 ou Zoom"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Participants Selector */}
                <FormField
                  control={form.control}
                  name="participantIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participants</FormLabel>
                      <FormControl>
                        <UserSelector
                          users={usersList}
                          isLoading={isLoadingUsers}
                          selectedUserIds={field.value || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* API Error Message (Role=alert for screen readers) */}
                {createMeeting.isError && (
                  <div
                    role="alert"
                    className="text-destructive text-sm font-medium p-2 bg-destructive/10 rounded"
                  >
                    ❌ Erreur : {createMeeting.error?.message}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || createMeeting.isPending}
                  >
                    {isSubmitting || createMeeting.isPending
                      ? "Création..."
                      : "Créer la réunion"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
