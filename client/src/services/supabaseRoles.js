import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

const mapRole = (row, countsByRole = {}) => {
  if (!row) return null;
  const count = countsByRole[row.id] ?? row.user_count ?? 0;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    status: row.status || 'active',
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_count: count
  };
};

export const fetchRoles = async () => {
  const supersetColumns = ['id', 'code', 'name', 'description', 'status', 'created_at', 'updated_at'];
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;

  const sanitized = (data || []).map((row) => {
    const result = {};
    supersetColumns.forEach((key) => {
      if (key in row) {
        result[key] = row[key];
      }
    });
    return { ...row, ...result };
  });

  const roleIds = sanitized.map((role) => role.id);
  let countsByRole = {};

  if (roleIds.length) {
    const { data: countRows, error: countError } = await supabase
      .from('users')
      .select('role_id')
      .in('role_id', roleIds);

    if (!countError && countRows) {
      countsByRole = countRows.reduce((acc, row) => {
        if (row.role_id) {
          acc[row.role_id] = (acc[row.role_id] || 0) + 1;
        }
        return acc;
      }, {});
    }
  }

  return sanitized.map((row) => mapRole(row, countsByRole));
};

export const fetchRoleById = async (roleId) => {
  if (!roleId) return null;
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const supersetColumns = ['id', 'code', 'name', 'description', 'status', 'created_at', 'updated_at'];
  const sanitized = { ...data };
  supersetColumns.forEach((key) => {
    if (!(key in sanitized)) {
      sanitized[key] = null;
    }
  });

  const { count, error: countError } = await supabase
    .from('users')
    .select('role_id', { count: 'exact', head: true })
    .eq('role_id', roleId);

  if (countError) {
    return mapRole(sanitized);
  }

  return mapRole(sanitized, { [roleId]: count ?? 0 });
};

export const createRole = async ({ code, name, description, status = 'active' }) => {
  const supabase = ensureClient();
  const payload = {
    code: code?.trim().toLowerCase(),
    name: name?.trim(),
    description: description?.trim() || null,
    status: status || 'active'
  };

  const { data, error } = await supabase
    .from('roles')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return mapRole(data);
};

export const updateRole = async (roleId, { name, description, status }) => {
  const supabase = ensureClient();
  const payload = {
    name: name?.trim(),
    description: description?.trim() || null,
    status: status || 'active',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('roles')
    .update(payload)
    .eq('id', roleId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return mapRole(data);
};

export const deleteRole = async (roleId) => {
  const supabase = ensureClient();
  const { error } = await supabase.from('roles').delete().eq('id', roleId);
  if (error) throw error;
};

