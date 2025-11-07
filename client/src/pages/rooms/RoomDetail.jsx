import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, DoorOpen, Image as ImageIcon, Package, Eye, Users, FileText, Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoom();
  }, [id]);

  const loadRoom = async () => {
    try {
      const response = await api.get(`/rooms/${id}`);
      setRoom(response.data);
    } catch (error) {
      console.error('Error loading room:', error);
      alert('Lỗi khi tải thông tin phòng');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      navigate('/rooms');
    } catch (error) {
      alert('Lỗi khi xóa phòng');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!room) {
    return <div className="text-center py-8">Không tìm thấy phòng</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/rooms')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Phòng {room.room_number}</h1>
              <p className="text-gray-600 mt-1">Chi tiết phòng trọ</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/rooms/${id}/edit`)}>
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
              <CardTitle>Thông tin cơ bản</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Số phòng</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">Phòng {room.room_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Chi nhánh</p>
                <p className="text-gray-800 mt-1">{room.branch_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Giá thuê</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {new Intl.NumberFormat('vi-VN').format(room.price)} đ/tháng
                </p>
              </div>
              {room.area && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Diện tích</p>
                  <p className="text-gray-800 mt-1">{room.area} m²</p>
                </div>
              )}
              {room.floor && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tầng</p>
                  <p className="text-gray-800 mt-1">{room.floor}</p>
                </div>
              )}
              {room.deposit > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tiền cọc</p>
                  <p className="text-gray-800 mt-1">
                    {new Intl.NumberFormat('vi-VN').format(room.deposit)} đ
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khác</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {room.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mô tả</p>
                  <p className="text-gray-800 mt-1">{room.description}</p>
                </div>
              )}
              {room.amenities && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tiện ích</p>
                  <p className="text-gray-800 mt-1">{room.amenities}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-gray-800 mt-1">
                  {new Date(room.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Images */}
        {room.images && room.images.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Thư viện ảnh ({room.images.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {room.images.map((image) => (
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
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg" />
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
        {room.assets && room.assets.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Tài sản chung ({room.assets.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {room.assets.map((asset) => (
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
                        Xem
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts and Tenants */}
        {room.contracts && room.contracts.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Hợp đồng và Khách thuê ({room.contracts.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {room.contracts.map((contract) => (
                  <Card key={contract.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileText size={18} className="text-blue-600" />
                            <h3 className="font-semibold text-lg">Hợp đồng #{contract.id}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              contract.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : contract.status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {contract.status === 'active' ? 'Đang hoạt động' : 
                               contract.status === 'expired' ? 'Đã hết hạn' : 'Đã hủy'}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-gray-600">Ngày bắt đầu:</span>
                              <span className="font-medium">
                                {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-gray-600">Ngày kết thúc:</span>
                              <span className="font-medium">
                                {contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : 'Không xác định'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Giá thuê:</span>
                              <span className="font-bold text-blue-600">
                                {new Intl.NumberFormat('vi-VN').format(contract.monthly_rent || 0)} đ/tháng
                              </span>
                            </div>
                            {contract.deposit > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Tiền cọc:</span>
                                <span className="font-medium">
                                  {new Intl.NumberFormat('vi-VN').format(contract.deposit)} đ
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {contract.tenant_name && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Users size={18} className="text-green-600" />
                              <h3 className="font-semibold text-lg">Khách thuê</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Họ tên:</span>
                                <p className="font-semibold text-gray-800 mt-1">{contract.tenant_name}</p>
                              </div>
                              {contract.tenant_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone size={14} className="text-gray-400" />
                                  <span className="text-gray-600">SĐT:</span>
                                  <span className="font-medium">{contract.tenant_phone}</span>
                                </div>
                              )}
                              {contract.tenant_email && (
                                <div className="flex items-center gap-2">
                                  <Mail size={14} className="text-gray-400" />
                                  <span className="text-gray-600">Email:</span>
                                  <span className="font-medium">{contract.tenant_email}</span>
                                </div>
                              )}
                              {contract.tenant_id_card && (
                                <div>
                                  <span className="text-gray-600">CMND/CCCD:</span>
                                  <span className="font-medium ml-2">{contract.tenant_id_card}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/contracts/${contract.id}`)}
                              >
                                <Eye size={14} className="mr-1" />
                                Xem hợp đồng
                              </Button>
                              {contract.tenant_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/tenants/${contract.tenant_id}`);
                                  }}
                                >
                                  <Users size={14} className="mr-1" />
                                  Xem khách thuê
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RoomDetail;

