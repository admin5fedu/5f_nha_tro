import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error(
      'Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.'
    );
  }
  return supabaseClient;
};

const mapModules = (modules) =>
  (modules || []).map((module) => ({
    module_code: module.module_code,
    module_name: module.module_name,
    group_label: module.group_label,
    actions: (module.permission_actions || [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((action) => ({
        id: action.id,
        action: action.action,
        action_label: action.action_label,
        sort_order: action.sort_order ?? 0
      }))
  }));

export const fetchPermissionModules = async () => {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('permission_modules')
    .select('id, module_code, module_name, group_label, permission_actions (id, action, action_label, sort_order)')
    .order('module_code', { ascending: true })
    .order('sort_order', { ascending: true, foreignTable: 'permission_actions' });

  if (error) throw error;
  return mapModules(data);
};

export const fetchRolePermissions = async (roleId) => {
  if (!roleId) return [];
  const supabase = ensureClient();

  const [{ data: modules, error: modulesError }, { data: assigned, error: assignedError }] = await Promise.all([
    supabase
      .from('permission_modules')
      .select('id, module_code, module_name, group_label, permission_actions (id, action, action_label, sort_order)')
      .order('module_code', { ascending: true })
      .order('sort_order', { ascending: true, foreignTable: 'permission_actions' }),
    supabase
      .from('role_permissions')
      .select('permission_action_id')
      .eq('role_id', roleId)
  ]);

  if (modulesError) throw modulesError;
  if (assignedError) throw assignedError;

  const assignedSet = new Set((assigned || []).map((entry) => entry.permission_action_id));

  return mapModules(modules).map((module) => ({
    ...module,
    permissions: module.actions.map((action) => ({
      id: action.id,
      action: action.action,
      action_label: action.action_label,
      assigned: assignedSet.has(action.id)
    }))
  }));
};

export const updateRolePermissions = async (roleId, permissionIds = []) => {
  const supabase = ensureClient();
  const numericRoleId = Number(roleId);
  if (!numericRoleId) {
    throw new Error('roleId không hợp lệ');
  }

  const { error: deleteError } = await supabase.from('role_permissions').delete().eq('role_id', numericRoleId);
  if (deleteError) throw deleteError;

  const uniqueIds = Array.from(new Set(permissionIds.map(Number).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return;
  }

  const rows = uniqueIds.map((permissionId) => ({
    role_id: numericRoleId,
    permission_action_id: permissionId
  }));

  const { error: insertError } = await supabase.from('role_permissions').insert(rows);
  if (insertError) throw insertError;
};


