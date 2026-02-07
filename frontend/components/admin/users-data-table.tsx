'use client';

/**
 * Users Data Table
 * ----------------
 * Production-ready data table with:
 * - Pagination
 * - Sorting
 * - Filtering
 * - Bulk selection
 * - Actions (view, edit, delete, activate/deactivate, change password)
 */

import { useState, useCallback } from 'react';
import {
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Search,
  UserPlus,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Pencil,
  Key,
  AlertTriangle,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { UserManagement, UserRole, UsersQueryParams } from '@/lib/api/types';

interface UsersDataTableProps {
  users: UserManagement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  filters: UsersQueryParams;
  onFiltersChange: (filters: UsersQueryParams) => void;
  onView: (user: UserManagement) => void;
  onEdit: (user: UserManagement) => void;
  onDelete: (userId: string) => void;
  onHardDelete: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onChangePassword: (user: UserManagement) => void;
  onBulkDelete: (userIds: string[]) => void;
  onBulkHardDelete: (userIds: string[]) => void;
  onBulkActivate: (userIds: string[]) => void;
  onBulkDeactivate: (userIds: string[]) => void;
  onBulkChangeRole: (userIds: string[], role: UserRole) => void;
  onCreate: () => void;
  actionLoadingId?: string | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  RESPONSABLE: 'Responsable',
  CHEF_PROJET: 'Chef de Projet',
  CONSULTANT: 'Consultant',
};

const ROLE_COLORS: Record<UserRole, string> = {
  RESPONSABLE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  CHEF_PROJET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  CONSULTANT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

export function UsersDataTable({
  users,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  filters,
  onFiltersChange,
  onView,
  onEdit,
  onDelete,
  onHardDelete,
  onActivate,
  onDeactivate,
  onChangePassword,
  onBulkDelete,
  onBulkHardDelete,
  onBulkActivate,
  onBulkDeactivate,
  onBulkChangeRole,
  onCreate,
  actionLoadingId,
}: UsersDataTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hardDeleteConfirmId, setHardDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkHardDeleteConfirm, setBulkHardDeleteConfirm] = useState(false);
  const [activateConfirmId, setActivateConfirmId] = useState<string | null>(null);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);

  // Check if all visible items are selected
  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const someSelected = users.some((u) => selectedIds.has(u.id)) && !allSelected;

  // Toggle all selection
  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  }, [allSelected, users]);

  // Toggle single selection
  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle search with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    onFiltersChange({ ...filters, search: searchValue, page: 1 });
  }, [filters, onFiltersChange, searchValue]);

  // Handle sort
  const handleSort = useCallback((field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ ...filters, sortBy: field, sortOrder: newOrder });
  }, [filters, onFiltersChange]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  }, [filters, onFiltersChange]);

  // Clear selection after bulk action
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk actions
  const handleBulkDelete = useCallback(() => {
    onBulkDelete(Array.from(selectedIds));
    clearSelection();
    setBulkDeleteConfirm(false);
  }, [selectedIds, onBulkDelete, clearSelection]);

  const handleBulkHardDelete = useCallback(() => {
    onBulkHardDelete(Array.from(selectedIds));
    clearSelection();
    setBulkHardDeleteConfirm(false);
  }, [selectedIds, onBulkHardDelete, clearSelection]);

  const handleBulkActivate = useCallback(() => {
    onBulkActivate(Array.from(selectedIds));
    clearSelection();
  }, [selectedIds, onBulkActivate, clearSelection]);

  const handleBulkDeactivate = useCallback(() => {
    onBulkDeactivate(Array.from(selectedIds));
    clearSelection();
  }, [selectedIds, onBulkDeactivate, clearSelection]);

  const handleBulkChangeRole = useCallback((role: UserRole) => {
    onBulkChangeRole(Array.from(selectedIds), role);
    clearSelection();
  }, [selectedIds, onBulkChangeRole, clearSelection]);

  // Single actions with confirmation
  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, onDelete]);

  const handleConfirmHardDelete = useCallback(() => {
    if (hardDeleteConfirmId) {
      onHardDelete(hardDeleteConfirmId);
      setHardDeleteConfirmId(null);
    }
  }, [hardDeleteConfirmId, onHardDelete]);

  const handleConfirmActivate = useCallback(() => {
    if (activateConfirmId) {
      onActivate(activateConfirmId);
      setActivateConfirmId(null);
    }
  }, [activateConfirmId, onActivate]);

  const handleConfirmDeactivate = useCallback(() => {
    if (deactivateConfirmId) {
      onDeactivate(deactivateConfirmId);
      setDeactivateConfirmId(null);
    }
  }, [deactivateConfirmId, onDeactivate]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Render sort indicator
  const renderSortIndicator = useCallback((field: string) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
  }, [filters.sortBy, filters.sortOrder]);

  return (
    <div className="space-y-4">
      {/* White Container Card */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Header + Search + Create inside the card */}
        <div className="p-6 pb-4 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Tous les Utilisateurs</h2>
              <p className="text-sm text-muted-foreground">
                {total} utilisateur{total > 1 ? 's' : ''} au total
              </p>
            </div>
            <Button onClick={onCreate}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Afficher</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => onFiltersChange({ ...filters, limit: Number(value), page: 1 })}
              >
                <SelectTrigger className="w-17.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs for Role/Status filtering */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Role Tabs */}
            <Tabs
              value={filters.role || 'all'}
              onValueChange={(value) => {
                const role = value === 'all' ? undefined : (value as UserRole);
                onFiltersChange({ ...filters, role, page: 1 });
              }}
            >
              <TabsList>
                <TabsTrigger value="all" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Tous
                </TabsTrigger>
                <TabsTrigger value="RESPONSABLE" className="gap-1.5">
                  Responsable
                </TabsTrigger>
                <TabsTrigger value="CHEF_PROJET" className="gap-1.5">
                  Chef de Projet
                </TabsTrigger>
                <TabsTrigger value="CONSULTANT" className="gap-1.5">
                  Consultant
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status Tabs */}
            <Tabs
              value={filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => {
                const isActive = value === 'all' ? undefined : value === 'active';
                onFiltersChange({ ...filters, isActive, page: 1 });
              }}
            >
              <TabsList>
                <TabsTrigger value="all">Tous statuts</TabsTrigger>
                <TabsTrigger value="active" className="gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Actifs
                </TabsTrigger>
                <TabsTrigger value="inactive" className="gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Inactifs
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} sélectionné(s)
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Actions groupées
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBulkActivate}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkDeactivate}>
                      <UserX className="h-4 w-4 mr-2" />
                      Désactiver
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkChangeRole('RESPONSABLE')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Responsable
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkChangeRole('CHEF_PROJET')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Chef de Projet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkChangeRole('CONSULTANT')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Consultant
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setBulkDeleteConfirm(true)}
                      className="text-orange-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Désactiver (soft delete)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setBulkHardDeleteConfirm(true)}
                      className="text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Sélectionner tout"
                    className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('fullName')}
                >
                  Nom complet
                  {renderSortIndicator('fullName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('email')}
                >
                  Email
                  {renderSortIndicator('email')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('role')}
                >
                  Rôle
                  {renderSortIndicator('role')}
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  Créé le
                  {renderSortIndicator('createdAt')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('lastLoginAt')}
                >
                  Dernière connexion
                  {renderSortIndicator('lastLoginAt')}
                </TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={() => toggleOne(user.id)}
                        aria-label={`Sélectionner ${user.fullName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', ROLE_COLORS[user.role])}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={actionLoadingId === user.id}
                          >
                            {actionLoadingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onView(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onChangePassword(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Changer le mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.isActive ? (
                            <DropdownMenuItem onClick={() => setDeactivateConfirmId(user.id)}>
                              <UserX className="h-4 w-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setActivateConfirmId(user.id)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirmId(user.id)}
                            className="text-orange-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Désactiver (soft delete)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setHardDeleteConfirmId(user.id)}
                            className="text-destructive"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Supprimer définitivement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Centered Pagination */}
        <div className="flex items-center justify-center py-4 px-6 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={page <= 1}
              title="Première page"
            >
              <span className="text-lg">«</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              title="Précédent"
            >
              <span className="text-lg">‹</span>
            </Button>
            <span className="text-sm px-3">
              Page {page} sur {totalPages || 1}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              title="Suivant"
            >
              <span className="text-lg">›</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages}
              title="Dernière page"
            >
              <span className="text-lg">»</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Single Delete Confirmation (Soft) */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver l&apos;utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utilisateur sera désactivé et ne pourra plus se connecter. 
              Vous pourrez le réactiver ultérieurement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Hard Delete Confirmation */}
      <AlertDialog open={!!hardDeleteConfirmId} onOpenChange={() => setHardDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Suppression définitive
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-destructive">Attention !</span> Cette action est 
              <span className="font-semibold"> irréversible</span>. Toutes les données de l&apos;utilisateur 
              seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation */}
      <AlertDialog open={!!activateConfirmId} onOpenChange={() => setActivateConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer l&apos;utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utilisateur pourra de nouveau se connecter à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivate}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Activer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateConfirmId} onOpenChange={() => setDeactivateConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver l&apos;utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utilisateur ne pourra plus se connecter à la plateforme tant qu&apos;il n&apos;est pas réactivé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation (Soft) */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver {selectedIds.size} utilisateur(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Les utilisateurs sélectionnés seront désactivés et ne pourront plus se connecter.
              Vous pourrez les réactiver ultérieurement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Désactiver {selectedIds.size} utilisateur(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Hard Delete Confirmation */}
      <AlertDialog open={bulkHardDeleteConfirm} onOpenChange={setBulkHardDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Suppression définitive de {selectedIds.size} utilisateur(s)
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-destructive">Attention !</span> Cette action est 
              <span className="font-semibold"> irréversible</span>. Toutes les données des utilisateurs 
              sélectionnés seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement {selectedIds.size} utilisateur(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
