
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseClientInstance: ReturnType<typeof createClient> | undefined;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
}

// This is the client-side instance (uses the public anon key)
const supabaseClient = supabaseClientInstance;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Gets a Supabase client instance.
 * On the client-side, it returns a client with the public anonymous key.
 * On the server-side, it detects the environment and returns a client with the
 * elevated service_role key to bypass RLS for administrative tasks like synchronization.
 */
export function getSupabaseClient() {
    // If running on the server, create a new client with the service role key.
    // This is crucial for operations that need to bypass Row Level Security.
    if (typeof window === 'undefined') {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) {
             throw new Error('Supabase URL or service role key is not set in server environment variables.');
        }
        return createClient(supabaseUrl, serviceRoleKey);
    }
    
    // If on the client, return the singleton instance with the anon key.
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    return supabaseClient;
}


// A shorthand for the client-side instance, to be used in client components
// and authentication logic which should always use the anon key.
export const supabase = supabaseClient;
