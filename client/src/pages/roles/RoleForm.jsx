import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { fetchRoleById, createRole, updateRole } from '../../services/supabaseRoles';
import { usePermissions } from '../../context/PermissionContext';

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active'
  });
  const { hasPermission } = usePermissions();
  const isEditing = useMemo(() => id && id !== 'new', [id]);
  const canEdit = isEditing ? hasPermission('roles', 'update') : hasPermission('roles', 'create');

  useEffect(() => {
    if (isEditing) {
      loadRole();
    }
  }, [id, isEditing]);

  const loadRole = async () => {
    try {
      const data = await fetchRoleById(id);
      if (!data) {
        alert('Không tìm thấy vai trò');
        navigate('/roles');
        return;
      }
      setFormData({
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        status: data.status || 'active'
      });
    } catch (error) {
      console.error('Error loading role:', error);
      alert('Lỗi khi tải thông tin vai trò');
      navigate('/roles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Bạn không có quyền thực hiện thao tác này');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await updateRole(id, formData);
        navigate(`/roles/${id}`);
      } else {
        const created = await createRole(formData);
        navigate(`/roles/${created.id}`);
      }
    } catch (error) {
      alert(error.message || 'Lỗi khi lưu vai trò');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-gray-600">
              Bạn chỉ có quyền xem thông tin vai trò. Liên hệ quản trị viên để được cấp quyền tạo hoặc cập nhật vai trò.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/roles')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? 'Sửa vai trò' : 'Thêm vai trò'}
          </h1>
          <p className="text-gray-600 mt-1">Quản lý vai trò và phân quyền</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Tên vai trò *</Label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Quản lý"
                  required
                  disabled={!canEdit || loading}
                />
              </div>
              <div>
                <Label>Mã vai trò *</Label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                  placeholder="manager"
                  required
                  disabled={isEditing || !canEdit || loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mã vai trò không thể thay đổi sau khi tạo
                </p>
              </div>
              <div>
                <Label>Mô tả</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Mô tả về vai trò này..."
                  disabled={!canEdit || loading}
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!canEdit || loading}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/roles')}
            className="min-w-[120px]"
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading || !canEdit} className="min-w-[120px]">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;

