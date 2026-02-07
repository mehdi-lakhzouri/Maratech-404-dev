'use client';

/**
 * Dashboard Header
 * ----------------
 * Accessible header for authenticated pages.
 * Features user menu with keyboard navigation.
 */

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, User, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/providers/auth-provider';

const roleLabels: Record<string, string> = {
  RESPONSABLE: 'Responsable',
  CHEF_PROJET: 'Chef de projet',
  CONSULTANT: 'Consultant',
};

export function DashboardHeader() {
  const { user, logout, isLoggingOut } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b bg-card" role="banner">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          href="/dashboard"
          className="text-2xl font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          TILI
        </Link>

        {/* Navigation */}
        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            Tableau de bord
          </Link>
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              aria-label={`Menu utilisateur pour ${user.firstName} ${user.lastName}`}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <span className="hidden md:inline-block text-sm">
                {user.firstName} {user.lastName}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
