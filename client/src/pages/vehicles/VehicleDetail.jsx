import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Car, Bike, Truck, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      setVehicle(response.data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      alert('Lỗi khi tải thông tin phương tiện');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa phương tiện này?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      navigate('/vehicles');
    } catch (error) {
      alert('Lỗi khi xóa phương tiện');
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'motorcycle':
        return <Bike className="h-6 w-6" />;
      case 'car':
        return <Car className="h-6 w-6" />;
      case 'bicycle':
        return <Bike className="h-6 w-6" />;
      default:
        return <Truck className="h-6 w-6" />;
    }
  };

  const getVehicleTypeLabel = (type) => {
    switch (type) {
      case 'motorcycle':
        return 'Xe máy';
      case 'car':
        return 'Ô tô';
      case 'bicycle':
        return 'Xe đạp';
      case 'other':
        return 'Khác';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!vehicle) {
    return <div className="text-center py-8">Không tìm thấy phương tiện</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vehicles')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {vehicle.brand || '-'} {vehicle.model || ''}
              </h1>
              <p className="text-gray-600 mt-1">Chi tiết phương tiện</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/vehicles/${id}/edit`)}>
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
              <div className="bg-blue-100 p-3 rounded-lg">
                {getVehicleIcon(vehicle.vehicle_type)}
              </div>
              <CardTitle>Thông tin phương tiện</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicle.image_url && (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={vehicle.image_url}
                    alt="Ảnh phương tiện"
                    className="w-full object-cover max-h-72"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Loại phương tiện</p>
                <span className="mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getVehicleTypeLabel(vehicle.vehicle_type)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hãng xe</p>
                <p className="text-gray-800 mt-1">{vehicle.brand || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mẫu xe</p>
                <p className="text-gray-800 mt-1">{vehicle.model || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Biển số</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {vehicle.license_plate || 'Chưa có biển số'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Màu sắc</p>
                <p className="text-gray-800 mt-1">{vehicle.color || '-'}</p>
              </div>
              {vehicle.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mô tả</p>
                  <p className="text-gray-800 mt-1 whitespace-pre-wrap">{vehicle.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-gray-800 mt-1">
                  {new Date(vehicle.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle>Khách thuê</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {vehicle.tenant_name || '-'}
                </p>
              </div>
              {vehicle.tenant_phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                  <p className="text-gray-800 mt-1">{vehicle.tenant_phone}</p>
                </div>
              )}
              {vehicle.tenant_email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-800 mt-1">{vehicle.tenant_email}</p>
                </div>
              )}
              {vehicle.tenant_id_card && (
                <div>
                  <p className="text-sm font-medium text-gray-500">CMND/CCCD</p>
                  <p className="text-gray-800 mt-1">{vehicle.tenant_id_card}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/tenants/${vehicle.tenant_id}`)}
                  className="w-full"
                >
                  <User size={16} className="mr-2" />
                  Xem thông tin khách thuê
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleDetail;

