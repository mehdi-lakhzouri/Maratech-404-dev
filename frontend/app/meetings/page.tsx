"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetMeetings } from "@/lib/api/meetings";
// Make sure this path matches where you put the file!
import { CreateMeetingModal } from "@/components/meetings/create-meeting-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MeetingsListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <Button
          onClick={() => setIsModalOpen(true)}
          aria-label="Créer une nouvelle réunion"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nouvelle réunion
        </Button>
      </section>

      {/* ✅ MOVED OUTSIDE SECTION & FIXED TAG */}
      <CreateMeetingModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />

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
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <section
        aria-labelledby="meetings-list-heading"
        aria-busy={isLoading}
        aria-live="polite"
      >
        {/* ... (Keep your existing list code here, it was fine) ... */}
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
        ) : filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Aucune réunion trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMeetings.map((meeting) => (
              <Link key={meeting._id} href={`/meetings/${meeting._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{meeting.subject}</CardTitle>
                    <CardDescription>
                      {format(new Date(meeting.scheduledAt), "PPP p", {
                        locale: fr,
                      })}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
