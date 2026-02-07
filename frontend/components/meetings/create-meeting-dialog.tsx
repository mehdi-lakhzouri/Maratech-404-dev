'use client';

/**
 * Create Meeting Dialog
 * ---------------------
 * Full-height dialog with meeting form + participant assignment panel.
 * Participants are fetched from the users API, grouped by role
 * (CHEF_PROJET / CONSULTANT), searchable, with select-all per group.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  X,
  Users,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Loader2,
  UserPlus,
  CalendarDays,
  MapPin,
  Shield,
  UserCog,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { useCreateMeeting } from '@/lib/hooks/use-meetings';
import { useUsers } from '@/lib/hooks/use-users';
import { useAuth } from '@/lib/providers/auth-provider';
import { getUsers as getChefProjetUsers } from '@/lib/api/chef-projet';
import type { UserManagement, UserRole, MeetingItem } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

interface UsersByRole {
  role: UserRole;
  roleLabel: string;
  roleIcon: React.ComponentType<{ className?: string }>;
  users: UserManagement[];
  selectedCount: number;
  totalCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const LOCATION_OPTIONS = [
  { value: 'online', label: 'En ligne (Visio)' },
  { value: 'presentiel', label: 'Présentiel' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'salle_a', label: 'Salle A' },
  { value: 'salle_b', label: 'Salle B' },
  { value: 'salle_c', label: 'Salle C' },
  { value: 'other', label: 'Autre' },
];

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  RESPONSABLE: {
    label: 'Responsables',
    icon: Shield,
    color: 'text-amber-600 bg-amber-100 border-amber-300',
  },
  CHEF_PROJET: {
    label: 'Chefs de Projet',
    icon: UserCog,
    color: 'text-blue-600 bg-blue-100 border-blue-300',
  },
  CONSULTANT: {
    label: 'Consultants',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-100 border-emerald-300',
  },
};

// ============================================================================
// Schema
// ============================================================================

const createMeetingSchema = z.object({
  subject: z
    .string()
    .min(3, 'Le sujet doit contenir au moins 3 caractères')
    .max(200),
  scheduledAt: z.string().min(1, "La date de début est requise"),
  endDate: z.string().optional(),
  location: z.string().optional(),
});

type CreateMeetingFormData = z.infer<typeof createMeetingSchema>;

// ============================================================================
// Component
// ============================================================================

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMeetingDialog({
  open,
  onOpenChange,
}: CreateMeetingDialogProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(
    new Set(['CHEF_PROJET', 'CONSULTANT']),
  );
  const [createdMeeting, setCreatedMeeting] = useState<MeetingItem | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Data fetching
  // ============================================================================

  const createMutation = useCreateMeeting();
  const { user: currentUser } = useAuth();

  // RESPONSABLE uses admin /users; CHEF_PROJET uses /chef-projet/users
  const isResponsable = currentUser?.role === 'RESPONSABLE';

  // Admin endpoint (RESPONSABLE only)
  const adminQuery = useUsers(
    { limit: 100, isActive: true },
    { enabled: isResponsable && open }
  );

  // Chef Projet endpoint (CHEF_PROJET only)
  const chefQuery = useQuery({
    queryKey: ['chef-projet-users', 'meeting-participants'],
    queryFn: () => getChefProjetUsers({ limit: 100, isActive: true }),
    enabled: !isResponsable && open,
    staleTime: 30_000,
  });

  const usersData = isResponsable ? adminQuery.data : chefQuery.data;
  const usersLoading = isResponsable ? adminQuery.isLoading : chefQuery.isLoading;

  const allUsers = useMemo(() => usersData?.users || [], [usersData]);

  // ============================================================================
  // Form
  // ============================================================================

  const form = useForm<CreateMeetingFormData>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      subject: '',
      scheduledAt: '',
      endDate: '',
      location: 'online',
    },
  });

  // ============================================================================
  // Derived State
  // ============================================================================

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const query = searchQuery.toLowerCase().trim();
    return allUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  }, [allUsers, searchQuery]);

  // Group by role
  const usersByRole = useMemo((): UsersByRole[] => {
    const roleOrder: UserRole[] = ['RESPONSABLE', 'CHEF_PROJET', 'CONSULTANT'];
    const roleMap = new Map<UserRole, UserManagement[]>();

    filteredUsers.forEach((user) => {
      if (!roleMap.has(user.role)) {
        roleMap.set(user.role, []);
      }
      roleMap.get(user.role)!.push(user);
    });

    return roleOrder
      .filter((role) => roleMap.has(role))
      .map((role) => {
        const users = roleMap.get(role)!.sort((a, b) =>
          a.fullName.localeCompare(b.fullName),
        );
        const config = ROLE_CONFIG[role];
        return {
          role,
          roleLabel: config.label,
          roleIcon: config.icon,
          users,
          selectedCount: users.filter((u) => selectedParticipants.has(u.id))
            .length,
          totalCount: users.length,
        };
      });
  }, [filteredUsers, selectedParticipants]);

  // Stats
  const stats = useMemo(
    () => ({
      totalFiltered: filteredUsers.length,
      totalSelected: selectedParticipants.size,
    }),
    [filteredUsers, selectedParticipants],
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        form.reset();
        setSelectedParticipants(new Set());
        setSearchQuery('');
        setExpandedRoles(new Set(['CHEF_PROJET', 'CONSULTANT']));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, form]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }, []);

  const toggleParticipant = useCallback(
    (userId: string, userName: string) => {
      setSelectedParticipants((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
          announce(`${userName} retiré de la sélection`);
        } else {
          next.add(userId);
          announce(`${userName} ajouté à la sélection`);
        }
        return next;
      });
    },
    [announce],
  );

  const toggleRole = useCallback(
    (group: UsersByRole) => {
      const userIds = group.users.map((u) => u.id);
      const allSelected = userIds.every((id) => selectedParticipants.has(id));

      setSelectedParticipants((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          userIds.forEach((id) => next.delete(id));
          announce(`Tous les ${group.roleLabel} retirés`);
        } else {
          userIds.forEach((id) => next.add(id));
          announce(`Tous les ${group.roleLabel} sélectionnés`);
        }
        return next;
      });
    },
    [selectedParticipants, announce],
  );

  const toggleRoleExpanded = useCallback((role: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = filteredUsers.map((u) => u.id);
    setSelectedParticipants(new Set(allIds));
    announce(`${allIds.length} participants sélectionnés`);
  }, [filteredUsers, announce]);

  const deselectAll = useCallback(() => {
    setSelectedParticipants(new Set());
    announce('Sélection vidée');
  }, [announce]);

  const handleSubmit = async (data: CreateMeetingFormData) => {
    try {
      const idempotencyKey = crypto.randomUUID();
      const createdMeetingData = await createMutation.mutateAsync({
        data: {
          subject: data.subject,
          scheduledAt: data.scheduledAt,
          endDate: data.endDate || undefined,
          location: data.location || undefined,
          participantIds: Array.from(selectedParticipants),
        },
        idempotencyKey,
      });
      setCreatedMeeting(createdMeetingData);
      toast.success('Réunion créée avec succès');
      form.reset();
      setSelectedParticipants(new Set());
      // Don't close dialog immediately - show the meeting link
    } catch {
      toast.error('Erreur lors de la création de la réunion');
    }
  };

  // ============================================================================
  // Render helpers
  // ============================================================================

  const isRoleFullySelected = (group: UsersByRole) =>
    group.users.length > 0 &&
    group.users.every((u) => selectedParticipants.has(u.id));

  const isRolePartiallySelected = (group: UsersByRole) => {
    const count = group.users.filter((u) =>
      selectedParticipants.has(u.id),
    ).length;
    return count > 0 && count < group.users.length;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl h-[85vh] max-h-[750px] flex flex-col p-0 gap-0"
        aria-describedby="create-meeting-description"
      >
        {/* Screen reader announcer */}
        <div
          ref={announcerRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* ── Header ── */}
        <DialogHeader className="px-5 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            Nouvelle réunion
          </DialogTitle>
          <DialogDescription
            id="create-meeting-description"
            className="text-sm"
          >
            Renseignez les détails et sélectionnez les participants.
          </DialogDescription>
        </DialogHeader>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Meeting Details Form — Fixed */}
          <div className="px-5 py-4 border-b bg-muted/30 shrink-0">
            <Form {...form}>
              <div className="space-y-3">
                {/* Subject */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Sujet *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sujet de la réunion"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  {/* Start Date & Time */}
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                          <CalendarDays
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Date de début *
                        </FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date & Time */}
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                          <CalendarDays
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Date de fin
                        </FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location Dropdown */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                        <MapPin
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Lieu
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un lieu" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>

          {/* ── Participant Selection ── */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Search & Actions Bar — Fixed */}
            <div className="px-5 py-3 border-b bg-background shrink-0 space-y-2">
              {/* Search Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un participant..."
                    className="pl-9 pr-8 h-9"
                    aria-label="Rechercher un participant"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
                      aria-label="Effacer la recherche"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {stats.totalFiltered} utilisateur
                  {stats.totalFiltered !== 1 ? 's' : ''}
                </span>

                <div className="flex-1" />

                {stats.totalSelected > 0 && (
                  <Badge
                    variant="secondary"
                    className="tabular-nums text-xs gap-1"
                  >
                    <UserPlus className="h-3 w-3" aria-hidden="true" />
                    {stats.totalSelected} sélectionné
                    {stats.totalSelected !== 1 ? 's' : ''}
                  </Badge>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={selectAll}
                  disabled={filteredUsers.length === 0}
                >
                  Tout sélect.
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={deselectAll}
                  disabled={selectedParticipants.size === 0}
                >
                  Désélect.
                </Button>
              </div>
            </div>

            {/* Participant List — Scrollable */}
            <ScrollArea className="flex-1 min-h-0">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Chargement des utilisateurs...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users
                    className="h-10 w-10 mb-3 opacity-30"
                    aria-hidden="true"
                  />
                  <p className="font-medium text-sm">Aucun résultat</p>
                  <p className="text-xs mt-1">
                    Essayez un autre terme de recherche.
                  </p>
                </div>
              ) : (
                <div role="listbox" aria-label="Participants par rôle">
                  {usersByRole.map((group) => {
                    const isExpanded = expandedRoles.has(group.role);
                    const fullySelected = isRoleFullySelected(group);
                    const partiallySelected = isRolePartiallySelected(group);
                    const RoleIcon = group.roleIcon;
                    const config = ROLE_CONFIG[group.role];

                    return (
                      <div key={group.role}>
                        {/* Role Header */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/60 border-b sticky top-0 z-10">
                          {/* Expand/Collapse */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => toggleRoleExpanded(group.role)}
                            aria-label={
                              isExpanded
                                ? `Réduire ${group.roleLabel}`
                                : `Développer ${group.roleLabel}`
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronRight
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            )}
                          </Button>

                          {/* Select-all checkbox */}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="shrink-0">
                                  <Checkbox
                                    checked={
                                      fullySelected
                                        ? true
                                        : partiallySelected
                                          ? 'indeterminate'
                                          : false
                                    }
                                    onCheckedChange={() => toggleRole(group)}
                                    aria-label={`Sélectionner tous les ${group.roleLabel}`}
                                    className="h-4.5 w-4.5"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>
                                  {fullySelected
                                    ? 'Désélectionner'
                                    : 'Sélectionner'}{' '}
                                  tous les {group.roleLabel}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Role Icon */}
                          <RoleIcon
                            className="h-4 w-4 text-muted-foreground shrink-0"
                            aria-hidden="true"
                          />

                          {/* Role Name */}
                          <button
                            type="button"
                            onClick={() => toggleRoleExpanded(group.role)}
                            className="flex-1 text-left font-medium text-sm truncate min-w-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
                          >
                            {group.roleLabel}
                          </button>

                          {/* Count Badge */}
                          <Badge
                            variant="secondary"
                            className="shrink-0 tabular-nums text-xs"
                          >
                            {group.selectedCount > 0 && (
                              <span className="text-primary font-semibold">
                                {group.selectedCount}/
                              </span>
                            )}
                            {group.totalCount}
                          </Badge>
                        </div>

                        {/* User Rows */}
                        {isExpanded &&
                          group.users.map((user) => {
                            const isSelected = selectedParticipants.has(
                              user.id,
                            );

                            return (
                              <div
                                key={user.id}
                                className={cn(
                                  'flex items-center gap-3 px-4 py-2.5 border-b transition-colors',
                                  'hover:bg-accent/50 cursor-pointer',
                                  isSelected &&
                                    'bg-primary/5 border-l-2 border-l-primary',
                                )}
                                onClick={() =>
                                  toggleParticipant(user.id, user.fullName)
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === 'Enter' ||
                                    e.key === ' '
                                  ) {
                                    e.preventDefault();
                                    toggleParticipant(
                                      user.id,
                                      user.fullName,
                                    );
                                  }
                                }}
                                role="option"
                                aria-selected={isSelected}
                                tabIndex={0}
                              >
                                {/* Checkbox */}
                                <div className="shrink-0 ml-7">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      toggleParticipant(
                                        user.id,
                                        user.fullName,
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Sélectionner ${user.fullName}`}
                                    className="h-4.5 w-4.5"
                                  />
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                      {user.fullName}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-[10px] shrink-0 px-1.5 py-0',
                                        config.color,
                                      )}
                                    >
                                      {user.role === 'CHEF_PROJET'
                                        ? 'Chef'
                                        : user.role === 'CONSULTANT'
                                          ? 'Consultant'
                                          : 'Resp.'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                  </p>
                                </div>

                                {/* Selection indicator */}
                                <div className="shrink-0">
                                  {isSelected ? (
                                    <CheckCircle2
                                      className="h-5 w-5 text-primary"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Circle
                                      className="h-5 w-5 text-muted-foreground/30"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* ── Success Message with Meeting Link ── */}
        {createdMeeting && (
          <div className="px-5 py-4 border-t bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Réunion créée avec succès !
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Voici le lien de la réunion vidéo généré automatiquement :
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-md border border-green-200 dark:border-green-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                      {createdMeeting.meetingLink}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(createdMeeting.meetingLink!);
                      toast.success('Lien copié dans le presse-papiers');
                    }}
                    className="shrink-0"
                  >
                    Copier
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => window.open(createdMeeting.meetingLink, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Ouvrir la réunion
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCreatedMeeting(null);
                      onOpenChange(false);
                    }}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!createdMeeting && (
          <DialogFooter className="px-5 py-3 border-t bg-muted/30 shrink-0">
          <div className="flex flex-col sm:flex-row w-full gap-3 sm:items-center">
            {/* Summary */}
            <div className="flex-1 text-xs">
              {stats.totalSelected > 0 && (
                <span className="text-muted-foreground">
                  <strong className="text-foreground">
                    {stats.totalSelected}
                  </strong>{' '}
                  participant{stats.totalSelected !== 1 ? 's' : ''} sélectionné
                  {stats.totalSelected !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Création...
                  </>
                ) : (
                  <>
                    <CalendarDays
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    Créer la réunion
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
