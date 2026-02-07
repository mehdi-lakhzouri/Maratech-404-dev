'use client';

/**
 * User Form Sheet
 * ---------------
 * Modern, accessible side sheet for creating and editing users.
 * Features: Color indicators, proper ARIA labels, visual hierarchy.
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  UserPlus, 
  Pencil, 
  User, 
  Mail, 
  Shield, 
  Lock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import type { UserManagement, UserRole } from '@/lib/api/types';

// =============================================================================
// Schema & Types
// =============================================================================

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Veuillez entrer une adresse email valide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['RESPONSABLE', 'CHEF_PROJET', 'CONSULTANT'] as const),
  isActive: z.boolean(),
});

const editUserSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Veuillez entrer une adresse email valide'),
  role: z.enum(['RESPONSABLE', 'CHEF_PROJET', 'CONSULTANT'] as const),
  isActive: z.boolean(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type EditFormData = z.infer<typeof editUserSchema>;

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserManagement | null;
  onSubmit: (data: CreateFormData | EditFormData) => void;
  isPending: boolean;
}

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
  { value: 'RESPONSABLE', label: 'Responsable', color: 'text-purple-600' },
  { value: 'CHEF_PROJET', label: 'Chef de Projet', color: 'text-blue-600' },
  { value: 'CONSULTANT', label: 'Consultant', color: 'text-emerald-600' },
];

// =============================================================================
// Helper Functions
// =============================================================================

function getInitials(name: string): string {
  if (!name) return '??';
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

export function UserFormSheet({
  open,
  onOpenChange,
  user,
  onSubmit,
  isPending,
}: UserFormSheetProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!user;

  const form = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEditing ? editUserSchema : createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      ...(isEditing ? {} : { password: '' }),
      role: 'CONSULTANT' as UserRole,
      isActive: true,
    },
  });

  const watchedName = useWatch({
    control: form.control,
    name: 'fullName',
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      form.reset({
        fullName: '',
        email: '',
        password: '',
        role: 'CONSULTANT',
        isActive: true,
      });
    }
  }, [user, form]);

  const handleSubmit = (data: CreateFormData | EditFormData) => {
    onSubmit(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-lg overflow-y-auto p-0"
        aria-label={isEditing ? `Modifier l'utilisateur ${user?.fullName}` : 'Créer un utilisateur'}
      >
        <div className="flex flex-col h-full">
          {/* Header with Gradient Background */}
          <header 
            className={cn(
              'relative px-6 pt-6 pb-16',
              isEditing
                ? 'bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent'
                : 'bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
            )}
          >
            {/* Status Indicator Bar */}
            <div 
              className={cn(
                'absolute top-0 left-0 right-0 h-1',
                isEditing ? 'bg-blue-500' : 'bg-emerald-500'
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
                {/* Avatar Preview */}
                <div className="relative">
                  <Avatar className={cn(
                    'h-20 w-20 ring-4 ring-offset-2 ring-offset-background',
                    isEditing ? 'ring-blue-500/30' : 'ring-emerald-500/30'
                  )}>
                    <AvatarFallback 
                      className={cn(
                        'text-xl font-semibold',
                        isEditing 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      )}
                    >
                      {getInitials(watchedName || (isEditing ? user?.fullName || '' : ''))}
                    </AvatarFallback>
                  </Avatar>
                  {/* Action Badge */}
                  <span 
                    className={cn(
                      'absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-background flex items-center justify-center',
                      isEditing ? 'bg-blue-500' : 'bg-emerald-500'
                    )}
                  >
                    {isEditing ? (
                      <Pencil className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    )}
                  </span>
                </div>

                {/* Title Info */}
                <div className="flex-1 min-w-0 pt-1">
                  <SheetTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Pencil className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        Modifier
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                        Nouveau
                      </>
                    )}
                  </SheetTitle>
                  <SheetDescription className="mt-1">
                    {isEditing
                      ? 'Modifiez les informations de l\'utilisateur'
                      : 'Créez un nouvel utilisateur'}
                  </SheetDescription>
                </div>
              </div>

              {/* Mode Badge */}
              <Badge 
                variant="outline"
                className={cn(
                  'self-start gap-1.5 px-3 py-1 font-medium border-2',
                  isEditing 
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-500'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                )}
              >
                {isEditing ? <Pencil className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {isEditing ? 'Mode édition' : 'Nouveau compte'}
              </Badge>
            </SheetHeader>
          </header>

          {/* Form */}
          <main className="flex-1 px-6 py-6 -mt-8 relative z-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                {/* Full Name Field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        Nom complet
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Jean Dupont" 
                          className="h-11 bg-muted/30 border-2 focus:border-primary transition-colors"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        Adresse email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="jean@exemple.com" 
                          className="h-11 bg-muted/30 border-2 focus:border-primary transition-colors"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field (Create only) */}
                {!isEditing && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          Mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Minimum 8 caractères"
                              className="pr-10 h-11 bg-muted/30 border-2 focus:border-primary transition-colors"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Role Field */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        Rôle
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 bg-muted/30 border-2 focus:border-primary transition-colors">
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLE_OPTIONS.map((option) => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              className="cursor-pointer"
                            >
                              <span className={option.color}>{option.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status Toggle */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <div 
                        className={cn(
                          'flex items-center justify-between rounded-xl border-2 p-4 transition-colors',
                          field.value 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                        )}
                        role="group"
                        aria-label="Statut du compte"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center',
                              field.value 
                                ? 'bg-emerald-500/10' 
                                : 'bg-red-500/10'
                            )}
                          >
                            {field.value ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                            )}
                          </div>
                          <div>
                            <FormLabel className="text-base font-semibold m-0">
                              {field.value ? 'Compte actif' : 'Compte inactif'}
                            </FormLabel>
                            <p className={cn(
                              'text-xs mt-0.5',
                              field.value 
                                ? 'text-emerald-700 dark:text-emerald-300' 
                                : 'text-red-700 dark:text-red-300'
                            )}>
                              {field.value ? 'L\'utilisateur peut se connecter' : 'L\'utilisateur ne peut pas se connecter'}
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label={field.value ? 'Désactiver le compte' : 'Activer le compte'}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Footer Actions */}
                <SheetFooter className="gap-3 pt-6 sticky bottom-0 bg-background pb-6 -mx-6 px-6 border-t mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                    className="flex-1 h-11"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPending} 
                    className={cn(
                      'flex-1 h-11',
                      isEditing 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        {isEditing ? 'Modification...' : 'Création...'}
                      </>
                    ) : isEditing ? (
                      <>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Modifier
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Créer
                      </>
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
}
