import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

export const fetchRoles = async () => {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('roles')
    .select('id, code, name')
    .order('code', { ascending: true });

  if (error) throw error;
  return data || [];
};

