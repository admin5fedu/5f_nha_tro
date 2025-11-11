import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Shield, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { fetchRoleById, deleteRole } from '../../services/supabaseRoles';
import { usePermissions } from '../../context/PermissionContext';

const RoleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();
  const canView = hasPermission('roles', 'view');
  const canUpdate = hasPermission('roles', 'update');
  const canDelete = hasPermission('roles', 'delete');

  useEffect(() => {
    if (canView) {
      loadRole();
    } else {
      setLoading(false);
    }
  }, [id, canView]);

  const loadRole = async () => {
    try {
      const data = await fetchRoleById(id);
      if (!data) {
        alert('Không tìm thấy vai trò');
        navigate('/roles');
        return;
      }
      setRole(data);
    } catch (error) {
      console.error('Error loading role:', error);
      alert('Lỗi khi tải thông tin vai trò');
      navigate('/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      alert('Bạn không có quyền xóa vai trò');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa vai trò này?')) return;
    try {
      await deleteRole(id);
      navigate('/roles');
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
          Bạn không có quyền xem thông tin vai trò.
        </CardContent>
      </Card>
    );
  }

  if (!role) {
    return <div className="text-center py-8">Không tìm thấy vai trò</div>;
  }

  const availablePermissions = [
    'branches', 'rooms', 'tenants', 'contracts', 'invoices',
    'transactions', 'financial-categories', 'accounts', 'assets',
    'images', 'services', 'vehicles', 'users', 'roles', 'settings'
  ];

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/roles')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{role.name}</h1>
              <p className="text-gray-600 mt-1">Thông tin chi tiết của vai trò</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canUpdate && (
              <Button onClick={() => navigate(`/roles/${id}/edit`)}>
                <Edit size={16} className="mr-2" />
                Sửa
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 size={16} className="mr-2" />
                Xóa
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                role.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Shield className={`h-6 w-6 ${
                  role.status === 'active' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tên vai trò</p>
                <p className="text-gray-800 mt-1 font-semibold text-lg">{role.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mã vai trò</p>
                <p className="text-gray-800 mt-1 font-mono">{role.code}</p>
              </div>
              {role.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mô tả</p>
                  <p className="text-gray-800 mt-1">{role.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    role.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {role.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
              {role.user_count !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Số người dùng</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-800 font-semibold">{role.user_count} người dùng</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quản lý phân quyền</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                Việc cấp quyền cho vai trò đã được chuyển sang module <span className="font-medium text-gray-800">Phân quyền</span>.
              </p>
              <p>
                Hãy sử dụng module đó để xem hoặc cập nhật quyền xem, thêm, sửa, xóa cho vai trò này.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/permissions')}
                className="bg-white"
              >
                Đi tới module Phân quyền
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleDetail;

