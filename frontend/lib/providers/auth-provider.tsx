'use client';

/**
 * Auth Provider
 * -------------
 * Context provider for authentication state.
 * Uses TanStack Query under the hood for caching.
 */

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useCurrentUser, useLogout } from '@/lib/hooks/use-auth';
import type { User } from '@/lib/api/types';

interface AuthContextValue {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
