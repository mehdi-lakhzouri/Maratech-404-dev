'use client';

/**
 * Dashboard Layout
 * ----------------
 * Protected layout for dashboard pages.
 * Includes header and main content area.
 */

import ProtectedLayout from '@/components/layouts/protected-layout';
import { DashboardHeader } from '@/components/layouts/dashboard-header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8" role="main">
          {children}
        </main>
      </div>
    </ProtectedLayout>
  );
}
