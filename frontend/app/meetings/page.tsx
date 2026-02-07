"use client";

/**
 * Meetings List Page
 * ------------------
 * Displays all meetings with filters (project, date range)
 * WCAG 2.1 AA: semantic HTML, aria-live, keyboard navigation
 */

import { useState } from "react";
import Link from "next/link";
import { useGetMeetings } from "@/lib/api/meetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MeetingsListPageProps {
  searchParams?: Promise<Record<string, string>>;
}

export default function MeetingsListPage({
  searchParams,
}: MeetingsListPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectId, setProjectId] = useState("");

  const { data, isLoading, error } = useGetMeetings({
    projectId: projectId || undefined,
    skip: 0,
    limit: 50,
  });

  const filteredMeetings =
    data?.data.filter(
      (meeting) =>
        meeting.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.location?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="flex items-center justify-between"
        aria-labelledby="meetings-heading"
      >
        <div>
          <h1
            id="meetings-heading"
            className="text-3xl font-bold tracking-tight"
          >
            Réunions
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos réunions et consultez les procès-verbaux
          </p>
        </div>
        <Link href="/meetings/new">
          <Button aria-label="Créer une nouvelle réunion">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nouvelle réunion
          </Button>
        </Link>
      </section>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="search-input" className="text-sm font-medium">
              Rechercher
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="search-input"
                  placeholder="Sujet, localisation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  aria-describedby="search-helper"
                />
              </div>
            </div>
            <p
              id="search-helper"
              className="text-xs text-muted-foreground mt-1"
            >
              Recherche en temps réel sur le sujet et la localisation
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <section
        aria-labelledby="meetings-list-heading"
        aria-busy={isLoading}
        aria-live="polite"
      >
        <h2 id="meetings-list-heading" className="sr-only">
          Liste des réunions
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive bg-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">
                Erreur lors du chargement des réunions
              </p>
              <p className="text-sm text-destructive/80">{error.message}</p>
            </CardContent>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar
                className="h-12 w-12 mx-auto mb-4 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-muted-foreground font-medium">
                Aucune réunion trouvée
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Commencez par créer votre première réunion
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMeetings.map((meeting) => (
              <Link key={meeting._id} href={`/meetings/${meeting._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-ring">
                  <CardHeader>
                    <CardTitle className="text-lg">{meeting.subject}</CardTitle>
                    <CardDescription>
                      {meeting.location && (
                        <span className="block mb-1">
                          📍 {meeting.location}
                        </span>
                      )}
                      <Calendar
                        className="inline h-4 w-4 mr-1"
                        aria-hidden="true"
                      />
                      {format(new Date(meeting.scheduledAt), "PPP p", {
                        locale: fr,
                      })}
                    </CardDescription>
                  </CardHeader>
                  {(meeting.minutes || meeting.draftNotes) && (
                    <CardContent>
                      {meeting.minutes && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ✓ Procès-verbal finalisé
                        </p>
                      )}
                      {meeting.draftNotes && !meeting.minutes && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          📝 Brouillon en cours
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
