// @ts-nocheck

import type { User } from '@/lib/types';
import * as db from '@/lib/db';
import type { AuthProvider } from './types';

let currentUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

// This provider is for local-only development and uses Dexie.
// It is not suitable for production.

// Check initial state only on the client-side
if (typeof window !== 'undefined') {
  db.getLoggedInUser().then(user => {
    currentUser = user;
    listeners.forEach(l => l(currentUser));
  });
}

const login: AuthProvider['login'] = async (email, password) => {
    const user = await db.login(email, password);
    currentUser = user;
    listeners.forEach(l => l(currentUser));
    return user;
}

const logout: AuthProvider['logout'] = async () => {
    db.logout();
    currentUser = null;
    listeners.forEach(l => l(null));
}

const subscribe: AuthProvider['subscribe'] = (listener) => {
    // Immediately call listener with current state
    listener(currentUser);
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

const register: AuthProvider['register'] = async (name, email, password) => {
    // This is a simplified version. A real implementation would handle this differently.
    // In Dexie-only mode, registration directly adds a user.
    const user = await db.addUser({ name, email, password: password || '', role: 'Trabajador', department: 'Administración' });
    return { user, error: null };
}

export const dexieAuthProvider: AuthProvider = {
    login,
    logout,
    subscribe,
    register,
};
