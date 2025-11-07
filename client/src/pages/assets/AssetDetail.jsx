import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Package, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAsset();
  }, [id]);

  const loadAsset = async () => {
    try {
      const response = await api.get(`/assets/${id}`);
      setAsset(response.data);
    } catch (error) {
      console.error('Error loading asset:', error);
      alert('Lỗi khi tải thông tin tài sản');
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa tài sản này?')) return;
    try {
      await api.delete(`/assets/${id}`);
      navigate('/assets');
    } catch (error) {
      alert('Lỗi khi xóa tài sản');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!asset) {
    return <div className="text-center py-8">Không tìm thấy tài sản</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{asset.name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết tài sản</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/assets/${id}/edit`)}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tên tài sản</label>
              <p className="text-gray-900 font-medium">{asset.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Loại tài sản</label>
              <p className="text-gray-900">
                {asset.type === 'furniture' ? 'Nội thất' :
                 asset.type === 'equipment' ? 'Thiết bị' :
                 asset.type === 'appliance' ? 'Đồ gia dụng' : 'Khác'}
              </p>
            </div>
            {asset.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                <p className="text-gray-900">{asset.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Giá trị</label>
              <p className="text-gray-900 font-bold text-lg text-purple-600">
                {new Intl.NumberFormat('vi-VN').format(asset.value || 0)} đ
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Trạng thái</label>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  asset.status === 'good'
                    ? 'bg-green-100 text-green-800'
                    : asset.status === 'damaged'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {asset.status === 'good' ? 'Tốt' :
                 asset.status === 'damaged' ? 'Hỏng' : 'Bảo trì'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Vị trí */}
        <Card>
          <CardHeader>
            <CardTitle>Vị trí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Loại vị trí</label>
              <p className="text-gray-900">
                {asset.location_type === 'room' ? 'Phòng' : 'Chi nhánh'}
              </p>
            </div>
            {asset.location_type === 'room' && (
              <>
                {asset.room_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phòng</label>
                    <p className="text-gray-900">Phòng {asset.room_number}</p>
                    {asset.room_branch_name && (
                      <p className="text-sm text-gray-500">{asset.room_branch_name}</p>
                    )}
                  </div>
                )}
              </>
            )}
            {asset.location_type === 'branch' && asset.branch_name && (
              <div>
                <label className="text-sm font-medium text-gray-500">Chi nhánh</label>
                <p className="text-gray-900">{asset.branch_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thông tin chi tiết */}
        {(asset.serial_number || asset.manufacturer || asset.model || asset.purchase_date || asset.warranty_expiry) && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.serial_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Số serial</label>
                  <p className="text-gray-900">{asset.serial_number}</p>
                </div>
              )}
              {asset.manufacturer && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Nhà sản xuất</label>
                  <p className="text-gray-900">{asset.manufacturer}</p>
                </div>
              )}
              {asset.model && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Model</label>
                  <p className="text-gray-900">{asset.model}</p>
                </div>
              )}
              {asset.purchase_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày mua</label>
                  <p className="text-gray-900">
                    {new Date(asset.purchase_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
              {asset.warranty_expiry && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Hết hạn bảo hành</label>
                  <p className="text-gray-900">
                    {new Date(asset.warranty_expiry).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ghi chú */}
        {asset.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 whitespace-pre-wrap">{asset.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssetDetail;

