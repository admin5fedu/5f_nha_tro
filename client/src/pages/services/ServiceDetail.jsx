import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    try {
      const response = await api.get(`/services/${id}`);
      setService(response.data);
    } catch (error) {
      console.error('Error loading service:', error);
      alert('Lỗi khi tải thông tin dịch vụ');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    try {
      await api.delete(`/services/${id}`);
      navigate('/services');
    } catch (error) {
      alert('Lỗi khi xóa dịch vụ');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!service) {
    return <div className="text-center py-8">Không tìm thấy dịch vụ</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/services')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{service.name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết dịch vụ</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/services/${id}/edit`)}>
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
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Thông tin dịch vụ</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tên dịch vụ</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{service.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Loại</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    service.unit === 'meter'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {service.unit === 'meter' ? 'Theo đồng hồ' : 'Theo số lượng'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Đơn vị</p>
                <p className="text-gray-800 mt-1">{service.unit_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    service.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {service.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
              {service.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mô tả</p>
                  <p className="text-gray-800 mt-1 whitespace-pre-wrap">{service.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-gray-800 mt-1">
                  {new Date(service.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceDetail;

