'use client';

/**
 * Team Management Page (Chef Projet)
 * -----------------------------------
 * Page for Chef de Projet to manage their team.
 * - View all users (read-only)
 * - Add consultants (single and bulk)
 */

import { useState, useCallback } from 'react';
import { Users, UserPlus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Using Button for pagination (matching admin style)

import { AddConsultantDialog } from '@/components/chef-projet/add-consultant-dialog';
import { BulkAddConsultantsDialog } from '@/components/chef-projet/bulk-add-consultants-dialog';

import { useChefProjetUsers, useChefProjetUserStats } from '@/lib/hooks/use-chef-projet';
import type { UserRole, UsersQueryParams } from '@/lib/api/types';

const ROLE_LABELS: Record<UserRole, string> = {
  RESPONSABLE: 'Responsable',
  CHEF_PROJET: 'Chef de Projet',
  CONSULTANT: 'Consultant',
};

const ROLE_COLORS: Record<UserRole, string> = {
  RESPONSABLE: 'bg-purple-100 text-purple-800',
  CHEF_PROJET: 'bg-blue-100 text-blue-800',
  CONSULTANT: 'bg-green-100 text-green-800',
};

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [page, setPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const params: UsersQueryParams = {
    search: search || undefined,
    role: roleFilter,
    page,
    limit: 10,
  };

  const { data, isLoading } = useChefProjetUsers(params);
  const { data: stats } = useChefProjetUserStats();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value === 'all' ? undefined : (value as UserRole));
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion d&apos;Équipe</h1>
          <p className="text-muted-foreground mt-1">
            Visualisez les utilisateurs et ajoutez des consultants
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter Consultant
          </Button>
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import en masse
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responsables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byRole?.RESPONSABLE || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chefs de Projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byRole?.CHEF_PROJET || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byRole?.CONSULTANT || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>Liste des utilisateurs de la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={roleFilter || 'all'} onValueChange={handleRoleChange}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="RESPONSABLE">Responsable</SelectItem>
                <SelectItem value="CHEF_PROJET">Chef de Projet</SelectItem>
                <SelectItem value="CONSULTANT">Consultant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-4 px-6">Nom</TableHead>
                      <TableHead className="py-4 px-6">Email</TableHead>
                      <TableHead className="py-4 px-6">Rôle</TableHead>
                      <TableHead className="py-4 px-6">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users && data.users.length > 0 ? (
                      data.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium py-4 px-6">{user.fullName}</TableCell>
                          <TableCell className="py-4 px-6">{user.email}</TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge className={ROLE_COLORS[user.role]}>
                              {ROLE_LABELS[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Aucun utilisateur trouvé.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data?.meta && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-center py-4 px-6 border-t mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPage(1)}
                      disabled={page <= 1}
                      title="Première page"
                    >
                      <span className="text-lg">«</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      title="Précédent"
                    >
                      <span className="text-lg">‹</span>
                    </Button>
                    <span className="text-sm px-3">
                      Page {page} sur {data.meta.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                      disabled={page >= data.meta.totalPages}
                      title="Suivant"
                    >
                      <span className="text-lg">›</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPage(data.meta.totalPages)}
                      disabled={page >= data.meta.totalPages}
                      title="Dernière page"
                    >
                      <span className="text-lg">»</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddConsultantDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <BulkAddConsultantsDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} />
    </div>
  );
}
