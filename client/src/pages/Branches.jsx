import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager_name: '',
    status: 'active'
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
      alert('Lỗi khi tải danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, formData);
      } else {
        await api.post('/branches', formData);
      }
      setShowModal(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', manager_name: '', status: 'active' });
      loadBranches();
    } catch (error) {
      alert('Lỗi khi lưu chi nhánh');
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData(branch);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa chi nhánh này?')) return;
    try {
      await api.delete(`/branches/${id}`);
      loadBranches();
    } catch (error) {
      alert('Lỗi khi xóa chi nhánh');
    }
  };

  const openModal = () => {
    setEditingBranch(null);
    setFormData({ name: '', address: '', phone: '', manager_name: '', status: 'active' });
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Chi nhánh</h1>
          <p className="text-gray-600 mt-1">Quản lý các chi nhánh nhà trọ</p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm chi nhánh
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{branch.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      branch.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {branch.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {branch.address && (
                <p className="flex items-start gap-2">
                  <span className="font-medium">Địa chỉ:</span>
                  <span>{branch.address}</span>
                </p>
              )}
              {branch.phone && (
                <p className="flex items-start gap-2">
                  <span className="font-medium">SĐT:</span>
                  <span>{branch.phone}</span>
                </p>
              )}
              {branch.manager_name && (
                <p className="flex items-start gap-2">
                  <span className="font-medium">Quản lý:</span>
                  <span>{branch.manager_name}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(branch)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Sửa
              </button>
              <button
                onClick={() => handleDelete(branch.id)}
                className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingBranch ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chi nhánh *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
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
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên quản lý
                </label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
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
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBranch(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;

