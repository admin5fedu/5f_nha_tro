import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, User, Phone, Mail } from 'lucide-react';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_card: '',
    address: '',
    emergency_contact: '',
    notes: ''
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await api.get('/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error('Error loading tenants:', error);
      alert('Lỗi khi tải danh sách khách thuê');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await api.put(`/tenants/${editingTenant.id}`, formData);
      } else {
        await api.post('/tenants', formData);
      }
      setShowModal(false);
      setEditingTenant(null);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        id_card: '',
        address: '',
        emergency_contact: '',
        notes: ''
      });
      loadTenants();
    } catch (error) {
      alert('Lỗi khi lưu khách thuê');
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData(tenant);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa khách thuê này?')) return;
    try {
      await api.delete(`/tenants/${id}`);
      loadTenants();
    } catch (error) {
      alert('Lỗi khi xóa khách thuê');
    }
  };

  const openModal = () => {
    setEditingTenant(null);
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      id_card: '',
      address: '',
      emergency_contact: '',
      notes: ''
    });
    setShowModal(true);
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone?.includes(searchTerm) ||
      tenant.id_card?.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Khách thuê</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin khách thuê</p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm khách thuê
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, SĐT, CMND..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{tenant.full_name}</h3>
                  {tenant.id_card && (
                    <p className="text-sm text-gray-600">CMND: {tenant.id_card}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {tenant.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <span>{tenant.phone}</span>
                </p>
              )}
              {tenant.email && (
                <p className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <span>{tenant.email}</span>
                </p>
              )}
              {tenant.address && (
                <p className="flex items-start gap-2">
                  <span className="font-medium">Địa chỉ:</span>
                  <span className="flex-1">{tenant.address}</span>
                </p>
              )}
              {tenant.emergency_contact && (
                <p className="flex items-start gap-2">
                  <span className="font-medium">Liên hệ khẩn cấp:</span>
                  <span>{tenant.emergency_contact}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(tenant)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Sửa
              </button>
              <button
                onClick={() => handleDelete(tenant.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingTenant ? 'Sửa khách thuê' : 'Thêm khách thuê'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                    CMND/CCCD
                  </label>
                  <input
                    type="text"
                    value={formData.id_card}
                    onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
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
                    Liên hệ khẩn cấp
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTenant(null);
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

export default Tenants;

