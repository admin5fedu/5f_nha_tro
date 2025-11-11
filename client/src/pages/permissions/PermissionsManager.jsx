import { useEffect, useMemo, useState, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  fetchPermissionModules,
  fetchRolePermissions as fetchRolePermissionsSupabase,
  updateRolePermissions as updateRolePermissionsSupabase
} from '../../services/supabasePermissions';
import { fetchRoles } from '../../services/supabaseRoles';
import { usePermissions } from '../../context/PermissionContext';

const CORE_ACTIONS = [
  { key: 'view', label: 'Xem' },
  { key: 'create', label: 'Thêm' },
  { key: 'update', label: 'Sửa' },
  { key: 'delete', label: 'Xóa' },
];

const MODULE_GROUPS = [
  {
    label: 'Tổng quan',
    modules: ['dashboard']
  },
  {
    label: 'Chi nhánh & Phòng',
    modules: ['branches', 'rooms', 'assets', 'images', 'services', 'meter-readings']
  },
  {
    label: 'Khách thuê',
    modules: ['tenants', 'vehicles']
  },
  {
    label: 'Công việc',
    modules: ['tasks']
  },
  {
    label: 'Tài chính',
    modules: ['contracts', 'invoices', 'accounts', 'transactions', 'financial-categories']
  },
  {
    label: 'Báo cáo',
    modules: ['profit-loss', 'accounts-receivable', 'revenue', 'cashflow']
  },
  {
    label: 'Thiết lập',
    modules: ['settings', 'users', 'roles', 'permissions']
  }
];

const MODULE_ORDER = MODULE_GROUPS.flatMap(group => group.modules);

