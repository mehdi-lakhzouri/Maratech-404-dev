'use client';

/**
 * Documents Layout
 * ----------------
 * Protected layout for documents section.
 * Uses the shared sidebar + main content area.
 */

import ProtectedLayout from '@/components/layouts/protected-layout';
import { Sidebar } from '@/components/ui/sidbar';

interface DocumentsLayoutProps {
  children: React.ReactNode;
}

export default function DocumentsLayout({ children }: DocumentsLayoutProps) {
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
