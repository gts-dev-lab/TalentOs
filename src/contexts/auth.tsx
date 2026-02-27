'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User } from '@/lib/types';
import * as db from '@/lib/db';

const FRONTEND_ONLY = process.env.NEXT_PUBLIC_FRONTEND_ONLY === 'true';

/** Usuario mock para modo solo-frontend (sin auth ni base de datos). */
const MOCK_USER: User = {
  id: 'frontend-only-mock',
  name: 'Usuario demo',
  email: 'demo@talentos.local',
  avatar: '',
  role: 'Administrador General',
  department: 'Formación',
  points: 0,
  status: 'approved',
  notificationSettings: { consent: false, channels: [] },
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NEXTAUTH_SESSION = '/api/nextauth/session';
const SESSION_CHECK_TIMEOUT_MS = 3500;

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return fetch(url, { credentials: 'same-origin', signal: controller.signal }).finally(() => clearTimeout(t));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const publicPages = ['/', '/login', '/register', '/pending-approval', '/forgot-password', '/password-reset', '/features', '/terms', '/privacy-policy', '/request-demo', '/certificates/verify', '/auth/error'];
  
  const checkUserStatus = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    if (FRONTEND_ONLY) {
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [sessionRes, nextRes] = await Promise.all([
        fetchWithTimeout('/api/auth/session', SESSION_CHECK_TIMEOUT_MS).catch(() => null),
        fetchWithTimeout(NEXTAUTH_SESSION, SESSION_CHECK_TIMEOUT_MS).catch(() => null),
      ]);
      if (sessionRes?.ok) {
        const data = await sessionRes.json();
        if (data?.user) {
          setUser(data.user);
          setIsLoading(false);
          return;
        }
      }
      if (nextRes?.ok) {
        const data = await nextRes.json();
        if (data?.user && data.user.id) {
          setUser(data.user as User);
          setIsLoading(false);
          return;
        }
      }
      const loggedInUser = await db.getLoggedInUser();
      setUser(loggedInUser);
    } catch {
      const loggedInUser = await db.getLoggedInUser();
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (FRONTEND_ONLY) return; // No redirigir a login en modo solo frontend
    const isPublicPage = publicPages.includes(pathname);
    if (!isLoading && !user && !isPublicPage) {
        router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    let apiRefused = false;
    try {
      if (password) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'same-origin',
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.user) {
            setUser(data.user);
            return data.user;
          }
          if (res.status === 401 || res.status === 403) {
            apiRefused = true;
            throw new Error(data?.error ?? 'Credenciales incorrectas.');
          }
          if (res.status !== 503) {
            apiRefused = true;
            throw new Error(data?.error ?? 'Error de autenticación.');
          }
        } catch (inner) {
          if (apiRefused) throw inner;
        }
      }
      const loggedInUser = await db.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    signOut({ redirect: false }).catch(() => {});
    db.logout();
    setUser(null);
    router.push('/');
  };

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
