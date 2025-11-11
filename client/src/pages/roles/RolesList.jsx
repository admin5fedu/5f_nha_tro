import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { fetchRoles, deleteRole } from '../../services/supabaseRoles';
import { usePermissions } from '../../context/PermissionContext';

const RolesList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();
  const canView = hasPermission('roles', 'view');
  const canCreate = hasPermission('roles', 'create');
  const canUpdate = hasPermission('roles', 'update');
  const canDelete = hasPermission('roles', 'delete');

  useEffect(() => {
    if (canView) {
      loadRoles();
    } else {
      setLoading(false);
    }
  }, [canView]);

  const loadRoles = async () => {
    try {
      const data = await fetchRoles();
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      alert('Lỗi khi tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!canDelete) {
      alert('Bạn không có quyền xóa vai trò');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa vai trò "${name}"?`)) return;
    try {
      await deleteRole(id);
      loadRoles();
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa vai trò');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-600">
          Bạn không có quyền xem danh sách vai trò.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {canCreate && (
          <Button onClick={() => navigate('/roles/new')}>
            <Plus size={16} className="mr-2" />
            Thêm vai trò
          </Button>
        )}
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có vai trò nào</p>
            {canCreate && (
              <Button onClick={() => navigate('/roles/new')}>
                <Plus size={16} className="mr-2" />
                Thêm vai trò đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách vai trò ({roles.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mô tả</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${
                            role.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Shield className={`h-4 w-4 ${
                              role.status === 'active' ? 'text-green-600' : 'text-gray-500'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{role.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-700">{role.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 line-clamp-2">{role.description || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{role.user_count ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            role.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {role.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          {canView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/roles/${role.id}`)}
                            >
                              <Eye size={14} />
                            </Button>
                          )}
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/roles/${role.id}/edit`)}
                            >
                              <Edit size={14} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(role.id, role.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RolesList;

