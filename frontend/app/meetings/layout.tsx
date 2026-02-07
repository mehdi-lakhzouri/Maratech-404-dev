'use client';

/**
 * Meetings Layout
 * ---------------
 * Protected layout for meetings section.
 */

import ProtectedLayout from '@/components/layouts/protected-layout';
import { Sidebar } from '@/components/ui/sidbar';

interface MeetingsLayoutProps {
  children: React.ReactNode;
}

export default function MeetingsLayout({ children }: MeetingsLayoutProps) {
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
