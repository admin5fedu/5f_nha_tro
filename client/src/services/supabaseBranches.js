import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

export const fetchBranches = async () => {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('branches')
    .select('id, name, address, phone, status')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

