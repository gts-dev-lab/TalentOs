'use client';

import { authProvider } from './auth-providers';
import type { User } from './types';
import type { AuthProvider as IAuthProvider } from './auth-providers/types';

/**
 * Defines a common interface for any authentication service.
 * This allows the application to be agnostic about the auth provider being used.
 * @deprecated This will be removed in favor of the new AuthProvider pattern.
 */
export interface AuthService {
  /**
   * Logs a user in.
   * @param email The user's email.
   * @param password The user's password (optional for some providers).
   * @returns A promise that resolves to the User object or null if login fails.
   */
  login(email: string, password?: string): Promise<User | null>;

  /**
   * Logs the current user out.
   */
  logout(): Promise<void>;

  /**
   * Gets the currently authenticated user, if any.
   * @returns A promise that resolves to the User object or null if no user is logged in.
   */
  getCurrentUser(): Promise<User | null>;
}

/**
 * Factory function that returns the currently active authentication service
 * based on the environment variable `NEXT_PUBLIC_AUTH_PROVIDER`.
 * Defaults to the local Dexie-based service if the variable is not set.
 */
export function getAuthService(): IAuthProvider {
  return authProvider;
}
