import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchRolePermissions as fetchRolePermissionsSupabase } from '../services/supabasePermissions';

const PermissionContext = createContext({
  loading: true,
  permissions: {},
  hasPermission: () => false,
  refreshPermissions: () => {},
  lastUpdated: null
});

export const PermissionProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [permissionsMap, setPermissionsMap] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role_code === 'admin';

  const loadPermissions = useCallback(
    async (currentUser) => {
      if (!currentUser?.role_id) {
        setPermissionsMap({});
        setError(null);
        setLastUpdated(Date.now());
        return;
      }

      if (isAdmin) {
        // Admin có tất cả quyền
        setPermissionsMap({ __all__: new Set(['view', 'create', 'update', 'delete']) });
        setError(null);
        setLastUpdated(Date.now());
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const modules = await fetchRolePermissionsSupabase(currentUser.role_id);
        const mapped = {};
        (modules || []).forEach((module) => {
          const actions = module.permissions
            ?.filter((permission) => permission.assigned)
            ?.map((permission) => permission.action) || [];
          mapped[module.module_code] = new Set(actions);
        });
        setPermissionsMap(mapped);
        setLastUpdated(Date.now());
      } catch (err) {
        console.error('[permissions] Failed to load role permissions:', err);
        setPermissionsMap({});
        setError(err);
        setLastUpdated(Date.now());
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPermissionsMap({});
      setError(null);
      setLastUpdated(Date.now());
      return;
    }
    loadPermissions(user);
  }, [user, authLoading, loadPermissions]);

  const hasPermission = useCallback(
    (moduleCode, action = 'view') => {
      if (!moduleCode) return false;
      if (isAdmin) return true;
      const normalizedAction = action || 'view';
      const allowedActions = permissionsMap[moduleCode];
      if (!allowedActions) {
        return false;
      }
      return allowedActions.has(normalizedAction);
    },
    [permissionsMap, isAdmin]
  );

  const value = useMemo(
    () => ({
      loading: authLoading || loading,
      permissions: permissionsMap,
      hasPermission,
      refreshPermissions: () => loadPermissions(user),
      lastUpdated,
      error
    }),
    [authLoading, loading, permissionsMap, hasPermission, loadPermissions, user, lastUpdated, error]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermissions = () => useContext(PermissionContext);


