"use client";

/**
 * Meeting Detail Page
 * -------------------
 * Display meeting with minutes editor, document attachment
 * Features: Real-time draft auto-save, markdown support
 * WCAG 2.1 AA: semantic tabs, focus management, live regions
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetMeeting,
  useUpdateMeetingMinutes,
  useUpdateDraftNotes,
  useGetMeetingDocuments,
  useAttachDocument,
  useArchiveMeeting,
} from "@/lib/api/meetings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Archive, FileText, Save } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const { data: meeting, isLoading, error } = useGetMeeting(meetingId);
  const { data: documents } = useGetMeetingDocuments(meetingId);
  const updateMinutes = useUpdateMeetingMinutes();
  const updateDraft = useUpdateDraftNotes();
  const archiveMeeting = useArchiveMeeting();

  const [minutesContent, setMinutesContent] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [autoSaveDraft, setAutoSaveDraft] = useState(true);
  const [lastSavedDraft, setLastSavedDraft] = useState<Date | null>(null);

  useEffect(() => {
    if (meeting) {
      setMinutesContent(meeting.minutes?.content || "");
      setDraftNotes(meeting.draftNotes || "");
    }
  }, [meeting]);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!autoSaveDraft || !draftNotes) return;

    const timer = setTimeout(() => {
      updateDraft.mutate(
        { id: meetingId, draftNotes },
        {
          onSuccess: () => setLastSavedDraft(new Date()),
        },
      );
    }, 10000);

    return () => clearTimeout(timer);
  }, [draftNotes, autoSaveDraft, meetingId, updateDraft]);

  const handleSaveMinutes = useCallback(() => {
    if (!minutesContent.trim()) return;
    updateMinutes.mutate({
      id: meetingId,
      content: minutesContent,
      format: "markdown",
    });
  }, [minutesContent, meetingId, updateMinutes]);

  const handleArchive = useCallback(async () => {
    if (confirm("Êtes-vous sûr de vouloir archiver cette réunion ?")) {
      await archiveMeeting.mutateAsync(meetingId);
      router.push("/meetings");
    }
  }, [meetingId, archiveMeeting, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <Card className="border-destructive bg-destructive/50">
        <CardContent className="pt-6">
          <p className="text-destructive font-medium">
            Erreur: Réunion non trouvée
          </p>
        </CardContent>
      </Card>
    );
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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{meeting.subject}</h1>
          <p className="text-muted-foreground mt-2">
            📍 {meeting.location || "Lieu non spécifié"} •{" "}
            {format(new Date(meeting.scheduledAt), "PPP p", { locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          {meeting.isArchived ? (
            <Badge variant="secondary">Archivée</Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={meeting.isArchived || archiveMeeting.isPending}
            aria-label="Archiver la réunion"
          >
            <Archive className="h-4 w-4 mr-2" aria-hidden="true" />
            Archiver
          </Button>
        </div>
      </div>

      {/* Main Content - Tabs */}
      <Card>
        <Tabs defaultValue="minutes" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="minutes"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
            >
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              Procès-verbal
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
            >
              📝 Brouillon
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
            >
              📎 Documents ({documents?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Minutes Tab */}
          <TabsContent value="minutes" className="p-6 space-y-4">
            <div>
              <label htmlFor="minutes-editor" className="text-sm font-medium">
                Procès-verbal final (Markdown)
              </label>
              <Textarea
                id="minutes-editor"
                value={minutesContent}
                onChange={(e) => setMinutesContent(e.target.value)}
                placeholder="Écrivez votre procès-verbal ici en Markdown..."
                className="min-h-96 mt-2 font-mono text-sm"
                aria-describedby="minutes-helper"
              />
              <p
                id="minutes-helper"
                className="text-xs text-muted-foreground mt-2"
              >
                Supports Markdown: **gras**, *italic*, - liste, # titre
              </p>
            </div>
            <Button
              onClick={handleSaveMinutes}
              disabled={updateMinutes.isPending || !minutesContent.trim()}
              aria-busy={updateMinutes.isPending}
            >
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {updateMinutes.isPending
                ? "Sauvegarde..."
                : "Sauvegarder le procès-verbal"}
            </Button>
            {updateMinutes.isSuccess && (
              <p className="text-sm text-green-600" role="status">
                ✓ Procès-verbal sauvegardé avec succès
              </p>
            )}
          </TabsContent>

          {/* Draft Tab */}
          <TabsContent value="draft" className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="draft-editor" className="text-sm font-medium">
                  Brouillon (Auto-sauvegarde)
                </label>
                {lastSavedDraft && (
                  <span className="text-xs text-muted-foreground">
                    Sauvegardé: {format(lastSavedDraft, "HH:mm:ss")}
                  </span>
                )}
              </div>
              <Textarea
                id="draft-editor"
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="Notes de brouillon (auto-sauvegardées toutes les 10 secondes)..."
                className="min-h-96 mt-2"
                aria-describedby="draft-helper"
              />
              <p
                id="draft-helper"
                className="text-xs text-muted-foreground mt-2"
              >
                Ce brouillon est sauvegardé automatiquement toutes les 10
                secondes
              </p>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="p-6 space-y-4">
            {documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText
                        className="h-5 w-5 text-muted-foreground flex-shrink-0"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {doc.documentId.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.documentId.fileName} •{" "}
                          {(doc.documentId.sizeBytes / 1024).toFixed(1)}KB
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.documentId.fileUrl}
                      download
                      className="text-primary hover:underline text-sm font-medium whitespace-nowrap ml-4"
                      aria-label={`Télécharger ${doc.documentId.fileName}`}
                    >
                      Télécharger
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun document attaché à cette réunion
              </p>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Meeting Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Créée par:</span>
            <span className="font-medium">{meeting.createdBy.fullName}</span>
          </div>
          {meeting.participantsText && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Participants:</span>
              <span className="font-medium">{meeting.participantsText}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Créée:</span>
            <span className="font-medium">
              {format(new Date(meeting.createdAt), "PPpp", { locale: fr })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
