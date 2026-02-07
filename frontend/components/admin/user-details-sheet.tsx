'use client';

/**
 * User Details Sheet
 * ------------------
 * Modern, accessible side sheet for viewing user information.
 * Features: Color indicators, proper ARIA labels, visual hierarchy.
 */

import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Hash,
  Pencil,
  Key,
  Ban,
  UserCheck,
  Activity,
  ArrowLeft,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { UserManagement, UserRole } from '@/lib/api/types';

// =============================================================================
// Types & Constants
// =============================================================================

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserManagement | null;
  isLoading?: boolean;
  onEdit?: () => void;
  onChangePassword?: () => void;
  onToggleStatus?: () => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  RESPONSABLE: { 
    label: 'Responsable', 
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
  },
  CHEF_PROJET: { 
    label: 'Chef de Projet', 
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
  },
  CONSULTANT: { 
    label: 'Consultant', 
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
  },
};

const STATUS_CONFIG = {
  active: {
    label: 'Actif',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-500',
    dotColor: 'bg-emerald-500',
  },
  inactive: {
    label: 'Inactif',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    borderColor: 'border-red-500',
    dotColor: 'bg-red-500',
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString?: string): string {
  if (!dateString) return 'Non disponible';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffMinutes} minutes`;
    }
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  }
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(diffDays / 30);
  return `Il y a ${months} mois`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// =============================================================================
// Main Component
// =============================================================================

export function UserDetailsSheet({
  open,
  onOpenChange,
  user,
  isLoading = false,
  onEdit,
  onChangePassword,
  onToggleStatus,
}: UserDetailsSheetProps) {
  const statusConfig = user?.isActive ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
  const roleConfig = user ? ROLE_CONFIG[user.role] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-lg overflow-y-auto p-0"
        aria-label={user ? `Détails de l'utilisateur ${user.fullName}` : 'Détails utilisateur'}
      >
        {isLoading ? (
          <UserDetailsSheetSkeleton />
        ) : !user ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col h-full">
            {/* Header with Gradient Background */}
            <header 
              className={cn(
                'relative px-6 pt-6 pb-20',
                user.isActive 
                  ? 'bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
                  : 'bg-linear-to-br from-red-500/10 via-red-500/5 to-transparent'
              )}
            >
              {/* Status Indicator Bar */}
              <div 
                className={cn(
                  'absolute top-0 left-0 right-0 h-1',
                  user.isActive ? 'bg-emerald-500' : 'bg-red-500'
                )}
                role="presentation"
                aria-hidden="true"
              />

              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mb-2 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Retour
              </Button>

              <SheetHeader className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* Avatar with Status Ring */}
                  <div className="relative">
                    <Avatar className={cn(
                      'h-20 w-20 ring-4 ring-offset-2 ring-offset-background',
                      user.isActive ? 'ring-emerald-500/30' : 'ring-red-500/30'
                    )}>
                      <AvatarImage src={undefined} alt={`Photo de ${user.fullName}`} />
                      <AvatarFallback 
                        className={cn(
                          'text-xl font-semibold',
                          user.isActive 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        )}
                      >
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online Status Dot */}
                    <span 
                      className={cn(
                        'absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background',
                        statusConfig.dotColor
                      )}
                      aria-label={statusConfig.label}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0 pt-1">
                    <SheetTitle className="text-2xl font-bold tracking-tight">
                      {user.fullName}
                    </SheetTitle>
                    <SheetDescription className="mt-1 flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{user.email}</span>
                    </SheetDescription>
                  </div>
                </div>

                {/* Status & Role Badges */}
                <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Statut et rôle">
                  {/* Status Badge */}
                  <Badge 
                    variant="outline"
                    className={cn(
                      'gap-1.5 px-3 py-1 font-medium border-2 transition-colors',
                      statusConfig.bgColor,
                      statusConfig.color,
                      statusConfig.borderColor
                    )}
                    role="listitem"
                  >
                    <span 
                      className={cn('h-2 w-2 rounded-full animate-pulse', statusConfig.dotColor)} 
                      aria-hidden="true" 
                    />
                    {statusConfig.label}
                  </Badge>

                  {/* Role Badge */}
                  {roleConfig && (
                    <Badge 
                      variant="outline"
                      className={cn(
                        'gap-1.5 px-3 py-1 font-medium border transition-colors',
                        roleConfig.bgColor,
                        roleConfig.color
                      )}
                      role="listitem"
                    >
                      <Shield className="h-3 w-3" aria-hidden="true" />
                      {roleConfig.label}
                    </Badge>
                  )}
                </div>
              </SheetHeader>
            </header>

            {/* Quick Actions */}
            <nav 
              className="px-6 -mt-8 relative z-10"
              aria-label="Actions rapides"
            >
              <div className="flex flex-wrap gap-2 p-3 bg-background rounded-xl border shadow-sm">
                {onEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onEdit}
                    className="flex-1 min-w-25 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Modifier
                  </Button>
                )}
                {onChangePassword && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onChangePassword}
                    className="flex-1 min-w-25 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950 dark:hover:text-amber-300"
                  >
                    <Key className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Mot de passe
                  </Button>
                )}
                {onToggleStatus && (
                  <Button
                    variant={user.isActive ? 'outline' : 'default'}
                    size="sm"
                    onClick={onToggleStatus}
                    className={cn(
                      'flex-1 min-w-25',
                      user.isActive 
                        ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-300'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                  >
                    {user.isActive ? (
                      <>
                        <Ban className="h-4 w-4 mr-1.5" aria-hidden="true" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1.5" aria-hidden="true" />
                        Activer
                      </>
                    )}
                  </Button>
                )}
              </div>
            </nav>

            {/* Details Section */}
            <main className="flex-1 px-6 py-6 space-y-6">
              {/* Basic Information */}
              <section aria-labelledby="info-title">
                <h3 id="info-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Informations
                </h3>
                <div className="space-y-2">
                  <InfoCard
                    icon={Hash}
                    label="Identifiant"
                    value={user.id}
                    valueClassName="font-mono text-xs"
                    accentColor="bg-slate-500"
                  />
                  <InfoCard
                    icon={User}
                    label="Nom complet"
                    value={user.fullName}
                    accentColor="bg-indigo-500"
                  />
                  <InfoCard
                    icon={Mail}
                    label="Email"
                    value={user.email}
                    accentColor="bg-sky-500"
                  />
                  <InfoCard
                    icon={Shield}
                    label="Rôle"
                    value={roleConfig?.label || user.role}
                    accentColor="bg-purple-500"
                  />
                </div>
              </section>

              <Separator />

              {/* Activity Section */}
              <section aria-labelledby="activity-title">
                <h3 id="activity-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  Activité
                </h3>
                <div className="space-y-2">
                  <InfoCard
                    icon={Calendar}
                    label="Créé le"
                    value={formatDate(user.createdAt)}
                    subValue={formatRelativeDate(user.createdAt)}
                    accentColor="bg-emerald-500"
                  />
                  <InfoCard
                    icon={Clock}
                    label="Dernière modification"
                    value={formatDate(user.updatedAt)}
                    subValue={formatRelativeDate(user.updatedAt)}
                    accentColor="bg-amber-500"
                  />
                  <InfoCard
                    icon={user.isActive ? CheckCircle2 : XCircle}
                    label="Statut"
                    value={user.isActive ? 'Compte actif' : 'Compte désactivé'}
                    valueClassName={user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                    accentColor={user.isActive ? 'bg-emerald-500' : 'bg-red-500'}
                  />
                </div>
              </section>
            </main>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  valueClassName?: string;
  accentColor?: string;
}

function InfoCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  valueClassName,
  accentColor = 'bg-primary'
}: InfoCardProps) {
  return (
    <div 
      className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors overflow-hidden"
      role="article"
      aria-label={`${label}: ${value}`}
    >
      {/* Accent Bar */}
      <div 
        className={cn('absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5', accentColor)} 
        aria-hidden="true"
      />
      
      {/* Icon */}
      <div className={cn(
        'shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ml-2',
        'bg-muted/50 group-hover:bg-muted transition-colors'
      )}>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className={cn('text-sm font-semibold truncate mt-0.5', valueClassName)}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <User className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-lg font-medium">Aucun utilisateur</p>
      <p className="text-sm text-muted-foreground mt-1">
        Sélectionnez un utilisateur pour voir ses détails
      </p>
    </div>
  );
}

function UserDetailsSheetSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Badge Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      {/* Actions Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>

      <Skeleton className="h-px w-full" />

      {/* Info Cards Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-px w-full" />

      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default UserDetailsSheet;
