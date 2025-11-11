import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://talhlgiwtodmyzfyqcso.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbGhsZ2l3dG9kbXl6ZnlxY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MzA5NTUsImV4cCI6MjA3ODQwNjk1NX0.OKgRY1ck-mIj1L-r1Z6IqBMdvO4l0g75itbYBiXGijs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[supabase] Using built-in default credentials. Configure VITE_SUPABASE_URL/ANON_KEY for production.');
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export default supabaseClient;

