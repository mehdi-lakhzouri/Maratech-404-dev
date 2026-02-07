'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  UserCog,
  LogOut,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLogout } from '@/lib/hooks/use-auth';
import { useAuth } from '@/lib/providers/auth-provider';
import type { UserRole } from '@/lib/api/types';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: NavItem[];
  /** Roles allowed to see this nav item (undefined = all roles) */
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Administration',
    href: '/admin',
    icon: Shield,
    roles: ['RESPONSABLE'],
    children: [
      {
        title: 'Gestion Utilisateurs',
        href: '/admin/users',
        icon: UserCog,
      },
    ],
  },
  {
    title: 'Équipe',
    href: '/team',
    icon: Users,
    roles: ['CHEF_PROJET'],
  },
  {
    title: 'Gestion des Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Réunions',
    href: '/meetings',
    icon: Calendar,
    roles: ['RESPONSABLE', 'CHEF_PROJET'],
  },
  {
    title: 'Tâches',
    href: '/action-items',
    icon: CheckSquare,
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: 'Paramètres',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ '/admin': true });
  const pathname = usePathname();
  const logout = useLogout();
  const { user } = useAuth();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMenu = (href: string) => {
    setOpenMenus(prev => ({ ...prev, [href]: !prev[href] }));
  };

  const isPathActive = (href: string, children?: NavItem[]) => {
    if (children) {
      return children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'));
    }
    return pathname === href;
  };

  const NavItemComponent = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = openMenus[item.href];
    const isParentActive = hasChildren && isPathActive(item.href, item.children);
    const Icon = item.icon;

    // If has children and not collapsed, render collapsible
    if (hasChildren && !isCollapsed) {
      return (
        <Collapsible open={isMenuOpen} onOpenChange={() => toggleMenu(item.href)}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                'text-white/70 transition-all duration-200 ease-in-out',
                'hover:bg-white/10 hover:text-white',
                'active:bg-white/15 active:scale-[0.98]',
                isParentActive && 'bg-white/15 text-white font-semibold'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isParentActive && 'text-white')} />
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              <ChevronDown 
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isMenuOpen && 'rotate-180'
                )} 
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 pt-1">
            <div className="flex flex-col gap-1 border-l border-white/20 pl-2">
              {item.children!.map((child) => (
                <NavItemComponent key={child.href} item={child} isChild />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    const content = (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5',
          'text-white/70 transition-all duration-200 ease-in-out',
          'hover:bg-white/10 hover:text-white',
          'active:bg-white/15 active:scale-[0.98]',
          isActive && 'bg-white/15 text-white font-semibold',
          isCollapsed && 'justify-center px-2',
          isChild && 'py-2 text-sm rounded-lg'
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-white', isChild && 'h-4 w-4')} />
        {!isCollapsed && (
          <>
            <span className={cn('flex-1 text-sm font-medium', isChild && 'text-xs')}>{item.title}</span>
            {item.badge && (
              <Badge variant={item.badgeVariant || 'secondary'} className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <Badge variant={item.badgeVariant || 'secondary'}>{item.badge}</Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'relative flex h-screen flex-col border-r border-indigo/20 bg-indigo transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">TILI</span>
                <span className="text-xs text-white/60">Plateforme Admin</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4" style={{ colorScheme: 'dark' }}>
          <nav className="flex flex-col gap-1">
            {filteredNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="border-t border-white/10 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {bottomNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
            
            {/* Logout Button */}
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5',
                'text-white/70 transition-all duration-200 ease-in-out',
                'hover:bg-red-500/20 hover:text-red-300',
                'active:bg-red-500/30 active:scale-[0.98]',
                isCollapsed && 'justify-center px-2'
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <span className="flex-1 text-sm font-medium text-left">
                  {logout.isPending ? 'Déconnexion...' : 'Déconnexion'}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Toggle Button */}
        <div className="absolute -right-3 top-20 z-50">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border-2 border-indigo/30 bg-background shadow-lg hover:bg-lavender-light"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
