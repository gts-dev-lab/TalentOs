import { DashboardLoadingSkeleton } from '@/components/dashboard-loading-skeleton';

/**
 * Next.js muestra este componente automáticamente mientras se carga
 * cualquier ruta bajo /dashboard (y sus hijos).
 */
export default function DashboardLoading() {
  return <DashboardLoadingSkeleton />;
}
