'use client';

/**
 * User Details Dialog
 * -------------------
 * Modal for viewing detailed user information.
 */

import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import type { UserManagement, UserRole } from '@/lib/api/types';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserManagement | null;
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

function formatDate(dateString?: string): string {
  if (!dateString) return 'Jamais';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return 'Jamais';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  }
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  
  return formatDate(dateString);
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
}: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>{user.fullName}</span>
              <DialogDescription className="text-left">{user.email}</DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Role */}
          <div className="flex items-center gap-3">
            <Badge variant={user.isActive ? 'default' : 'secondary'} className="gap-1">
              {user.isActive ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {user.isActive ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge className={cn('font-normal', ROLE_COLORS[user.role])}>
              <Shield className="h-3 w-3 mr-1" />
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid gap-4">
            <DetailItem
              icon={User}
              label="Nom complet"
              value={user.fullName}
            />
            <DetailItem
              icon={Mail}
              label="Adresse email"
              value={user.email}
            />
            <DetailItem
              icon={Shield}
              label="Rôle"
              value={ROLE_LABELS[user.role]}
            />
            <DetailItem
              icon={Calendar}
              label="Date de création"
              value={formatDate(user.createdAt)}
              subValue={formatRelativeDate(user.createdAt)}
            />
            <DetailItem
              icon={Clock}
              label="Dernière connexion"
              value={user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jamais connecté'}
              subValue={user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : undefined}
            />
            <DetailItem
              icon={Calendar}
              label="Dernière modification"
              value={formatDate(user.updatedAt)}
              subValue={formatRelativeDate(user.updatedAt)}
            />
          </div>

          <Separator />

          {/* ID */}
          <div className="text-xs text-muted-foreground">
            ID: <code className="bg-muted px-1 py-0.5 rounded">{user.id}</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DetailItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
}

function DetailItem({ icon: Icon, label, value, subValue }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-muted flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}
