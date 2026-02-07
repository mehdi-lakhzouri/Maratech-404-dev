'use client';

/**
 * Team Layout
 * -----------
 * Layout for team management section (Chef Projet only).
 */

import ProtectedLayout from '@/components/layouts/protected-layout';
import { Sidebar } from '@/components/ui/sidbar';

interface TeamLayoutProps {
  children: React.ReactNode;
}

export default function TeamLayout({ children }: TeamLayoutProps) {
  return (
    <ProtectedLayout>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8" role="main">
            {children}
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
