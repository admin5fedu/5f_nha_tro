import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const AssetForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'furniture',
    description: '',
    value: '',
    status: 'good',
    purchase_date: '',
    location_type: searchParams.get('location_type') || 'room',
    room_id: searchParams.get('room_id') || '',
    branch_id: searchParams.get('branch_id') || '',
    serial_number: '',
    manufacturer: '',
    model: '',
    warranty_expiry: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
    if (id && id !== 'new') {
      loadAsset();
    }
  }, [id]);

  useEffect(() => {
    if (formData.location_type === 'room') {
      loadRooms();
    }
  }, [formData.location_type]);

  const loadData = async () => {
    try {
      const [branchesRes, roomsRes] = await Promise.all([
        api.get('/branches'),
        api.get('/rooms')
      ]);
      setBranches(branchesRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadAsset = async () => {
    try {
      const response = await api.get(`/assets/${id}`);
      setFormData({
        ...response.data,
        value: response.data.value || '',
        purchase_date: response.data.purchase_date || '',
        warranty_expiry: response.data.warranty_expiry || '',
        room_id: response.data.room_id || '',
        branch_id: response.data.branch_id || ''
      });
    } catch (error) {
      console.error('Error loading asset:', error);
      alert('Lỗi khi tải thông tin tài sản');
      navigate('/assets');
    }
  };

  // Format number with thousand separators
  const formatNumber = (value) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted number to numeric value
  const parseNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        value: parseFloat(parseNumber(formData.value)) || 0,
        room_id: formData.location_type === 'room' ? (formData.room_id ? parseInt(formData.room_id) : null) : null,
        branch_id: formData.location_type === 'branch' ? (formData.branch_id ? parseInt(formData.branch_id) : null) : null,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null
      };
      if (id && id !== 'new') {
        await api.put(`/assets/${id}`, data);
        navigate(`/assets/${id}`);
      } else {
        const response = await api.post('/assets', data);
        navigate(`/assets/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu tài sản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa tài sản' : 'Thêm tài sản'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin tài sản' : 'Thêm tài sản mới vào hệ thống'}
          </p>
        </div>
      </div>

      <form id="asset-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Điền thông tin cơ bản về tài sản</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label required>Tên tài sản</Label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Loại tài sản</Label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="furniture">Nội thất</option>
                    <option value="equipment">Thiết bị</option>
                    <option value="appliance">Đồ gia dụng</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <Label required>Trạng thái</Label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="good">Tốt</option>
                    <option value="damaged">Hỏng</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Mô tả</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Giá trị (đ)</Label>
                  <input
                    type="text"
                    required
                    value={formatNumber(formData.value)}
                    onChange={(e) => setFormData({ ...formData, value: parseNumber(e.target.value) })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label>Ngày mua</Label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vị trí */}
        <Card>
          <CardHeader>
            <CardTitle>Vị trí</CardTitle>
            <CardDescription>Chọn vị trí gắn tài sản (phòng hoặc chi nhánh)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label required>Loại vị trí</Label>
                <select
                  required
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value, room_id: '', branch_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="room">Phòng</option>
                  <option value="branch">Chi nhánh</option>
                </select>
              </div>
              {formData.location_type === 'room' && (
                <div>
                  <Label required>Phòng</Label>
                  <select
                    required
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Chọn phòng</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Phòng {room.room_number} - {room.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {formData.location_type === 'branch' && (
                <div>
                  <Label required>Chi nhánh</Label>
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thông tin chi tiết */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chi tiết</CardTitle>
            <CardDescription>Thông tin chi tiết về tài sản (tùy chọn)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Số serial</Label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label>Nhà sản xuất</Label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label>Hết hạn bảo hành</Label>
                  <input
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <Label>Ghi chú</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/assets')}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" form="asset-form" disabled={loading} className="flex-1">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AssetForm;

