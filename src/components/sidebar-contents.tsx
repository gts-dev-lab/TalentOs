'use client';

import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getNavItems } from '@/lib/nav';
import { isSuperadmin } from '@/lib/superadmin';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import { ChevronsLeft, ChevronsRight, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';

export function SidebarContents() {
  const { isOpen, setIsOpen, isMobile } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();
  const allNavItems = getNavItems();

  const userPermissions = useLiveQuery(
    () => (user ? db.getPermissionsForRole(user.role) : Promise.resolve([])),
    [user?.role]
  );

  if (!user || userPermissions === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const visibleNavItems = isSuperadmin(user.email)
    ? allNavItems
    : allNavItems.filter(item => userPermissions.includes(item.href));

  const activeItem = visibleNavItems
    .filter(item => pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-frappe-sm p-2 text-[hsl(var(--frappe-sidebar-fg))] hover:bg-[hsl(var(--frappe-sidebar-hover))]"
        >
          <GraduationCap className="h-7 w-7 shrink-0 opacity-90" />
          {isOpen && <span className="text-base font-semibold truncate">TalentOS</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleNavItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={item.href === activeItem?.href}
                  tooltip={item.label}
                  className="h-12 w-full justify-start"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-[hsl(var(--frappe-sidebar-muted)_/_0.3)]">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-[hsl(var(--frappe-sidebar-fg))] bg-[hsl(var(--frappe-sidebar-hover))]">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isOpen && (
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-medium text-[hsl(var(--frappe-sidebar-fg))]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[hsl(var(--frappe-sidebar-muted))]">
                  {user.role}
                </p>
              </div>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-[hsl(var(--frappe-sidebar-fg))] hover:bg-[hsl(var(--frappe-sidebar-hover))]"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronsLeft className="h-4 w-4" />
              ) : (
                <ChevronsRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </SidebarFooter>
    </>
  );
}
