'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton que imita el layout del dashboard (sidebar + topbar + contenido).
 * Mejora la percepción de carga mostrando la estructura de la página de inmediato.
 */
export function DashboardLoadingSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-[hsl(var(--frappe-sidebar-bg))] p-3">
        <Skeleton className="h-10 w-full max-w-[140px] mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="mt-auto pt-4 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar skeleton */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
          <Skeleton className="h-6 w-32" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>

        {/* Content skeleton */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-frappe" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-frappe" />
            <Skeleton className="h-64 rounded-frappe" />
          </div>
        </main>
      </div>
    </div>
  );
}
