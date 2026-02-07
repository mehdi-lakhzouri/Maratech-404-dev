'use client';

/**
 * Admin Users Page
 * ----------------
 * Production-ready user management page with:
 * - User statistics cards
 * - Full-width data table with filters, sort, pagination
 * - Bulk operations
 * - Create/Edit sheet with status toggle
 * - Password change sheet with strength indicator
 * - User details sheet with quick actions
 * - Vertical three-dot actions menu
 * 
 * All modals converted to modern Sheet components for better UX
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { UserStatsCards } from '@/components/admin/user-stats-cards';
import { UsersDataTable } from '@/components/admin/users-data-table';
import { UserFormSheet } from '@/components/admin/user-form-sheet';
import { ChangePasswordSheet } from '@/components/admin/change-password-sheet';
import { UserDetailsSheet } from '@/components/admin/user-details-sheet';

import {
  useUsers,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useHardDeleteUser,
  useActivateUser,
  useDeactivateUser,
  useChangeUserPassword,
  useBulkDeleteUsers,
  useBulkHardDeleteUsers,
  useBulkUpdateStatus,
  useBulkUpdateRole,
} from '@/lib/hooks/use-users';

import type { UserManagement, UserRole, UsersQueryParams } from '@/lib/api/types';

export default function AdminUsersPage() {
  // State
  const [filters, setFilters] = useState<UsersQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserManagement | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserManagement | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Queries
  const { data: usersData, isLoading: usersLoading } = useUsers(filters);
  const { data: stats, isLoading: statsLoading } = useUserStats();

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const hardDeleteUser = useHardDeleteUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const changePassword = useChangeUserPassword();
  const bulkDelete = useBulkDeleteUsers();
  const bulkHardDelete = useBulkHardDeleteUsers();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkUpdateRole = useBulkUpdateRole();

  // Handlers
  const handleFiltersChange = useCallback((newFilters: UsersQueryParams) => {
    setFilters(newFilters);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingUser(null);
    setFormOpen(true);
  }, []);

  const handleView = useCallback((user: UserManagement) => {
    setViewingUser(user);
    setDetailsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((user: UserManagement) => {
    setEditingUser(user);
    setFormOpen(true);
  }, []);

  const handleChangePassword = useCallback((user: UserManagement) => {
    setPasswordUser(user);
    setPasswordDialogOpen(true);
  }, []);

  const handlePasswordSubmit = useCallback(async (userId: string, newPassword: string) => {
    try {
      await changePassword.mutateAsync({ id: userId, data: { newPassword } });
      toast.success('Mot de passe modifié avec succès');
      setPasswordDialogOpen(false);
      setPasswordUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de modifier le mot de passe');
    }
  }, [changePassword]);

  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, data });
        toast.success('Utilisateur modifié avec succès');
      } else {
        await createUser.mutateAsync(data);
        toast.success('Utilisateur créé avec succès');
      }
      setFormOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    }
  }, [editingUser, createUser, updateUser]);

  const handleDelete = useCallback(async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await deleteUser.mutateAsync(userId);
      toast.success('Utilisateur désactivé');
    } catch (error: any) {
      toast.error(error.message || 'Impossible de désactiver l\'utilisateur');
    } finally {
      setActionLoadingId(null);
    }
  }, [deleteUser]);

  const handleHardDelete = useCallback(async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await hardDeleteUser.mutateAsync(userId);
      toast.success('Utilisateur supprimé définitivement');
    } catch (error: any) {
      toast.error(error.message || 'Impossible de supprimer l\'utilisateur');
    } finally {
      setActionLoadingId(null);
    }
  }, [hardDeleteUser]);

  const handleActivate = useCallback(async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await activateUser.mutateAsync(userId);
      toast.success('Utilisateur activé');
    } catch (error: any) {
      toast.error(error.message || 'Impossible d\'activer l\'utilisateur');
    } finally {
      setActionLoadingId(null);
    }
  }, [activateUser]);

  const handleDeactivate = useCallback(async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await deactivateUser.mutateAsync(userId);
      toast.success('Utilisateur désactivé');
    } catch (error: any) {
      toast.error(error.message || 'Impossible de désactiver l\'utilisateur');
    } finally {
      setActionLoadingId(null);
    }
  }, [deactivateUser]);

  const handleBulkDelete = useCallback(async (userIds: string[]) => {
    try {
      await bulkDelete.mutateAsync({ userIds });
      toast.success(`${userIds.length} utilisateur(s) désactivé(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de désactiver les utilisateurs');
    }
  }, [bulkDelete]);

  const handleBulkHardDelete = useCallback(async (userIds: string[]) => {
    try {
      await bulkHardDelete.mutateAsync({ userIds });
      toast.success(`${userIds.length} utilisateur(s) supprimé(s) définitivement`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de supprimer les utilisateurs');
    }
  }, [bulkHardDelete]);

  const handleBulkActivate = useCallback(async (userIds: string[]) => {
    try {
      await bulkUpdateStatus.mutateAsync({ userIds, isActive: true });
      toast.success(`${userIds.length} utilisateur(s) activé(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible d\'activer les utilisateurs');
    }
  }, [bulkUpdateStatus]);

  const handleBulkDeactivate = useCallback(async (userIds: string[]) => {
    try {
      await bulkUpdateStatus.mutateAsync({ userIds, isActive: false });
      toast.success(`${userIds.length} utilisateur(s) désactivé(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de désactiver les utilisateurs');
    }
  }, [bulkUpdateStatus]);

  const handleBulkChangeRole = useCallback(async (userIds: string[], role: UserRole) => {
    try {
      await bulkUpdateRole.mutateAsync({ userIds, role });
      toast.success(`Rôle mis à jour pour ${userIds.length} utilisateur(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de modifier le rôle');
    }
  }, [bulkUpdateRole]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs, leurs rôles et leurs accès à la plateforme.
        </p>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={stats} isLoading={statsLoading} />

      {/* Users Table */}
      <UsersDataTable
        users={usersData?.users || []}
        total={usersData?.meta?.total || 0}
        page={usersData?.meta?.page || 1}
        limit={usersData?.meta?.limit || 10}
        totalPages={usersData?.meta?.totalPages || 1}
        isLoading={usersLoading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onHardDelete={handleHardDelete}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onChangePassword={handleChangePassword}
        onBulkDelete={handleBulkDelete}
        onBulkHardDelete={handleBulkHardDelete}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkChangeRole={handleBulkChangeRole}
        onCreate={handleCreate}
        actionLoadingId={actionLoadingId}
      />

      {/* User Form Sheet */}
      <UserFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSubmit={handleFormSubmit}
        isPending={createUser.isPending || updateUser.isPending}
      />

      {/* Change Password Sheet */}
      <ChangePasswordSheet
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        user={passwordUser}
        onSubmit={handlePasswordSubmit}
        isPending={changePassword.isPending}
      />

      {/* User Details Sheet */}
      <UserDetailsSheet
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        user={viewingUser}
        onEdit={() => {
          if (viewingUser) {
            setDetailsDialogOpen(false);
            handleEdit(viewingUser);
          }
        }}
        onChangePassword={() => {
          if (viewingUser) {
            setDetailsDialogOpen(false);
            handleChangePassword(viewingUser);
          }
        }}
        onToggleStatus={() => {
          if (viewingUser) {
            setDetailsDialogOpen(false);
            if (viewingUser.isActive) {
              handleDeactivate(viewingUser.id);
            } else {
              handleActivate(viewingUser.id);
            }
          }
        }}
      />
    </div>
  );
}
