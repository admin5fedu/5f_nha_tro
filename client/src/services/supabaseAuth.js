import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

export const signInWithEmail = async (email, password) => {
  const supabase = ensureClient();
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  const supabase = ensureClient();
  return supabase.auth.signOut();
};

export const getSession = async () => {
  const supabase = ensureClient();
  return supabase.auth.getSession();
};

export const onAuthStateChange = (callback) => {
  const supabase = ensureClient();
  return supabase.auth.onAuthStateChange(callback);
};

export default {
  signInWithEmail,
  signOut,
  getSession,
  onAuthStateChange
};

