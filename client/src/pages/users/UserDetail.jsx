import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { ArrowLeft, Edit, Trash2, UserCog, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { fetchUserById, deleteUser as deleteUserSupabase } from '../../services/supabaseUsers';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const data = await fetchUserById(id);
      setUser(data);
    } catch (error) {
      console.error('Error loading user:', error);
      alert('Lỗi khi tải thông tin nhân viên');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!hasPermission('users', 'delete')) {
      alert('Bạn không có quyền xóa nhân viên');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await deleteUserSupabase(id);
      navigate('/users');
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa nhân viên');
    }
  };

  const isSelf = currentUser && String(currentUser.id) === String(id);
  const canUpdate = hasPermission('users', 'update');
  const canDelete = hasPermission('users', 'delete');

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">Không tìm thấy nhân viên</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{user.full_name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết nhân viên</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canUpdate && (
              <Button onClick={() => navigate(`/users/${id}/edit`)}>
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
              <div
                className={`p-3 rounded-lg ${
                  user.roles?.code === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                }`}
              >
                <UserCog
                  className={`h-6 w-6 ${
                    user.roles?.code === 'admin' ? 'text-purple-600' : 'text-blue-600'
                  }`}
                />
              </div>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{user.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tên đăng nhập</p>
                <p className="text-gray-800 mt-1">@{user.username}</p>
              </div>
              {user.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-800 mt-1 flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    {user.email}
                  </p>
                </div>
              )}
              {user.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                  <p className="text-gray-800 mt-1 flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {user.phone}
                  </p>
                </div>
              )}
              {user.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                  <p className="text-gray-800 mt-1 flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    {user.address}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Vai trò</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    user.roles?.code === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user.roles?.name || user.roles?.code || '—'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi nhánh quản lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.branch_names && user.branch_names.length > 0 ? (
                <div className="space-y-2">
                  {user.branch_names.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Building2 size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa được phân công chi nhánh</p>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-gray-800 mt-1">
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSelf && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Việc đổi mật khẩu hiện được quản lý trực tiếp trong Supabase Auth. Vui lòng sử dụng chức năng reset
                password của Supabase hoặc liên hệ quản trị viên.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDetail;

