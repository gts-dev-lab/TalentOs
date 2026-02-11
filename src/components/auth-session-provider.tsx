'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

const NEXTAUTH_BASE = '/api/nextauth';

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath={NEXTAUTH_BASE}>
      {children}
    </SessionProvider>
  );
}
