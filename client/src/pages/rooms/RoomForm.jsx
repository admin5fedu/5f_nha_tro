import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { fetchBranches } from '../../services/supabaseBranches';
import { fetchRoomById, createRoom, updateRoom } from '../../services/supabaseRooms';
import { usePermissions } from '../../context/PermissionContext';

const RoomForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    branch_id: searchParams.get('branch_id') || '',
    room_number: '',
    floor: '',
    area: '',
    price: '',
    deposit: '',
    status: 'available',
    description: '',
    amenities: ''
  });
  const { hasPermission } = usePermissions();
  const isEditing = useMemo(() => id && id !== 'new', [id]);
  const canEdit = isEditing ? hasPermission('rooms', 'update') : hasPermission('rooms', 'create');

  useEffect(() => {
    loadBranches();
    if (isEditing) {
      loadRoom();
    }
  }, [id, isEditing]);

  const loadBranches = async () => {
    try {
      const { data } = await fetchBranches({ limit: 200 });
      setBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadRoom = async () => {
    try {
      const data = await fetchRoomById(id);
      if (!data) {
        alert('Không tìm thấy phòng');
        navigate('/rooms');
        return;
      }
      setFormData({
        branch_id: data.branch_id || '',
        room_number: data.room_number || '',
        floor: data.floor !== null && data.floor !== undefined ? String(data.floor) : '',
        area: data.area !== null && data.area !== undefined ? String(data.area) : '',
        price: data.price !== null && data.price !== undefined ? String(data.price) : '',
        deposit: data.deposit !== null && data.deposit !== undefined ? String(data.deposit) : '',
        status: data.status || 'available',
        description: data.description || '',
        amenities: data.amenities || ''
      });
    } catch (error) {
      console.error('Error loading room:', error);
      alert('Lỗi khi tải thông tin phòng');
      navigate('/rooms');
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
      const data = {
        ...formData,
        branch_id: parseInt(formData.branch_id),
        floor: formData.floor ? parseInt(formData.floor) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        price: parseFloat(formData.price),
        deposit: formData.deposit ? parseFloat(formData.deposit) : 0
      };
      if (isEditing) {
        await updateRoom(id, data);
        navigate(`/rooms/${id}`);
      } else {
        const created = await createRoom(data);
        navigate(`/rooms/${created.id}`);
      }
    } catch (error) {
      alert(error.message || 'Lỗi khi lưu phòng');
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
              Bạn chỉ có quyền xem thông tin phòng. Liên hệ quản trị viên để được cấp quyền tạo hoặc cập nhật phòng.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rooms')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? 'Sửa phòng' : 'Thêm phòng'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Cập nhật thông tin phòng' : 'Thêm phòng mới vào hệ thống'}
          </p>
        </div>
      </div>

      <form id="room-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin phòng</CardTitle>
            <CardDescription>Điền thông tin phòng bên dưới</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Chi nhánh</Label>
                  <select
                    required
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
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
                  <Label required>Số phòng</Label>
                  <input
                    type="text"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>Tầng</Label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>Diện tích (m²)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label required>Giá thuê (đ/tháng)</Label>
                  <input
                    type="number"
                    required
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>Tiền cọc (đ)</Label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    <option value="available">Trống</option>
                    <option value="occupied">Đã thuê</option>
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
                  disabled={!canEdit || loading}
                />
              </div>
              <div>
                <Label>Tiện ích</Label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="VD: Điều hòa, Wifi, Tủ lạnh..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!canEdit || loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/rooms')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="room-form" disabled={loading || !canEdit} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomForm;

