'use client';

/**
 * App Providers
 * -------------
 * Combines all providers for the application.
 */

import { QueryProvider, AuthProvider } from '@/lib/providers';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}
