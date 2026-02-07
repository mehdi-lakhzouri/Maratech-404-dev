'use client';

/**
 * User Stats Cards
 * ----------------
 * Dashboard cards showing user statistics.
 */

import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserStats } from '@/lib/api/types';

interface UserStatsCardsProps {
  stats?: UserStats;
  isLoading: boolean;
}

export function UserStatsCards({ stats, isLoading }: UserStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Utilisateurs',
      value: stats?.totalUsers || 0,
      description: 'Utilisateurs enregistrés',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats?.activeUsers || 0,
      description: `${stats?.totalUsers ? Math.round(((stats.activeUsers || 0) / stats.totalUsers) * 100) : 0}% du total`,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Utilisateurs Inactifs',
      value: stats?.inactiveUsers || 0,
      description: 'Comptes désactivés',
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      title: 'Nouveaux (30j)',
      value: stats?.recentSignups || 0,
      description: 'Inscrits ce mois',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Role Distribution Card
 */
interface RoleDistributionCardProps {
  stats?: UserStats;
  isLoading: boolean;
}

export function RoleDistributionCard({ stats, isLoading }: RoleDistributionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const roles = [
    { key: 'RESPONSABLE', label: 'Responsable', color: 'bg-purple-500' },
    { key: 'CHEF_PROJET', label: 'Chef de Projet', color: 'bg-blue-500' },
    { key: 'CONSULTANT', label: 'Consultant', color: 'bg-green-500' },
  ];

  const total = stats?.totalUsers || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribution par rôle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => {
            const count = stats?.byRole?.[role.key as keyof typeof stats.byRole] || 0;
            const percentage = Math.round((count / total) * 100);
            return (
              <div key={role.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{role.label}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${role.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
