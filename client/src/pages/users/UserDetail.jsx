import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, UserCog, Mail, Phone, MapPin, Building2, Shield, Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
      alert('Lỗi khi tải thông tin nhân viên');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await api.delete(`/users/${id}`);
      navigate('/users');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa nhân viên');
    }
  };

  const isSelf = currentUser && String(currentUser.id) === String(id);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.newPassword || passwordForm.newPassword.trim().length < 4) {
      setPasswordError('Mật khẩu mới cần ít nhất 4 ký tự.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.put(`/users/${id}/password`, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Đổi mật khẩu thành công.');
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Không thể đổi mật khẩu.');
    } finally {
      setPasswordSaving(false);
    }
  };

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
            <Button onClick={() => navigate(`/users/${id}/edit`)}>
              <Edit size={16} className="mr-2" />
              Sửa
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" />
              Xóa
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
              }`}>
                <UserCog className={`h-6 w-6 ${
                  user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                }`} />
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
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : 'User'}
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
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Lock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Đổi mật khẩu</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="********"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Tối thiểu 4 ký tự"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordSaving} className="min-w-[160px]">
                    {passwordSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Cập nhật mật khẩu'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDetail;

