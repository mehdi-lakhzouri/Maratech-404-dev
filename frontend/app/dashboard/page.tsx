"use client";

/**
 * Dashboard Page
 * --------------
 * Main dashboard with role-based content.
 * Accessible structure with proper headings and landmarks.
 */

import { useAuth } from "@/lib/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, FolderKanban, ClipboardList, TrendingUp } from "lucide-react";

const roleLabels: Record<string, string> = {
  RESPONSABLE: "Responsable",
  CHEF_PROJET: "Chef de projet",
  CONSULTANT: "Consultant",
};

const roleDescriptions: Record<string, string> = {
  RESPONSABLE: "Vous avez accès à la gestion complète de la plateforme.",
  CHEF_PROJET: "Vous pouvez gérer vos projets et votre équipe.",
  CONSULTANT: "Vous pouvez consulter et contribuer aux projets assignés.",
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Use default values when no user (dev mode without auth)
  const displayUser = user || {
    firstName: "User",
    role: "CONSULTANT",
  };

  const roleLabel = roleLabels[displayUser.role] || displayUser.role;
  const roleDescription = roleDescriptions[displayUser.role] || "";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section aria-labelledby="welcome-heading">
        <h1 id="welcome-heading" className="text-3xl font-bold tracking-tight">
          Bienvenue, {displayUser.firstName} !
        </h1>
        <p className="text-muted-foreground mt-2">
          Vous êtes connecté en tant que <strong>{roleLabel}</strong>.{" "}
          {roleDescription}
        </p>
      </section>

      {/* Stats Grid */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xl font-semibold mb-4">
          Vue d&apos;ensemble
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Projets actifs"
            value="0"
            description="Aucun projet pour le moment"
            icon={<FolderKanban className="h-4 w-4" />}
          />
          <StatCard
            title="Tâches en cours"
            value="0"
            description="Aucune tâche assignée"
            icon={<ClipboardList className="h-4 w-4" />}
          />
          {(displayUser.role === "RESPONSABLE" ||
            displayUser.role === "CHEF_PROJET") && (
            <StatCard
              title="Membres d'équipe"
              value="0"
              description="Aucun membre"
              icon={<Users className="h-4 w-4" />}
            />
          )}
          <StatCard
            title="Progression"
            value="0%"
            description="Commencez votre premier projet"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Role-specific content */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-xl font-semibold mb-4">
          Actions rapides
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayUser.role === "RESPONSABLE" && (
            <>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Gérer les utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Ajouter, modifier ou supprimer des utilisateurs
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Créer un projet</CardTitle>
                  <CardDescription>Démarrer un nouveau projet</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Rapports</CardTitle>
                  <CardDescription>
                    Voir les statistiques et rapports
                  </CardDescription>
                </CardHeader>
              </Card>
            </>
          )}

          {displayUser.role === "CHEF_PROJET" && (
            <>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Mes projets</CardTitle>
                  <CardDescription>Voir et gérer vos projets</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Mon équipe</CardTitle>
                  <CardDescription>
                    Gérer les membres de votre équipe
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Planning</CardTitle>
                  <CardDescription>Voir le planning des tâches</CardDescription>
                </CardHeader>
              </Card>
            </>
          )}

          {displayUser.role === "CONSULTANT" && (
            <>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Mes tâches</CardTitle>
                  <CardDescription>
                    Voir les tâches qui vous sont assignées
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Mes projets</CardTitle>
                  <CardDescription>
                    Consulter les projets auxquels vous participez
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Mon profil</CardTitle>
                  <CardDescription>
                    Modifier vos informations personnelles
                  </CardDescription>
                </CardHeader>
              </Card>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
