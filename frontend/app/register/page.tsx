'use client';

/**
 * Register Page
 * -------------
 * Accessible registration form with WCAG 2.1 AA compliance.
 * Features:
 * - Step-based registration flow
 * - Role selection with visual cards
 * - Full keyboard navigation
 * - Screen reader support with ARIA attributes
 */

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, UserCog, Users, Briefcase, ArrowRight, ArrowLeft, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useRegister, useAuthErrorMessage } from '@/lib/hooks/use-auth';
import {
  registerSchema,
  type RegisterFormData,
  USER_ROLES,
} from '@/lib/validations/auth';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  RESPONSABLE: UserCog,
  CHEF_PROJET: Briefcase,
  CONSULTANT: Users,
};

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();
  const getErrorMessage = useAuthErrorMessage();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: undefined,
    },
    mode: 'onChange',
  });

  const selectedRole = form.watch('role');

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, firstName, lastName, ...rest } = data;
    registerMutation.mutate({
      ...rest,
      fullName: `${firstName} ${lastName}`,
    });
  };

  const handleNextStep = async () => {
    const isValid = await form.trigger(['firstName', 'lastName', 'email', 'role']);
    if (isValid) {
      setStep(2);
    }
  };

  const errorMessage = registerMutation.error
    ? getErrorMessage(registerMutation.error as ApiError)
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <main
        className="w-full max-w-2xl"
        role="main"
        aria-labelledby="register-title"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <Link
              href="/"
              className="text-3xl font-bold text-primary mb-2 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              TILI
            </Link>
            <CardTitle id="register-title" className="text-2xl font-bold">
              Créer votre compte
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Commencez par vos informations personnelles'
                : 'Sécurisez votre compte avec un mot de passe'
              }
            </CardDescription>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mt-4" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={cn(
                "w-12 h-1 rounded transition-colors",
                step >= 2 ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                2
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {errorMessage && (
              <Alert variant="destructive" className="mb-6" role="alert">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                {/* Step 1: Personal Info & Role */}
                <div className={cn("space-y-6", step !== 1 && "hidden")}>
                  {/* Name Fields - Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Prénom</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jean"
                              autoComplete="given-name"
                              autoFocus
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Nom</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Dupont"
                              autoComplete="family-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Adresse email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="vous@exemple.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Role Selection - Cards */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Quel est votre rôle ?</FormLabel>
                        <FormControl>
                          <div 
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                            role="radiogroup"
                            aria-label="Sélection du rôle"
                          >
                            {USER_ROLES.map((role, index) => {
                              const Icon = roleIcons[role.value as keyof typeof roleIcons];
                              const isSelected = field.value === role.value;
                              
                              return (
                                <button
                                  key={role.value}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSelected}
                                  tabIndex={isSelected || (!field.value && index === 0) ? 0 : -1}
                                  onClick={() => field.onChange(role.value)}
                                  onKeyDown={(e) => {
                                    const roles = USER_ROLES;
                                    let nextIndex = index;
                                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      nextIndex = (index + 1) % roles.length;
                                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      nextIndex = (index - 1 + roles.length) % roles.length;
                                    } else if (e.key === ' ' || e.key === 'Enter') {
                                      e.preventDefault();
                                      field.onChange(role.value);
                                      return;
                                    } else {
                                      return;
                                    }
                                    field.onChange(roles[nextIndex].value);
                                    const nextEl = e.currentTarget.parentElement?.children[nextIndex] as HTMLElement;
                                    nextEl?.focus();
                                  }}
                                  className={cn(
                                    "relative flex flex-col items-center p-6 rounded-lg border-2 transition-all",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    isSelected
                                      ? "border-primary bg-primary/5 shadow-sm"
                                      : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                                  )}
                                >
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </div>
                                  )}
                                  <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                                    isSelected ? "bg-primary/10" : "bg-muted"
                                  )}>
                                    <Icon className={cn(
                                      "w-6 h-6",
                                      isSelected ? "text-primary" : "text-muted-foreground"
                                    )} />
                                  </div>
                                  <span className={cn(
                                    "font-semibold",
                                    isSelected && "text-primary"
                                  )}>
                                    {role.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground text-center mt-1">
                                    {role.description}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleNextStep}
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>

                {/* Step 2: Password */}
                <div className={cn("space-y-6", step !== 2 && "hidden")}>
                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 mb-2">
                    <p className="text-sm text-muted-foreground">
                      Inscription en tant que{' '}
                      <span className="font-medium text-foreground">
                        {USER_ROLES.find(r => r.value === selectedRole)?.label}
                      </span>
                      {' '}avec l&apos;adresse{' '}
                      <span className="font-medium text-foreground">{form.getValues('email')}</span>
                    </p>
                  </div>

                  {/* Password Fields - Row on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="pr-10"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Masquer' : 'Afficher'}
                                aria-pressed={showPassword}
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

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Confirmer</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="pr-10"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                                aria-pressed={showConfirmPassword}
                              >
                                {showConfirmPassword ? (
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
                  </div>

                  <FormDescription className="text-xs">
                    Minimum 8 caractères avec une majuscule, une minuscule et un chiffre
                  </FormDescription>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={registerMutation.isPending}
                      aria-busy={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Création...</span>
                        </>
                      ) : (
                        "Créer mon compte"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <div className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {registerMutation.isPending && 'Création du compte en cours, veuillez patienter'}
          {registerMutation.isSuccess && 'Compte créé avec succès, redirection en cours'}
        </div>
      </main>
    </div>
  );
}
