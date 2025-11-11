import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Building2, DoorOpen, Plus, Eye, Image as ImageIcon, Package } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { fetchBranchById, deleteBranch } from '../../services/supabaseBranches';
import api from '../../services/api';
import { usePermissions } from '../../context/PermissionContext';

const BranchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const { hasPermission, loading: permLoading } = usePermissions();
  const canView = hasPermission('branches', 'view');
  const canUpdate = hasPermission('branches', 'update');
  const canDelete = hasPermission('branches', 'delete');

  useEffect(() => {
    if (permLoading) return;
    if (!hasPermission('branches', 'view')) {
      setLoading(false);
      return;
    }
    loadBranch();
    loadRooms();
  }, [id, permLoading, hasPermission]);

  const loadBranch = async () => {
    try {
      const data = await fetchBranchById(id);
      if (!data) {
        alert('Không tìm thấy chi nhánh');
        navigate('/branches');
        return;
      }
      setBranch(data);
    } catch (error) {
      console.error('Error loading branch:', error);
      alert('Lỗi khi tải thông tin chi nhánh');
      navigate('/branches');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get(`/rooms?branch_id=${id}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      alert('Bạn không có quyền xóa chi nhánh');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa chi nhánh này?')) return;
    try {
      await deleteBranch(id);
      navigate('/branches');
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa chi nhánh');
    }
  };

  if (loading || permLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-600">
          Bạn không có quyền xem thông tin chi nhánh.
        </CardContent>
      </Card>
    );
  }

  if (!branch) {
    return <div className="text-center py-8">Không tìm thấy chi nhánh</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/branches')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{branch.name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết chi nhánh</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canUpdate && (
              <Button onClick={() => navigate(`/branches/${id}/edit`)}>
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
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tên chi nhánh</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{branch.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                <p className="text-gray-800 mt-1">{branch.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                <p className="text-gray-800 mt-1">{branch.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Quản lý</p>
                <p className="text-gray-800 mt-1">{branch.manager_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    branch.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {branch.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khác</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-gray-800 mt-1">
                  {new Date(branch.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {branch.updated_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                  <p className="text-gray-800 mt-1">
                    {new Date(branch.updated_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Tổng số phòng</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{rooms.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phòng trống</p>
                <p className="text-lg font-semibold text-green-600 mt-1">
                  {rooms.filter(r => r.status === 'available').length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phòng đã thuê</p>
                <p className="text-lg font-semibold text-red-600 mt-1">
                  {rooms.filter(r => r.status === 'occupied').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Representative Information */}
      {branch.representative_name && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin người đại diện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tên người đại diện</p>
                <p className="text-gray-800 mt-1 font-semibold">{branch.representative_name}</p>
              </div>
              {branch.representative_position && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Chức vụ</p>
                  <p className="text-gray-800 mt-1">{branch.representative_position}</p>
                </div>
              )}
              {branch.representative_id_card && (
                <div>
                  <p className="text-sm font-medium text-gray-500">CMND/CCCD</p>
                  <p className="text-gray-800 mt-1">{branch.representative_id_card}</p>
                </div>
              )}
              {branch.representative_phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                  <p className="text-gray-800 mt-1">{branch.representative_phone}</p>
                </div>
              )}
              {branch.representative_address && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                  <p className="text-gray-800 mt-1">{branch.representative_address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Account Information */}
      {(branch.account_id || branch.account_number || branch.account_holder || branch.bank_name) && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản ngân hàng</CardTitle>
            {branch.account_name && (
              <CardDescription>Tài khoản: {branch.account_name}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branch.account_number && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Số tài khoản</p>
                  <p className="text-gray-800 mt-1 font-semibold text-lg">{branch.account_number}</p>
                </div>
              )}
              {branch.account_holder && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Chủ tài khoản</p>
                  <p className="text-gray-800 mt-1 font-semibold">{branch.account_holder}</p>
                </div>
              )}
              {branch.bank_name && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tên ngân hàng</p>
                  <p className="text-gray-800 mt-1">{branch.bank_name}</p>
                </div>
              )}
              {branch.bank_branch && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Chi nhánh ngân hàng</p>
                  <p className="text-gray-800 mt-1">{branch.bank_branch}</p>
                </div>
              )}
              {(branch.qr_code || branch.account_qr_code) && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-2">QR Code</p>
                  {(branch.qr_code || branch.account_qr_code)?.startsWith('http') ? (
                    <img
                      src={branch.qr_code || branch.account_qr_code}
                      alt="QR Code"
                      className="max-w-xs border border-gray-300 rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <p className="text-gray-800 font-mono">{branch.qr_code || branch.account_qr_code}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DoorOpen className="h-6 w-6 text-blue-600" />
              <CardTitle>Danh sách phòng trọ ({rooms.length})</CardTitle>
            </div>
            <Button onClick={() => navigate(`/rooms/new?branch_id=${id}`)} size="sm">
              <Plus size={16} className="mr-2" />
              Thêm phòng
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roomsLoading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DoorOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>Chưa có phòng trọ trong chi nhánh này</p>
              <Button
                onClick={() => navigate(`/rooms/new?branch_id=${id}`)}
                className="mt-4"
                variant="outline"
              >
                <Plus size={16} className="mr-2" />
                Thêm phòng đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${
                    room.status === 'available'
                      ? 'border-green-500'
                      : room.status === 'occupied'
                      ? 'border-red-500'
                      : 'border-yellow-500'
                  }`}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            room.status === 'available'
                              ? 'bg-green-100'
                              : room.status === 'occupied'
                              ? 'bg-red-100'
                              : 'bg-yellow-100'
                          }`}
                        >
                          <DoorOpen
                            className={`h-5 w-5 ${
                              room.status === 'available'
                                ? 'text-green-600'
                                : room.status === 'occupied'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Phòng {room.room_number}</CardTitle>
                          {room.floor && (
                            <p className="text-sm text-gray-600">Tầng {room.floor}</p>
                          )}
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
                  </CardHeader>
                  <CardContent>
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
                      {room.deposit > 0 && (
                        <p className="flex items-center justify-between">
                          <span className="font-medium">Tiền cọc:</span>
                          <span>{new Intl.NumberFormat('vi-VN').format(room.deposit)} đ</span>
                        </p>
                      )}
                    </div>
                    <div
                      className="flex gap-2 pt-4 border-t"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        <Eye size={16} className="mr-2" />
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => navigate(`/rooms/${room.id}/edit`)}
                      >
                        Sửa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Images */}
      {branch.images && branch.images.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <ImageIcon className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Thư viện ảnh ({branch.images.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {branch.images.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => navigate(`/images/${image.id}`)}
                >
                  <img
                    src={image.image_url}
                    alt={image.name || 'Hình ảnh'}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {image.name && (
                    <p className="text-xs text-gray-600 mt-1 truncate">{image.name}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Assets */}
      {branch.assets && branch.assets.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Tài sản chung ({branch.assets.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branch.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-orange-700">
                        {asset.name}
                      </span>
                    </div>
                    {asset.description && (
                      <p className="text-xs text-gray-600 truncate">{asset.description}</p>
                    )}
                    {asset.value > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Giá trị: {new Intl.NumberFormat('vi-VN').format(asset.value)} đ
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assets/${asset.id}`);
                      }}
                    >
                      <Eye size={14} className="mr-1" />
                      Xem
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BranchDetail;

