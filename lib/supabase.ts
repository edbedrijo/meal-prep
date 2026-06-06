import { createClient } from '@supabase/supabase-js';

// These come from .env.local (and from GitHub Actions secrets at build time).
// The anon key is safe to expose in the browser - it is protected by RLS.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Helpful console warning during dev if env vars are missing
  if (typeof window !== 'undefined') {
    console.warn(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
