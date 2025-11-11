import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

const normalizePayload = (payload = {}) => {
  const trimmed = { ...payload };
  if (trimmed.app_name != null) trimmed.app_name = trimmed.app_name?.trim();
  if (trimmed.company_name != null) trimmed.company_name = trimmed.company_name?.trim();
  if (trimmed.company_address != null) trimmed.company_address = trimmed.company_address?.trim();
  if (trimmed.company_phone != null) trimmed.company_phone = trimmed.company_phone?.trim();
  if (trimmed.company_email != null) trimmed.company_email = trimmed.company_email?.trim();
  if (trimmed.company_website != null) trimmed.company_website = trimmed.company_website?.trim();
  if (trimmed.company_tax_code != null) trimmed.company_tax_code = trimmed.company_tax_code?.trim();
  if (trimmed.company_representative != null) trimmed.company_representative = trimmed.company_representative?.trim();
  if (trimmed.company_representative_position != null) {
    trimmed.company_representative_position = trimmed.company_representative_position?.trim();
  }
  if (trimmed.company_bank_account != null) trimmed.company_bank_account = trimmed.company_bank_account?.trim();
  if (trimmed.company_bank_name != null) trimmed.company_bank_name = trimmed.company_bank_name?.trim();
  if (trimmed.company_bank_branch != null) trimmed.company_bank_branch = trimmed.company_bank_branch?.trim();
  if (trimmed.notes != null) trimmed.notes = trimmed.notes?.trim();
  return trimmed;
};

export const fetchSettings = async () => {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

export const upsertSettings = async (payload) => {
  const supabase = ensureClient();
  const normalizedPayload = normalizePayload(payload);
  const record = {
    id: payload?.id || 1,
    ...normalizedPayload,
    updated_at: new Date().toISOString()
  };

  if (!record.created_at) {
    record.created_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('settings')
    .upsert(record, {
      onConflict: 'id'
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data || record;
};


