// @ts-nocheck

// This is a placeholder implementation.
// To fully implement, you would use the Firebase SDK.

import type { User } from '@/lib/types';
import * as db from '@/lib/db';
import { supabase as supabaseClient } from '@/lib/supabase-client';

const listeners = new Set<(user: User | null) => void>();
let currentUser: User | null = null;

function initializeSupabase() {
    if (typeof window === 'undefined') return;

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            // IMPORTANT: Supabase handles auth, Dexie handles the user profile.
            // We find the matching profile in Dexie using the email.
            const profile = await db.db.users.where('email').equalsIgnoreCase(session.user.email!).first();
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
}

// Initialize on module load
initializeSupabase();

export async function login(email: string, password?: string): Promise<User | null> {
    if (!password) return null;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        console.error("Supabase login error:", error.message);
        throw new Error(error.message); // Propagate error
    }
    
    // The onAuthStateChange listener will handle setting the current user
    if(data.user) {
        const profile = await db.db.users.where('email').equalsIgnoreCase(data.user.email!).first();
        return profile || null;
    }
    
    return null;
}

export async function logout(): Promise<void> {
    await supabaseClient.auth.signOut();
    currentUser = null;
    listeners.forEach(l => l(null));
}

export function subscribe(listener: (user: User | null) => void): () => void {
    // Immediately call listener with current state
    listener(currentUser);
    
    listeners.add(listener);
    
    return () => {
        listeners.delete(listener);
    };
}

export async function register(name: string, email: string, password?: string): Promise<{user: any, error: any}> {
    if (!password) {
        return { user: null, error: { message: "Password is required for registration." } };
    };

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            }
        }
    });

    return { user: data.user, error };
}
