import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading global: se muestra en la raíz mientras se resuelve la ruta inicial.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-frappe-sm" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
