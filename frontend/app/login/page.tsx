'use client';

/**
 * Login Page
 * ----------
 * Connexion avec email et mot de passe.
 *
 * Features:
 * - Full keyboard navigation (Tab/Shift+Tab, Enter, Esc)
 * - Screen reader support with ARIA attributes
 * - Focus management
 * - Clear error messaging
 * - WCAG 2.1 AA compliance
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useLogin, useAuthErrorMessage } from '@/lib/hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { ApiError } from '@/lib/api/client';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const login = useLogin();
  const getErrorMessage = useAuthErrorMessage();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = useCallback((data: LoginFormData) => {
    login.mutate(data);
  }, [login]);

  const isLoading = login.isPending;
  const error = login.error as ApiError | null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <main
        className="w-full max-w-md"
        role="main"
        aria-labelledby="login-title"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <Link
              href="/"
              className="text-3xl font-bold text-primary mb-2 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              TILI
            </Link>
            <CardTitle id="login-title" className="text-2xl font-bold">
              Connexion
            </CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-6" role="alert">
                <AlertDescription>{getErrorMessage(error)}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Adresse email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="vous@exemple.com"
                          disabled={isLoading}
                          autoComplete="email"
                          autoFocus
                          aria-describedby="email-error"
                        />
                      </FormControl>
                      <FormMessage id="email-error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            disabled={isLoading}
                            autoComplete="current-password"
                            className="pr-10"
                            aria-describedby="password-error"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
                      <FormMessage id="password-error" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <div className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                Créer un compte
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isLoading && 'Connexion en cours, veuillez patienter'}
          {login.isSuccess && 'Connexion réussie, redirection en cours'}
        </div>
      </main>
    </div>
  );
}
