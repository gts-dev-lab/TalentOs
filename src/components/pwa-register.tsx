'use client';

import { useEffect } from 'react';

/**
 * Registra el Service Worker de la PWA (manifest + SW).
 * Se retrasa 1s para evitar conflictos con extensiones (message channel errors).
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => {
          // Service worker registered successfully
        })
        .catch(err => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    };

    const timer = window.setTimeout(register, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
