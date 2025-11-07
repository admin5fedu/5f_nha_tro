import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Gauge, MapPin, Calendar, User, Receipt } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const MeterReadingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadReading();
    }
  }, [id]);

  const loadReading = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/meter-readings/${id}`);
      setReading(response.data);
    } catch (error) {
      console.error('Error loading meter reading:', error);
      setError(error.response?.data?.error || 'Lỗi khi tải thông tin sổ ghi dịch vụ');
      alert(error.response?.data?.error || 'Lỗi khi tải thông tin sổ ghi dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
    try {
      await api.delete(`/meter-readings/${id}`);
      navigate('/meter-readings');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa bản ghi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/meter-readings')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lỗi</h1>
            <p className="text-gray-600 mt-1">{error || 'Không tìm thấy bản ghi'}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">{error || 'Không tìm thấy bản ghi'}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/meter-readings')}>Quay lại danh sách</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/meter-readings')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {reading.service_name || 'Sổ ghi dịch vụ'}
              </h1>
              <p className="text-gray-600 mt-1">Chi tiết sổ ghi dịch vụ</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/meter-readings/${id}/edit`)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Gauge className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Thông tin sổ ghi dịch vụ</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phòng trọ</p>
                    <p className="text-gray-800 mt-1 flex items-center gap-2">
                      <MapPin size={16} />
                      {reading.room_number ? `Phòng ${reading.room_number}` : '-'}
                      {reading.branch_name && (
                        <span className="text-gray-500">({reading.branch_name})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dịch vụ</p>
                    <p className="text-gray-800 mt-1 flex items-center gap-2">
                      <Gauge size={16} className="text-blue-500" />
                      {reading.service_name || '-'}
                      {reading.unit_name && (
                        <span className="text-gray-500">({reading.unit_name})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày ghi</p>
                    <p className="text-gray-800 mt-1 flex items-center gap-2">
                      <Calendar size={16} />
                      {reading.reading_date ? new Date(reading.reading_date).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Người ghi</p>
                    <p className="text-gray-800 mt-1 flex items-center gap-2">
                      <User size={16} />
                      {reading.recorded_by_name || '-'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Số đồng hồ</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Số đầu kỳ</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {reading.meter_start?.toLocaleString('vi-VN') || '0'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Số cuối kỳ</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {reading.meter_end?.toLocaleString('vi-VN') || '0'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <p className="text-sm text-blue-600 mb-2 font-medium">Số sử dụng</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reading.meter_usage?.toLocaleString('vi-VN') || '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {reading.invoice_number && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Hóa đơn liên kết</p>
                    <a
                      href={`/invoices/${reading.invoice_id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/invoices/${reading.invoice_id}`);
                      }}
                    >
                      <Receipt size={16} />
                      {reading.invoice_number}
                      {reading.period_month && reading.period_year && (
                        <span className="text-gray-500">
                          ({reading.period_month}/{reading.period_year})
                        </span>
                      )}
                    </a>
                  </div>
                )}

                {reading.notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Ghi chú</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{reading.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-medium">
                    {reading.created_at ? new Date(reading.created_at).toLocaleDateString('vi-VN') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cập nhật lần cuối:</span>
                  <span className="font-medium">
                    {reading.updated_at ? new Date(reading.updated_at).toLocaleDateString('vi-VN') : '-'}
                  </span>
                </div>
                {reading.branch_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chi nhánh:</span>
                    <span className="font-medium">{reading.branch_name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MeterReadingDetail;

