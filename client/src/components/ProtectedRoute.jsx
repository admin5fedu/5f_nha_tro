import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';

const resolveRoutePermission = (pathname) => {
  if (!pathname) return null;
  const path = pathname.toLowerCase();

  if (path === '/dashboard') {
    return { module: 'dashboard', action: 'view' };
  }

  const matchCrudModule = (basePath, moduleCode) => {
    if (!path.startsWith(basePath)) return null;
    if (path === basePath) return { module: moduleCode, action: 'view' };
    if (path === `${basePath}/new`) return { module: moduleCode, action: 'create' };
    if (path.endsWith('/edit')) return { module: moduleCode, action: 'update' };
    return { module: moduleCode, action: 'view' };
  };

  const crudModules = [
    { basePath: '/branches', module: 'branches' },
    { basePath: '/rooms', module: 'rooms' },
    { basePath: '/assets', module: 'assets' },
    { basePath: '/images', module: 'images' },
    { basePath: '/services', module: 'services' },
    { basePath: '/meter-readings', module: 'meter-readings' },
    { basePath: '/tenants', module: 'tenants' },
    { basePath: '/vehicles', module: 'vehicles' },
    { basePath: '/tasks', module: 'tasks' },
    { basePath: '/contracts', module: 'contracts' },
    { basePath: '/invoices', module: 'invoices' },
    { basePath: '/accounts', module: 'accounts' },
    { basePath: '/transactions', module: 'transactions' },
    { basePath: '/financial-categories', module: 'financial-categories' },
    { basePath: '/users', module: 'users' },
    { basePath: '/roles', module: 'roles' },
    { basePath: '/permissions', module: 'permissions' },
    { basePath: '/settings', module: 'settings' }
  ];

  for (const entry of crudModules) {
    const match = matchCrudModule(entry.basePath, entry.module);
    if (match) return match;
  }

  if (path.startsWith('/reports/')) {
    if (path.includes('profit-loss')) return { module: 'profit-loss', action: 'view' };
    if (path.includes('accounts-receivable')) return { module: 'accounts-receivable', action: 'view' };
    if (path.includes('revenue')) return { module: 'revenue', action: 'view' };
    if (path.includes('cashflow')) return { module: 'cashflow', action: 'view' };
  }

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { loading: permissionLoading, hasPermission } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang kiểm tra phân quyền...</div>
      </div>
    );
  }

  const requiredPermission = resolveRoutePermission(location.pathname);
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Bạn không có quyền truy cập nội dung này</h1>
        <p className="text-gray-600 max-w-lg">
          Vui lòng liên hệ quản trị viên để được cấp quyền hoặc chuyển sang chức năng khác.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

