// src/lib/db-providers/index.ts

import type { DBProvider } from './types';
import { dexieProvider } from './dexie';
import { mockFrontendProvider } from './mock-frontend';

const FRONTEND_ONLY = process.env.NEXT_PUBLIC_FRONTEND_ONLY === 'true';

const providers: Record<string, DBProvider> = {
  dexie: dexieProvider,
};

// PostgreSQL provider solo disponible en servidor (Next.js API Routes)
if (typeof window === 'undefined' && process.env.DB_PROVIDER === 'postgres') {
  try {
    const { postgresProvider } = require('./postgres');
    providers.postgres = postgresProvider;
  } catch (error) {
    console.warn('PostgreSQL provider not available:', error);
  }
}

const key = process.env.DB_PROVIDER || 'dexie';

if (!providers[key]) {
  console.warn(`DB provider "${key}" is not fully implemented. Falling back to 'dexie'.`);
}

// Modo solo diseño: sin IndexedDB ni APIs, solo UI con datos vacíos
export const dbProvider: DBProvider = FRONTEND_ONLY
  ? mockFrontendProvider
  : providers[key] || providers['dexie'];
