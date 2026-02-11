'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton genérico para páginas del dashboard (título + contenido).
 */
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="rounded-frappe border p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
