import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, User, Mail, Phone, MapPin, Shield, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { objectContainsTerm } from '../utils/search';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    role: 'user',
    status: 'active',
    branch_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches')
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        password: formData.password || undefined, // Only send password if provided
        branch_ids: formData.branch_ids || []
      };
      
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data);
      } else {
        if (!data.password) {
          alert('Vui lòng nhập mật khẩu cho tài khoản mới');
          return;
        }
        await api.post('/users', data);
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        address: '',
        role: 'user',
        status: 'active',
        branch_ids: []
      });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu nhân viên');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      ...user,
      password: '', // Don't show password
      branch_ids: user.branch_ids || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa nhân viên');
    }
  };

  const openModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      phone: '',
      address: '',
      role: 'user',
      status: 'active',
      branch_ids: []
    });
    setShowModal(true);
  };

  const handleBranchToggle = (branchId) => {
    const currentIds = formData.branch_ids || [];
    if (currentIds.includes(branchId)) {
      setFormData({ ...formData, branch_ids: currentIds.filter(id => id !== branchId) });
    } else {
      setFormData({ ...formData, branch_ids: [...currentIds, branchId] });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchTerm || objectContainsTerm(user, searchTerm);
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Nhân viên</h1>
          <p className="text-gray-600 mt-1">Quản lý tài khoản và phân quyền nhân viên</p>
        </div>
        <Button onClick={openModal} className="flex items-center gap-2">
          <Plus size={20} />
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, username, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <User className={`h-6 w-6 ${
                      user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.full_name}</CardTitle>
                    <CardDescription>@{user.username}</CardDescription>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {user.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{user.email}</span>
                  </p>
                )}
                {user.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{user.phone}</span>
                  </p>
                )}
                {user.address && (
                  <p className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span className="flex-1">{user.address}</span>
                  </p>
                )}
                {user.branch_names && user.branch_names.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Building2 size={16} className="text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-700 mb-1">Chi nhánh quản lý:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.branch_names.map((name, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <p className={`text-xs px-2 py-1 rounded inline-block ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </p>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleEdit(user)}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit size={16} className="mr-2" />
                  Sửa
                </Button>
                <Button
                  onClick={() => handleDelete(user.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 size={16} className="mr-2" />
                  Xóa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingUser ? 'Sửa nhân viên' : 'Thêm nhân viên'}
              </CardTitle>
              <CardDescription>
                {editingUser ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới vào hệ thống'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu {!editingUser && '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? 'Để trống nếu không đổi' : ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngừng hoạt động</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chi nhánh quản lý
                    </label>
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
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1">
                    Lưu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Users;

