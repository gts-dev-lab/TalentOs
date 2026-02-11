'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Componente para transiciones suaves entre páginas (SPA-like).
 * Solo afecta la UI visual, no cambia la lógica de navegación.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={cn(
        'transition-opacity duration-frappe-slow ease-out',
        isTransitioning ? 'opacity-0' : 'opacity-100'
      )}
    >
      {children}
    </div>
  );
}
