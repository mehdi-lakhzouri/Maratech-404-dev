"use client";

/**
 * Create Meeting Page
 * -------------------
 * Form to create a new meeting with validation
 * WCAG 2.1 AA: form labels, error messages, required indicators
 */

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateMeeting } from "@/lib/api/meetings";
// 👇 NEW IMPORT
import { useGetProjects } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const createMeetingSchema = z
  .object({
    subject: z
      .string()
      .min(3, "Le sujet doit contenir au moins 3 caractères")
      .max(255),
    scheduledAt: z.string().min(1, "La date et heure sont requises"),
    location: z.string().optional(),
    participantsText: z.string().optional(),
    projectId: z.string().optional(),
  })
  .refine(
    (data) => {
      const date = new Date(data.scheduledAt);
      // Allow 1 hour in the past for timezone buffer
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return date > oneHourAgo;
    },
    {
      message: "La date doit être dans le futur",
      path: ["scheduledAt"],
    },
  );

type CreateMeetingFormValues = z.infer<typeof createMeetingSchema>;

export default function CreateMeetingPage() {
  const router = useRouter();
  const createMeeting = useCreateMeeting();

  // 👇 FETCH PROJECTS FROM DB
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects();

  const form = useForm<CreateMeetingFormValues>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      subject: "",
      location: "",
      participantsText: "",
      projectId: "",
    },
  });

  async function onSubmit(values: CreateMeetingFormValues) {
    try {
      await createMeeting.mutateAsync(values);
      router.push("/meetings");
    } catch (error) {
      console.error("Failed to create meeting:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/meetings"
        className="inline-flex items-center text-primary hover:underline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Retour aux réunions
      </Link>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Créer une nouvelle réunion</CardTitle>
          <CardDescription>
            Remplissez les détails pour créer une réunion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Subject */}
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sujet <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Exemple: Réunion de planification Q1"
                        {...field}
                        aria-describedby="subject-error"
                      />
                    </FormControl>
                    <FormMessage id="subject-error" />
                  </FormItem>
                )}
              />

              {/* Scheduled At */}
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date et heure <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value || ""}
                        aria-describedby="scheduledAt-error"
                      />
                    </FormControl>
                    <FormMessage id="scheduledAt-error" />
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
                        aria-describedby="location-error"
                      />
                    </FormControl>
                    <FormDescription>
                      Peut être un lieu physique ou une URL de conférence
                    </FormDescription>
                    <FormMessage id="location-error" />
                  </FormItem>
                )}
              />

              {/* Participants Text */}
              <FormField
                control={form.control}
                name="participantsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Noms ou rôles des participants (optionnel)"
                        {...field}
                        className="min-h-24"
                        aria-describedby="participantsText-error"
                      />
                    </FormControl>
                    <FormMessage id="participantsText-error" />
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-describedby="projectId-error">
                          <SelectValue placeholder="Sélectionnez un projet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* 👇 DYNAMIC LIST */}
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
                    <FormDescription>
                      Sélectionnez le projet associé à cette réunion
                    </FormDescription>
                    <FormMessage id="projectId-error" />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMeeting.isPending}
                  aria-busy={createMeeting.isPending}
                >
                  {createMeeting.isPending ? "Création..." : "Créer la réunion"}
                </Button>
                <Link href="/meetings">
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </Link>
              </div>

              {createMeeting.isError && (
                <p
                  className="text-destructive text-sm font-medium"
                  role="alert"
                >
                  ❌ Erreur : {createMeeting.error?.message}
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
