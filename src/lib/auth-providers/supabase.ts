// This is a placeholder implementation.
// To fully implement, you would use the Firebase SDK.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@/lib/types';
import * as db from '@/lib/db';

let supabase: SupabaseClient | null = null;
const listeners = new Set<(user: User | null) => void>();
let currentUser: User | null = null;

function initializeSupabase() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // IMPORTANT: Supabase handles auth, Dexie handles the user profile.
        // We find the matching profile in Dexie using the email.
        const profile = await db.db.users
          .where('email')
          .equalsIgnoreCase(session.user.email!)
          .first();
        if (profile) {
          currentUser = profile;
        } else {
          // This case shouldn't happen in a normal flow, as user profiles
          // should be created in Dexie upon registration.
          currentUser = null;
        }
      } else {
        currentUser = null;
      }
      listeners.forEach(l => l(currentUser));
    });

    return supabase;
  }

  console.warn(
    'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set.'
  );
  return null;
}

// Initialize on module load
initializeSupabase();

export async function login(email: string, password?: string): Promise<User | null> {
  if (!supabase) return null;

  // Handle OAuth providers if no password is provided
  if (!password) {
    // This is a simplified approach. In a real app, you would handle the
    // OAuth flow more robustly, likely initiated from the UI.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google', // Or another provider
    });
    if (error) {
      console.error('Supabase OAuth login error:', error.message);
      throw new Error(error.message);
    }
    // The redirect will handle the rest, so we won't return a user here.
    return null;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Supabase login error:', error.message);
    throw new Error(error.message); // Propagate error
  }

  // The onAuthStateChange listener will handle setting the current user
  if (data.user) {
    const profile = await db.db.users.where('email').equalsIgnoreCase(data.user.email!).first();
    return profile || null;
  }

  return null;
}

export async function logout(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  currentUser = null;
  listeners.forEach(l => l(null));
}

export function subscribe(listener: (user: User | null) => void): () => void {
  // Initialize Supabase client if it hasn't been already
  initializeSupabase();

  // Immediately call listener with current state
  listener(currentUser);

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function register(
  name: string,
  email: string,
  password?: string
): Promise<{ user: any; error: any }> {
  if (!supabase || !password) {
    return {
      user: null,
      error: { message: 'Supabase client not initialized or password missing.' },
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  return { user: data.user, error };
}
