'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'talentos-chunk-reload';

function isChunkLoadError(message: string): boolean {
  return /ChunkLoadError|Loading chunk \d+ failed|Loading CSS chunk \d+ failed/i.test(message);
}

/**
 * En desarrollo, si falla la carga de un chunk (caché desincronizada),
 * hace una recarga completa una sola vez para recuperar.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const message =
        event instanceof PromiseRejectionEvent
          ? String(event.reason?.message ?? event.reason)
          : (event.message ?? '');
      if (!isChunkLoadError(message)) return;
      if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}
