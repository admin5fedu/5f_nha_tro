import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, DoorOpen, Search, Filter } from 'lucide-react';
import { objectContainsTerm } from '../utils/search';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    branch_id: '',
    room_number: '',
    floor: '',
    area: '',
    price: '',
    deposit: '',
    status: 'available',
    description: '',
    amenities: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsRes, branchesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/branches')
      ]);
      setRooms(roomsRes.data);
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
        branch_id: parseInt(formData.branch_id),
        floor: formData.floor ? parseInt(formData.floor) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        price: parseFloat(formData.price),
        deposit: formData.deposit ? parseFloat(formData.deposit) : 0
      };
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, data);
      } else {
        await api.post('/rooms', data);
      }
      setShowModal(false);
      setEditingRoom(null);
      setFormData({
        branch_id: '',
        room_number: '',
        floor: '',
        area: '',
        price: '',
        deposit: '',
        status: 'available',
        description: '',
        amenities: ''
      });
      loadData();
    } catch (error) {
      alert('Lỗi khi lưu phòng');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      ...room,
      floor: room.floor || '',
      area: room.area || '',
      deposit: room.deposit || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      loadData();
    } catch (error) {
      alert('Lỗi khi xóa phòng');
    }
  };

  const openModal = () => {
    setEditingRoom(null);
    setFormData({
      branch_id: '',
      room_number: '',
      floor: '',
      area: '',
      price: '',
      deposit: '',
      status: 'available',
      description: '',
      amenities: ''
    });
    setShowModal(true);
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = !searchTerm || objectContainsTerm(room, searchTerm);
    const matchesBranch = !filterBranch || room.branch_id === parseInt(filterBranch);
    const matchesStatus = !filterStatus || room.status === filterStatus;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Phòng trọ</h1>
          <p className="text-gray-600 mt-1">Quản lý các phòng trọ</p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm phòng
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="available">Trống</option>
            <option value="occupied">Đã thuê</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 ${
              room.status === 'available'
                ? 'border-green-500'
                : room.status === 'occupied'
                ? 'border-red-500'
                : 'border-yellow-500'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-lg ${
                    room.status === 'available'
                      ? 'bg-green-100'
                      : room.status === 'occupied'
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                  }`}
                >
                  <DoorOpen
                    className={`h-6 w-6 ${
                      room.status === 'available'
                        ? 'text-green-600'
                        : room.status === 'occupied'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Phòng {room.room_number}</h3>
                  <p className="text-sm text-gray-600">{room.branch_name}</p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  room.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : room.status === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {room.status === 'available'
                  ? 'Trống'
                  : room.status === 'occupied'
                  ? 'Đã thuê'
                  : 'Bảo trì'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p className="flex items-center justify-between">
                <span className="font-medium">Giá thuê:</span>
                <span className="font-bold text-blue-600">
                  {new Intl.NumberFormat('vi-VN').format(room.price)} đ/tháng
                </span>
              </p>
              {room.area && (
                <p className="flex items-center justify-between">
                  <span className="font-medium">Diện tích:</span>
                  <span>{room.area} m²</span>
                </p>
              )}
              {room.floor && (
                <p className="flex items-center justify-between">
                  <span className="font-medium">Tầng:</span>
                  <span>{room.floor}</span>
                </p>
              )}
              {room.deposit > 0 && (
                <p className="flex items-center justify-between">
                  <span className="font-medium">Tiền cọc:</span>
                  <span>{new Intl.NumberFormat('vi-VN').format(room.deposit)} đ</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(room)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Sửa
              </button>
              <button
                onClick={() => handleDelete(room.id)}
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
              {editingRoom ? 'Sửa phòng' : 'Thêm phòng'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi nhánh *
                  </label>
                  <select
                    required
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Chọn chi nhánh</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số phòng *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tầng
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diện tích (m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá thuê (đ/tháng) *
                  </label>
                  <input
                    type="number"
                    required
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiền cọc (đ)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
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
                    <option value="available">Trống</option>
                    <option value="occupied">Đã thuê</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiện ích
                </label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="VD: Điều hòa, Wifi, Tủ lạnh..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoom(null);
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

export default Rooms;

