import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = useMemo(() => id && id !== 'new', [id]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: isEditing ? '' : '1',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    role: 'user',
    status: 'active',
    branch_ids: []
  });

  useEffect(() => {
    loadBranches();
    if (isEditing) {
      loadUser();
    } else {
      setFormData((prev) => ({ ...prev, password: '1' }));
    }
  }, [id, isEditing]);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setFormData({
        ...response.data,
        password: '', // Don't show password
        branch_ids: response.data.branch_ids || []
      });
    } catch (error) {
      console.error('Error loading user:', error);
      alert('Lỗi khi tải thông tin nhân viên');
      navigate('/users');
    }
  };

  const handleBranchToggle = (branchId) => {
    const currentIds = formData.branch_ids || [];
    if (currentIds.includes(branchId)) {
      setFormData({ ...formData, branch_ids: currentIds.filter(id => id !== branchId) });
    } else {
      setFormData({ ...formData, branch_ids: [...currentIds, branchId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        password: formData.password && formData.password.trim() !== ''
          ? formData.password
          : isEditing
            ? undefined
            : '1',
        branch_ids: formData.branch_ids || []
      };
      
      if (id && id !== 'new') {
        await api.put(`/users/${id}`, data);
        navigate(`/users/${id}`);
      } else {
        const response = await api.post('/users', data);
        navigate(`/users/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu nhân viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa nhân viên' : 'Thêm nhân viên'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới vào hệ thống'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhân viên</CardTitle>
          <CardDescription>Điền thông tin nhân viên bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Tên đăng nhập</Label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label required={!isEditing}>Mật khẩu</Label>
                <input
                  type="password"
                  required={!isEditing}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEditing ? 'Để trống nếu không đổi' : 'Mật khẩu mặc định sẽ là 1'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {!isEditing && (
                  <p className="mt-1 text-xs text-gray-500">Nếu để trống, mật khẩu mặc định sẽ là <span className="font-semibold">1</span>.</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label required>Họ và tên</Label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Email</Label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Địa chỉ</Label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label required>Vai trò</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <Label required>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Chi nhánh quản lý</Label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <label key={branch.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.branch_ids?.includes(branch.id)}
                          onChange={() => handleBranchToggle(branch.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{branch.name}</span>
                      </label>
                    ))}
                    {branches.length === 0 && (
                      <p className="text-sm text-gray-500">Chưa có chi nhánh</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/users')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="user-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserForm;

