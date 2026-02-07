'use client';

/**
 * Admin Layout
 * ------------
 * Layout for admin section.
 * Uses the dashboard layout with sidebar.
 */

import ProtectedLayout from '@/components/layouts/protected-layout';
import { Sidebar } from '@/components/ui/sidbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
