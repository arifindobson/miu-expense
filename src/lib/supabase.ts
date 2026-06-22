import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Supabase URL and Anon Key are missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInAnonymously: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error('Supabase not configured') }),
    signUp: async () => ({ data: { session: null, user: null }, error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
    select: () => ({
      eq: () => ({ order: () => ({ data: null, error: null }) }),
      or: () => ({ order: () => ({ data: null, error: null }) }),
    }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
    delete: () => ({ eq: () => ({ data: null, error: null }) }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
} as any;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;
