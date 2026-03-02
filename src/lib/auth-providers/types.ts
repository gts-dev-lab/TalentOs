import type { User } from '@/lib/types';

/**
 * Defines the common shape for any authentication provider.
 * This ensures that different auth methods (Dexie, Firebase, etc.)
 * can be swapped seamlessly.
 */
export interface AuthProvider {
  /**
   * Logs a user in.
   * @param email The user's email.
   * @param password The user's password.
   * @returns A promise that resolves to the User object or null if login fails.
   */
  login: (email: string, password?: string) => Promise<User | null>;

  /**
   * Registers a new user.
   */
  register: (name: string, email: string, password?: string) => Promise<{ user: any; error: any }>;

  /**
   * Logs the current user out.
   */
  logout: () => Promise<void>;

  /**
   * Subscribes to changes in the authentication state.
   * This is used to keep the UI in sync with the user's login status.
   * @param listener A callback function that receives the User object or null.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: (user: User | null) => void): () => void;
}
