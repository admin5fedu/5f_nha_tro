import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

export const fetchActiveAccounts = async () => {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, account_number, account_holder, bank_name, bank_branch, qr_code, status')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export default {
  fetchActiveAccounts
};
