import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [],
    status: 'active'
  });

  const availablePermissions = [
    { value: 'branches', label: 'Chi nhánh' },
    { value: 'rooms', label: 'Phòng trọ' },
    { value: 'tenants', label: 'Khách thuê' },
    { value: 'contracts', label: 'Hợp đồng' },
    { value: 'invoices', label: 'Hóa đơn' },
    { value: 'transactions', label: 'Sổ thu chi' },
    { value: 'financial-categories', label: 'Danh mục tài chính' },
    { value: 'accounts', label: 'Tài khoản' },
    { value: 'assets', label: 'Tài sản' },
    { value: 'images', label: 'Hình ảnh' },
    { value: 'services', label: 'Dịch vụ' },
    { value: 'vehicles', label: 'Phương tiện' },
    { value: 'users', label: 'Nhân viên' },
    { value: 'roles', label: 'Vai trò' },
    { value: 'settings', label: 'Thiết lập' }
  ];

  useEffect(() => {
    if (id && id !== 'new') {
      loadRole();
    }
  }, [id]);

  const loadRole = async () => {
    try {
      const response = await api.get(`/roles/${id}`);
      setFormData(response.data);
    } catch (error) {
      console.error('Error loading role:', error);
      alert('Lỗi khi tải thông tin vai trò');
      navigate('/roles');
    }
  };

  const handlePermissionChange = (permission, checked) => {
    if (permission === '*') {
      // Toggle all permissions
      setFormData({
        ...formData,
        permissions: checked ? ['*'] : []
      });
    } else {
      // Toggle individual permission
      if (checked) {
        setFormData({
          ...formData,
          permissions: [...formData.permissions.filter(p => p !== '*'), permission]
        });
      } else {
        setFormData({
          ...formData,
          permissions: formData.permissions.filter(p => p !== permission)
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id && id !== 'new') {
        await api.put(`/roles/${id}`, formData);
        navigate(`/roles/${id}`);
      } else {
        const response = await api.post('/roles', formData);
        navigate(`/roles/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu vai trò');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/roles')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa vai trò' : 'Thêm vai trò'}
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
                  disabled={id && id !== 'new'}
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
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quyền hạn cơ bản</CardTitle>
            <CardDescription>
              Chọn các module mà vai trò này có quyền truy cập. 
              Để phân quyền chi tiết (Xem, Thêm, Sửa, Xóa, Xuất, In), vui lòng sử dụng tính năng "Phân quyền" sau khi tạo vai trò.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes('*')}
                    onChange={(e) => handlePermissionChange('*', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-blue-900">Tất cả quyền</p>
                    <p className="text-sm text-blue-700">
                      Cấp quyền truy cập đầy đủ vào tất cả các module (bao gồm tất cả các hành động)
                    </p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t">
                {availablePermissions.map((perm) => (
                  <label
                    key={perm.value}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.value) || formData.permissions.includes('*')}
                      onChange={(e) => handlePermissionChange(perm.value, e.target.checked)}
                      disabled={formData.permissions.includes('*')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Sau khi tạo vai trò, bạn có thể vào chi tiết vai trò và click nút "Phân quyền" 
                  để cấu hình quyền chi tiết cho từng module (Xem, Thêm, Sửa, Xóa, Xuất, In).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/roles')}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;

