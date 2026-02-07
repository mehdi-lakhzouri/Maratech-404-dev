'use client';

/**
 * App Providers
 * -------------
 * Combines all providers for the application.
 */

import { QueryProvider, AuthProvider } from '@/lib/providers';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryProvider>
  );
}
