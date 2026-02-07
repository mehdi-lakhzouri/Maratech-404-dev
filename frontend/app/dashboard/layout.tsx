"use client";

/**
 * Dashboard Layout
 * ----------------
 * Layout for dashboard pages.
 * Includes header and main content area.
 */

import { DashboardHeader } from "@/components/layouts/dashboard-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8" role="main">
        {children}
      </main>
    </div>
  );
}
