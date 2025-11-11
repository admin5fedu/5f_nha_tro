import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

const listSelect = `
  id,
  name,
  address,
  phone,
  manager_name,
  status,
  created_at
`;

const detailSelect = `
  id,
  name,
  address,
  phone,
  manager_name,
  status,
  notes,
  representative_name,
  representative_position,
  representative_id_card,
  representative_address,
  representative_phone,
  account_id,
  account_number,
  account_holder,
  bank_name,
  bank_branch,
  qr_code,
  created_at,
  updated_at,
  accounts:account_id ( id, name, account_number, account_holder, bank_name, bank_branch, qr_code )
`;

const mapBranch = (row) => {
  if (!row) return null;
  const account = row.accounts || null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    manager_name: row.manager_name,
    status: row.status,
    notes: row.notes,
    representative_name: row.representative_name,
    representative_position: row.representative_position,
    representative_id_card: row.representative_id_card,
    representative_address: row.representative_address,
    representative_phone: row.representative_phone,
    account_id: row.account_id,
    account_number: row.account_number || account?.account_number,
    account_holder: row.account_holder || account?.account_holder,
    bank_name: row.bank_name || account?.bank_name,
    bank_branch: row.bank_branch || account?.bank_branch,
    account_name: account?.name || null,
    qr_code: row.qr_code || account?.qr_code,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

export const fetchBranches = async ({ limit = 50, offset = 0 } = {}) => {
  const supabase = ensureClient();
  const rangeEnd = offset + limit - 1;
  const { data, error, count } = await supabase
    .from('branches')
    .select(listSelect, { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, rangeEnd);

  if (error) throw error;
  const items = (data || []).map(mapBranch);
  const total = typeof count === 'number' ? count : items.length;
  return {
    data: items,
    total,
    hasMore: offset + items.length < total
  };
};

export const fetchBranchById = async (branchId) => {
  if (!branchId) return null;
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('branches')
    .select(detailSelect)
    .eq('id', branchId)
    .maybeSingle();

  if (error) throw error;
  return mapBranch(data);
};

export const createBranch = async (payload) => {
  const supabase = ensureClient();
  const dataToInsert = {
    ...payload,
    account_id: payload.account_id ? Number(payload.account_id) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('branches')
    .insert(dataToInsert)
    .select(detailSelect)
    .maybeSingle();

  if (error) throw error;
  return mapBranch(data);
};

export const updateBranch = async (branchId, payload) => {
  const supabase = ensureClient();
  const dataToUpdate = {
    ...payload,
    account_id: payload.account_id ? Number(payload.account_id) : null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('branches')
    .update(dataToUpdate)
    .eq('id', branchId)
    .select(detailSelect)
    .maybeSingle();

  if (error) throw error;
  return mapBranch(data);
};

export const deleteBranch = async (branchId) => {
  const supabase = ensureClient();
  const { error } = await supabase.from('branches').delete().eq('id', branchId);
  if (error) throw error;
};

