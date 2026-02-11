'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { PageTransition } from '@/components/page-transition';
import { SidebarContents } from '@/components/sidebar-contents';
import { DashboardLoadingSkeleton } from '@/components/dashboard-loading-skeleton';
import { usePathname, useRouter } from 'next/navigation';
import { getNavItems } from '@/lib/nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = getNavItems();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <DashboardLoadingSkeleton />;
  }
  
  const pageTitle =
    navItems
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.label || 'Dashboard';


  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarContents />
        </Sidebar>
        <SidebarInset>
          <DashboardHeader title={pageTitle} />
          <main className="frappe-page flex-1 bg-background">
            <PageTransition>{children}</PageTransition>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
