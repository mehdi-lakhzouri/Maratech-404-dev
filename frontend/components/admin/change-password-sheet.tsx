'use client';

/**
 * Change Password Sheet
 * ---------------------
 * Modern, accessible side sheet for changing user passwords.
 * Features: Color indicators, proper ARIA labels, visual hierarchy.
 */

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Mail,
  User as UserIcon,
  KeyRound,
  Shield,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import type { UserManagement } from '@/lib/api/types';

// =============================================================================
// Schema & Types
// =============================================================================

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre'
      ),
    confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserManagement | null;
  onSubmit: (userId: string, newPassword: string) => Promise<void>;
  isPending: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function getPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let score = 0;
  if (requirements.length) score += 25;
  if (password.length >= 12) score += 10;
  if (requirements.lowercase) score += 15;
  if (requirements.uppercase) score += 15;
  if (requirements.number) score += 15;
  if (requirements.special) score += 20;

  if (score >= 70) {
    return {
      score,
      label: 'Fort',
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-500',
      requirements,
    };
  }
  if (score >= 40) {
    return {
      score,
      label: 'Moyen',
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-500',
      requirements,
    };
  }
  return {
    score,
    label: 'Faible',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    borderColor: 'border-red-500',
    requirements,
  };
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

export function ChangePasswordSheet({
  open,
  onOpenChange,
  user,
  onSubmit,
  isPending,
}: ChangePasswordSheetProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchPassword = useWatch({
    control: form.control,
    name: 'newPassword',
  });
  const passwordStrength = getPasswordStrength(watchPassword || '');

  const handleSubmit = async (data: PasswordFormData) => {
    if (!user) return;
    await onSubmit(user.id, data.newPassword);
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-lg overflow-y-auto p-0"
        aria-label={user ? `Changer le mot de passe de ${user.fullName}` : 'Changer mot de passe'}
      >
        {!user ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col h-full">
            {/* Header with Gradient Background */}
            <header className="relative px-6 pt-6 pb-16 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent">
              {/* Status Indicator Bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-amber-500"
                role="presentation"
                aria-hidden="true"
              />

              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="mb-2 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Retour
              </Button>

              <SheetHeader className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* Avatar with Lock Icon */}
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-4 ring-offset-2 ring-offset-background ring-amber-500/30">
                      <AvatarImage src={undefined} alt={`Photo de ${user.fullName}`} />
                      <AvatarFallback className="text-xl font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Lock Badge */}
                    <span 
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center"
                      aria-label="Sécurité"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0 pt-1">
                    <SheetTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                      <Lock className="h-5 w-5 text-amber-600" aria-hidden="true" />
                      Mot de passe
                    </SheetTitle>
                    <SheetDescription className="mt-1 text-sm">
                      Modification sécurisée
                    </SheetDescription>
                  </div>
                </div>

                {/* User Info Badges */}
                <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Informations utilisateur">
                  <Badge 
                    variant="outline"
                    className="gap-1.5 px-3 py-1 font-medium bg-background/80 backdrop-blur-sm"
                    role="listitem"
                  >
                    <UserIcon className="h-3 w-3" aria-hidden="true" />
                    {user.fullName}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className="gap-1.5 px-3 py-1 font-medium bg-background/80 backdrop-blur-sm"
                    role="listitem"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    {user.email}
                  </Badge>
                </div>
              </SheetHeader>
            </header>

            {/* Security Alert */}
            <div className="px-6 -mt-8 relative z-10">
              <div 
                className="flex items-start gap-3 p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 shadow-sm"
                role="alert"
                aria-live="polite"
              >
                <div className="shrink-0 h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Information de sécurité
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    L&apos;utilisateur sera notifié et devra utiliser le nouveau mot de passe lors de sa prochaine connexion.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <main className="flex-1 px-6 py-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* New Password Field */}
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          Nouveau mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Entrez le nouveau mot de passe"
                              className="pr-10 h-11 bg-muted/30 border-2 focus:border-amber-500 transition-colors"
                              aria-describedby="password-strength-info"
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
                        
                        {watchPassword && (
                          <div id="password-strength-info" className="space-y-3 mt-3" aria-live="polite">
                            {/* Strength Indicator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <Progress 
                                  value={passwordStrength.score} 
                                  className={cn('h-full transition-all', 
                                    passwordStrength.score >= 70 ? '[&>div]:bg-emerald-500' :
                                    passwordStrength.score >= 40 ? '[&>div]:bg-amber-500' : 
                                    '[&>div]:bg-red-500'
                                  )}
                                />
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs font-semibold px-2.5 py-0.5 border-2',
                                  passwordStrength.color,
                                  passwordStrength.bgColor,
                                  passwordStrength.borderColor
                                )}
                              >
                                <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                                {passwordStrength.label}
                              </Badge>
                            </div>
                            
                            {/* Requirements Checklist */}
                            <div 
                              className="grid grid-cols-1 gap-1.5 p-3 rounded-xl bg-muted/30 border"
                              role="list"
                              aria-label="Exigences du mot de passe"
                            >
                              <RequirementItem
                                met={passwordStrength.requirements.length}
                                text="Au moins 8 caractères"
                              />
                              <RequirementItem
                                met={passwordStrength.requirements.uppercase}
                                text="Une lettre majuscule (A-Z)"
                              />
                              <RequirementItem
                                met={passwordStrength.requirements.lowercase}
                                text="Une lettre minuscule (a-z)"
                              />
                              <RequirementItem
                                met={passwordStrength.requirements.number}
                                text="Un chiffre (0-9)"
                              />
                              <RequirementItem
                                met={passwordStrength.requirements.special}
                                text="Un caractère spécial (recommandé)"
                                optional
                              />
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password Field */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          Confirmer le mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              type={showConfirm ? 'text' : 'password'}
                              placeholder="Confirmez le nouveau mot de passe"
                              className="pr-10 h-11 bg-muted/30 border-2 focus:border-amber-500 transition-colors"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowConfirm(!showConfirm)}
                              aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                            >
                              {showConfirm ? (
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

                  {/* Footer Actions */}
                  <SheetFooter className="gap-3 pt-6 sticky bottom-0 bg-background pb-6 -mx-6 px-6 border-t mt-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                      disabled={isPending}
                      className="flex-1 h-11"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isPending} 
                      className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Modification...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
                          Changer le mot de passe
                        </>
                      )}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
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

interface RequirementItemProps {
  met: boolean;
  text: string;
  optional?: boolean;
}

function RequirementItem({ met, text, optional }: RequirementItemProps) {
  return (
    <div 
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-colors',
        met ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-transparent'
      )}
      role="listitem"
      aria-label={`${text}: ${met ? 'Validé' : 'Non validé'}`}
    >
      {met ? (
        <CheckCircle2 
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" 
          aria-hidden="true"
        />
      ) : (
        <XCircle 
          className="h-4 w-4 text-muted-foreground shrink-0" 
          aria-hidden="true"
        />
      )}
      <span className={cn(
        'text-xs font-medium',
        met ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
      )}>
        {text}
      </span>
      {optional && !met && (
        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-4">
          Optionnel
        </Badge>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-lg font-medium">Aucun utilisateur</p>
      <p className="text-sm text-muted-foreground mt-1">
        Sélectionnez un utilisateur pour modifier son mot de passe
      </p>
    </div>
  );
}

export default ChangePasswordSheet;
