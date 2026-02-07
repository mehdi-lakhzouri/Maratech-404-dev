'use client';

/**
 * Login Page
 * ----------
 * Two-step login with OTP verification.
 * Step 1: Email & Password
 * Step 2: OTP verification
 * 
 * Features:
 * - Full keyboard navigation
 * - Screen reader support with ARIA attributes
 * - Focus management
 * - Clear error messaging
 * - Countdown timer for OTP resend
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, RefreshCw } from 'lucide-react';

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

import { useLogin, useVerifyOtp, useResendOtp, useAuthErrorMessage } from '@/lib/hooks/use-auth';
import { loginSchema, otpSchema, type LoginFormData, type OtpFormData } from '@/lib/validations/auth';
import { ApiError } from '@/lib/api/client';

type Step = 'credentials' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const login = useLogin();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
  const getErrorMessage = useAuthErrorMessage();

  // Credentials form
  const credentialsForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (!otpExpiry) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((otpExpiry.getTime() - now.getTime()) / 1000));
      setCountdown(diff);
      setCanResend(diff === 0);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [otpExpiry]);

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle credentials submission
  const onCredentialsSubmit = useCallback((data: LoginFormData) => {
    login.mutate(data, {
      onSuccess: (response) => {
        setEmail(response.email);
        setOtpExpiry(new Date(response.expiresAt));
        setStep('otp');
        setCanResend(false);
      },
    });
  }, [login]);

  // Handle OTP submission
  const onOtpSubmit = useCallback((data: OtpFormData) => {
    verifyOtp.mutate({ email, otp: data.otp });
  }, [email, verifyOtp]);

  // Focus first OTP input after resend
  const focusFirstOtpInput = useCallback(() => {
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 50);
  }, []);

  // Clear OTP inputs visually
  const clearOtpInputs = useCallback(() => {
    otpInputRefs.current.forEach(input => {
      if (input) input.value = '';
    });
  }, []);

  // Handle OTP resend
  const handleResendOtp = useCallback(() => {
    resendOtp.mutate({ email }, {
      onSuccess: (response) => {
        setOtpExpiry(new Date(response.expiresAt));
        setCanResend(false);
        otpForm.reset();
        clearOtpInputs();
        focusFirstOtpInput();
      },
    });
  }, [email, otpForm, resendOtp, clearOtpInputs, focusFirstOtpInput]);

  // Handle OTP input change
  const handleOtpChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    // Get current OTP value
    const currentOtp = otpForm.getValues('otp') || '';
    const otpArray = currentOtp.padEnd(4, ' ').split('');
    otpArray[index] = digit || ' ';
    const newOtp = otpArray.join('').replace(/\s/g, '');
    
    otpForm.setValue('otp', newOtp);

    // Move to next input if digit entered
    if (digit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (newOtp.length === 4) {
      verifyOtp.mutate({ email, otp: newOtp });
    }
  }, [otpForm, email, verifyOtp]);

  // Handle OTP input keydown
  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const currentOtp = otpForm.getValues('otp') || '';
      if (!currentOtp[index] && index > 0) {
        // Move to previous input if current is empty
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, [otpForm]);

  // Handle paste for OTP
  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      otpForm.setValue('otp', pastedData);
      // Fill inputs visually
      pastedData.split('').forEach((digit, i) => {
        if (otpInputRefs.current[i]) {
          otpInputRefs.current[i]!.value = digit;
        }
      });
      // Focus last filled or next empty
      const lastIndex = Math.min(pastedData.length, 3);
      otpInputRefs.current[lastIndex]?.focus();
      
      // Auto-submit if complete
      if (pastedData.length === 4) {
        verifyOtp.mutate({ email, otp: pastedData });
      }
    }
  }, [email, otpForm, verifyOtp]);

  // Go back to credentials step
  const handleBack = useCallback(() => {
    setStep('credentials');
    setEmail('');
    setOtpExpiry(null);
    otpForm.reset();
    login.reset();
    verifyOtp.reset();
  }, [otpForm, login, verifyOtp]);

  // Format countdown as mm:ss
  const formatCountdown = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const credentialsError = login.error ? getErrorMessage(login.error as ApiError) : null;
  const otpError = verifyOtp.error ? getErrorMessage(verifyOtp.error as ApiError) : null;
  const resendError = resendOtp.error ? getErrorMessage(resendOtp.error as ApiError) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <main
        className="w-full max-w-md"
        role="main"
        aria-labelledby="login-title"
      >
        <Card>
          {step === 'credentials' ? (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle id="login-title" className="text-2xl font-bold">
                  Connexion à TILI
                </CardTitle>
                <CardDescription>
                  Entrez vos identifiants pour accéder à votre espace
                </CardDescription>
              </CardHeader>

              <CardContent>
                {credentialsError && (
                  <Alert variant="destructive" className="mb-4" role="alert">
                    <AlertDescription>{credentialsError}</AlertDescription>
                  </Alert>
                )}

                <Form {...credentialsForm}>
                  <form
                    onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)}
                    className="space-y-4"
                    noValidate
                  >
                    <FormField
                      control={credentialsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="vous@exemple.com"
                              autoComplete="email"
                              autoFocus
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={credentialsForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="pr-10"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={
                                  showPassword
                                    ? 'Masquer le mot de passe'
                                    : 'Afficher le mot de passe'
                                }
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

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={login.isPending}
                      aria-busy={login.isPending}
                    >
                      {login.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Envoi du code...</span>
                        </>
                      ) : (
                        'Continuer'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Pas encore de compte ?{' '}
                  <Link
                    href="/register"
                    className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  >
                    S&apos;inscrire
                  </Link>
                </div>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-4"
                  onClick={handleBack}
                  aria-label="Retour à la connexion"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  Retour
                </Button>
                
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                </div>
                
                <CardTitle id="login-title" className="text-2xl font-bold">
                  Vérification OTP
                </CardTitle>
                <CardDescription>
                  Un code de vérification a été envoyé à
                  <br />
                  <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {(otpError || resendError) && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{otpError || resendError}</AlertDescription>
                  </Alert>
                )}

                <Form {...otpForm}>
                  <form
                    onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                    className="space-y-6"
                    noValidate
                  >
                    {/* OTP Input Group */}
                    <div className="space-y-2">
                      <FormLabel className="text-center block">Code de vérification</FormLabel>
                      <div 
                        className="flex justify-center gap-3"
                        role="group"
                        aria-label="Entrez le code à 4 chiffres"
                      >
                        {[0, 1, 2, 3].map((index) => (
                          <Input
                            key={index}
                            ref={(el) => { otpInputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-14 h-14 text-center text-2xl font-bold"
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            aria-label={`Chiffre ${index + 1}`}
                            disabled={verifyOtp.isPending}
                          />
                        ))}
                      </div>
                      {otpForm.formState.errors.otp && (
                        <p className="text-sm text-destructive text-center">
                          {otpForm.formState.errors.otp.message}
                        </p>
                      )}
                    </div>

                    {/* Countdown & Resend */}
                    <div className="text-center">
                      {countdown > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Le code expire dans{' '}
                          <span className="font-medium text-foreground">{formatCountdown(countdown)}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-destructive">
                          Le code a expiré
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={verifyOtp.isPending || otpForm.getValues('otp').length !== 4}
                      aria-busy={verifyOtp.isPending}
                    >
                      {verifyOtp.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Vérification...</span>
                        </>
                      ) : (
                        'Vérifier et se connecter'
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Resend Section */}
                <div className="text-center pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Vous n&apos;avez pas reçu le code ?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={!canResend || resendOtp.isPending}
                    aria-busy={resendOtp.isPending}
                  >
                    {resendOtp.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Renvoyer le code</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {login.isPending && 'Envoi du code de vérification en cours'}
          {login.isSuccess && 'Code envoyé, veuillez entrer le code de vérification'}
          {verifyOtp.isPending && 'Vérification du code en cours'}
          {verifyOtp.isSuccess && 'Connexion réussie, redirection en cours'}
          {resendOtp.isPending && 'Renvoi du code en cours'}
          {resendOtp.isSuccess && 'Nouveau code envoyé'}
        </div>
      </main>
    </div>
  );
}
