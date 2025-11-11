import supabaseClient, { isSupabaseConfigured } from './supabaseClient';
import { syncSupabaseAuthUser } from './supabaseAuthSync';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

const formatUser = (row) => {
  const branches = row.user_branches || [];
  const branchIds = branches.map((item) => item.branch_id);
  const branchNames = branches
    .map((item) => item.branches?.name)
    .filter(Boolean);

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    address: row.address,
    status: row.status,
    role_id: row.role_id,
    role: row.roles?.code || null,
    roles: row.roles,
    branch_ids: branchIds,
    branch_names: branchNames,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

const listSelect = `
  id,
  username,
  email,
  full_name,
  phone,
  status,
  role_id,
  created_at,
  roles:role_id ( code, name ),
  user_branches (
    branch_id,
    branches ( name )
  )
`;

const detailSelect = `
  id,
  username,
  email,
  full_name,
  phone,
  address,
  status,
  role_id,
  created_at,
  updated_at,
  roles:role_id ( code, name ),
  user_branches (
    branch_id,
    branches ( name )
  )
`;

export const fetchUsers = async ({ limit = 25, offset = 0 } = {}) => {
  const supabase = ensureClient();
  const rangeEnd = offset + limit - 1;
  const { data, error, count } = await supabase
    .from('users')
    .select(listSelect, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd);
  if (error) throw error;
  const formatted = (data || []).map(formatUser);
  const total = typeof count === 'number' ? count : formatted.length;
  return {
    data: formatted,
    total,
    hasMore: offset + formatted.length < total
  };
};

export const fetchUserById = async (id) => {
  const supabase = ensureClient();
  const { data, error } = await supabase.from('users').select(detailSelect).eq('id', id).single();
  if (error) throw error;
  return formatUser(data);
};

export const fetchUserByEmail = async (email) => {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('users')
    .select(detailSelect)
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error('Không tìm thấy người dùng với email này trong hệ thống');
  }
  return formatUser(data);
};

const syncUserBranches = async (userId, branchIds) => {
  const supabase = ensureClient();
  // Remove existing mappings
  const { error: deleteError } = await supabase.from('user_branches').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;

  if (!branchIds?.length) {
    return;
  }

  const rows = branchIds.map((branchId) => ({
    user_id: userId,
    branch_id: branchId
  }));

  const { error: insertError } = await supabase.from('user_branches').insert(rows);
  if (insertError) throw insertError;
};

export const createUser = async ({ branch_ids = [], ...payload }) => {
  const supabase = ensureClient();
  const { data, error } = await supabase.from('users').insert(payload).select().single();
  if (error) throw error;

  if (branch_ids.length > 0) {
    await syncUserBranches(data.id, branch_ids);
  }

  try {
    await syncSupabaseAuthUser({
      email: data.email,
      fullName: data.full_name,
      password: payload.password
    });
  } catch (syncError) {
    console.error('Failed to sync Supabase Auth user after creation:', syncError);
    throw new Error('Không thể đồng bộ tài khoản đăng nhập. Vui lòng kiểm tra cấu hình SUPABASE_AUTH_SYNC.');
  }

  return fetchUserById(data.id);
};

export const updateUser = async (id, { branch_ids = [], ...payload }) => {
  const supabase = ensureClient();
  let existing;
  try {
    existing = await fetchUserById(id);
  } catch (err) {
    console.warn('Unable to load existing user before update:', err);
  }
  const updatePayload = { ...payload, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('users').update(updatePayload).eq('id', id);
  if (error) throw error;

  await syncUserBranches(id, branch_ids);
  const updated = await fetchUserById(id);

  const targetEmail = updated?.email || existing?.email;
  const emailChanged = existing && targetEmail && existing.email !== targetEmail;
  const shouldSyncAuth = Boolean(targetEmail && (emailChanged || payload.password));

  if (shouldSyncAuth) {
    try {
      await syncSupabaseAuthUser({
        email: targetEmail,
        fullName: updated?.full_name || payload.full_name || existing?.full_name,
        password: payload.password
      });
    } catch (syncError) {
      console.error('Failed to sync Supabase Auth user after update:', syncError);
      throw new Error('Không thể đồng bộ tài khoản đăng nhập sau khi cập nhật. Vui lòng kiểm tra cấu hình SUPABASE_AUTH_SYNC.');
    }
  }

  return updated;
};

export const deleteUser = async (id) => {
  const supabase = ensureClient();
  const { error: branchError } = await supabase.from('user_branches').delete().eq('user_id', id);
  if (branchError) throw branchError;
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};