const humanizeModuleName = (code = '') => {
  if (!code) return '';
  return code
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getModuleGroup = (moduleCode) => {
  for (const group of MODULE_GROUPS) {
    if (group.modules.includes(moduleCode)) {
      return group.label;
    }
  }
  return 'Khác';
};

const groupModulesBySidebar = (modules) => {
  const grouped = {};
  const ungrouped = [];

  modules.forEach((module) => {
    const groupLabel = module.group_label || getModuleGroup(module.module_code);
    if (groupLabel === 'Khác') {
      ungrouped.push(module);
    } else {
      if (!grouped[groupLabel]) {
        grouped[groupLabel] = [];
      }
      grouped[groupLabel].push(module);
    }
  });

  const orderedGroups = MODULE_GROUPS.map(group => ({
    label: group.label,
    modules: grouped[group.label] || []
  }));

  if (ungrouped.length > 0) {
    orderedGroups.push({
      label: 'Khác',
      modules: ungrouped
    });
  }

  return orderedGroups.filter(group => group.modules.length > 0);
};

const PermissionsManager = () => {
  const { roleId: routeRoleId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [roles, setRoles] = useState([]);
  const [modulesCatalog, setModulesCatalog] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(routeRoleId || '');
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const canModify = hasPermission('permissions', 'update');

  useEffect(() => {
    loadModulesCatalog();
    loadRoles();
  }, []);

  useEffect(() => {
    if (routeRoleId) {
      setSelectedRoleId(String(routeRoleId));
    }
  }, [routeRoleId]);

  useEffect(() => {
    if (!selectedRoleId) {
      setPermissions([]);
      setSelectedPermissions([]);
      return;
    }
    fetchRolePermissions(selectedRoleId);
  }, [selectedRoleId]);

  const loadModulesCatalog = async () => {
    setModulesLoading(true);
    try {
      const modules = await fetchPermissionModules();
      setModulesCatalog(modules);
    } catch (error) {
      console.error('Error loading module catalog:', error);
      alert('Lỗi khi tải danh sách module phân quyền');
    } finally {
      setModulesLoading(false);
    }
  };

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
      setSelectedRoleId((prev) => {
        if (prev) return prev;
        if (routeRoleId) return String(routeRoleId);
        if (data.length > 0) return String(data[0].id);
        return '';
      });
    } catch (error) {
      console.error('Error loading roles:', error);
      alert('Lỗi khi tải danh sách vai trò');
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    setLoadingRolePermissions(true);
    setPermissions([]);
    setSelectedPermissions([]);
    try {
      const rolePermissions = await fetchRolePermissionsSupabase(roleId);
      setPermissions(rolePermissions);
      const selectedIds = [];
      rolePermissions.forEach((module) => {
        module.permissions.forEach((perm) => {
          if (perm.assigned) {
            selectedIds.push(perm.id);
          }
        });
      });
      setSelectedPermissions(selectedIds);
    } catch (error) {
      console.error('Error loading role permissions:', error);
      alert('Lỗi khi tải phân quyền cho vai trò đã chọn');
    } finally {
      setLoadingRolePermissions(false);
    }
  };

  const modulesDefinitionMap = useMemo(() => {
    const map = {};
    modulesCatalog.forEach((module) => {
      map[module.module_code] = module;
    });
    return map;
  }, [modulesCatalog]);

  const roleModuleMap = useMemo(() => {
    const map = {};
    permissions.forEach((module) => {
      map[module.module_code] = module;
    });
    return map;
  }, [permissions]);

  const modulesForTable = useMemo(() => {
    const codesSet = new Set([
      ...MODULE_ORDER,
      ...modulesCatalog.map((module) => module.module_code),
      ...permissions.map((module) => module.module_code),
    ]);

    const sortedCodes = Array.from(codesSet).sort((a, b) => {
      const indexA = MODULE_ORDER.indexOf(a);
      const indexB = MODULE_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) {
        const nameA = modulesDefinitionMap[a]?.module_name || humanizeModuleName(a);
        const nameB = modulesDefinitionMap[b]?.module_name || humanizeModuleName(b);
        return nameA.localeCompare(nameB, 'vi');
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return sortedCodes
      .map((moduleCode) => {
        const moduleDefinition = modulesDefinitionMap[moduleCode];
        const roleModule = roleModuleMap[moduleCode];
        const moduleName = moduleDefinition?.module_name || roleModule?.module_name || humanizeModuleName(moduleCode);
        const moduleGroupLabel =
          moduleDefinition?.group_label || roleModule?.group_label || getModuleGroup(moduleCode);

        const actions = CORE_ACTIONS.map((action) => {
          const rolePermission = roleModule?.permissions?.find((perm) => perm.action === action.key);
          const definitionPermission = moduleDefinition?.actions?.find((perm) => perm.action === action.key);
          const permissionId = rolePermission?.id ?? definitionPermission?.id ?? null;

          return {
            key: action.key,
            label: action.label,
            permissionId,
            available: Boolean(permissionId),
            isSelected: permissionId ? selectedPermissions.includes(permissionId) : false,
          };
        });

        const availableActions = actions.filter((action) => action.available);
        if (availableActions.length === 0) {
          return null;
        }

        const selectedCount = availableActions.filter((action) => action.isSelected).length;

        return {
          module_code: moduleCode,
          module_name: moduleName,
          group_label: moduleGroupLabel,
          actions,
          availableCount: availableActions.length,
          selectedCount,
          allSelected: selectedCount === availableActions.length,
        };
      })
      .filter(Boolean);
  }, [modulesCatalog, permissions, modulesDefinitionMap, roleModuleMap, selectedPermissions]);

  const groupedModules = useMemo(() => {
    return groupModulesBySidebar(modulesForTable);
  }, [modulesForTable]);

  const applyRolePermissionsUpdate = async (nextSelected, { silent = false } = {}) => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await updateRolePermissionsSupabase(selectedRoleId, nextSelected);
      setSelectedPermissions(nextSelected);
    } catch (error) {
      console.error('Error saving permissions:', error);
      if (!silent) {
        alert(error.message || 'Lỗi khi cập nhật phân quyền');
      }
      fetchRolePermissions(selectedRoleId);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionToggle = async (permissionId) => {
    if (!permissionId || saving || !canModify) return;
    const nextSelected = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter((id) => id !== permissionId)
      : [...selectedPermissions, permissionId];
    await applyRolePermissionsUpdate(nextSelected, { silent: true });
  };

  const handleModuleToggle = async (moduleCode) => {
    if (saving || !canModify) return;
    const moduleRow = modulesForTable.find((module) => module.module_code === moduleCode);
    if (!moduleRow) return;
    const targetIds = moduleRow.actions
      .filter((action) => action.available)
      .map((action) => action.permissionId);
    if (targetIds.length === 0) return;

    const allSelected = targetIds.every((id) => selectedPermissions.includes(id));
    const nextSelected = allSelected
      ? selectedPermissions.filter((id) => !targetIds.includes(id))
      : Array.from(new Set([...selectedPermissions, ...targetIds]));
    await applyRolePermissionsUpdate(nextSelected, { silent: true });
  };

  const handleSelectAll = () => {
    if (!canModify) return;
    const allIds = modulesForTable
      .flatMap((module) => module.actions)
      .filter((action) => action.available)
      .map((action) => action.permissionId);
    setSelectedPermissions(Array.from(new Set(allIds)));
  };

  const handleDeselectAll = () => {
    if (!canModify) return;
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      alert('Vui lòng chọn vai trò trước khi lưu');
      return;
    }

    if (!canModify) {
      alert('Bạn không có quyền cập nhật phân quyền');
      return;
    }

    setSaving(true);
    try {
      await updateRolePermissionsSupabase(selectedRoleId, selectedPermissions);
      alert('Phân quyền đã được cập nhật thành công');
      fetchRolePermissions(selectedRoleId);
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert(error.message || 'Lỗi khi lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  const isBusy = rolesLoading || modulesLoading || loadingRolePermissions;

  const filteredRoles = roles;

  return (
    <div className="space-y-6">
      {rolesLoading && (
        <div className="text-center py-12 text-gray-600">Đang tải danh sách vai trò...</div>
      )}

      {!rolesLoading && roles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 space-y-3">
            <CardTitle>Chưa có vai trò nào</CardTitle>
            <CardDescription>
              Bạn cần tạo tối thiểu một vai trò trước khi cấu hình phân quyền.
            </CardDescription>
            <Button onClick={() => navigate('/roles/new')}>Tạo vai trò mới</Button>
          </CardContent>
        </Card>
      )}

      {roles.length > 0 && modulesLoading && (
        <div className="text-center py-12 text-gray-600">Đang tải cấu trúc phân quyền...</div>
      )}

      {roles.length > 0 && !modulesLoading && loadingRolePermissions && (
        <div className="text-center py-12 text-gray-600">Đang tải phân quyền của vai trò...</div>
      )}

      {roles.length > 0 && !isBusy && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Vai trò</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredRoles.map((role) => {
                  const isActive = String(role.id) === String(selectedRoleId);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(String(role.id))}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      disabled={saving}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{role.name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            role.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {role.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
          </div>
                    </button>
                  );
                })}
                {filteredRoles.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Không tìm thấy vai trò phù hợp.</p>
                )}
          </div>
            </CardContent>
          </Card>

      <div className="space-y-4">
            {groupedModules.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-600">
                  Chưa có module nào được định nghĩa cho phân quyền.
                </CardContent>
              </Card>
            ) : (
              <Card>
              <CardHeader>
                  <CardTitle>Ma trận phân quyền</CardTitle>
                  {!canModify && (
                    <CardDescription>Bạn chỉ có quyền xem phân quyền. Liên hệ quản trị viên để chỉnh sửa.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[70vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Module
                          </th>
                          {CORE_ACTIONS.map((action) => (
                            <th
                              key={action.key}
                              className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                              {action.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedModules.map((group) => (
                          <Fragment key={`group-${group.label}`}>
                            <tr className="bg-blue-50">
                              <td colSpan={CORE_ACTIONS.length + 1} className="px-6 py-3">
                                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                                  {group.label}
                                </h3>
                              </td>
                            </tr>
                            {group.modules.map((module) => (
                              <tr key={module.module_code} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 align-top">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-semibold text-gray-900">{module.module_name}</p>
                  <Button
                                      variant="ghost"
                    size="sm"
                    onClick={() => handleModuleToggle(module.module_code)}
                                      disabled={!canModify || module.availableCount === 0 || saving}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      {module.allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </Button>
                </div>
                                </td>
                                {module.actions.map((action) => (
                                  <td key={action.key} className="px-6 py-4 text-center">
                                    {action.available ? (
                                      <button
                                        type="button"
                                        onClick={() => handlePermissionToggle(action.permissionId)}
                                        disabled={saving || !canModify}
                                        className={`h-5 w-5 inline-flex items-center justify-center rounded border transition-colors ${
                                          action.isSelected
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-gray-300 bg-white hover:border-blue-400'
                                        }`}
                                      >
                                        {action.isSelected ? '✓' : ''}
                                      </button>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                                  </div>
                  {saving && (
                    <div className="flex items-center gap-2 p-4 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu thay đổi...
                          </div>
                  )}
              </CardContent>
            </Card>
            )}
          </div>
      </div>
      )}
    </div>
  );
};

export default PermissionsManager;

