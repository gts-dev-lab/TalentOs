// @ts-nocheck

// src/lib/auth-providers/index.ts

import type { AuthProvider } from './types';
import { dexieAuthProvider } from './dexie';
import { supabaseAuthProvider } from './supabase';

const providers: Record<string, AuthProvider> = {
  dexie: dexieAuthProvider,
  supabase: supabaseAuthProvider,
};

const key = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'dexie';

if (!providers[key]) {
  console.warn(`Auth provider "${key}" is not fully implemented. Falling back to 'dexie'.`);
}

export const authProvider: AuthProvider = providers[key] || providers['dexie'];
