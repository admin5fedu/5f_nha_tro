import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const VehicleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    tenant_id: '',
    vehicle_type: 'motorcycle',
    brand: '',
    model: '',
    license_plate: '',
    color: '',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    loadTenants();
    if (id && id !== 'new') {
      loadVehicle();
    }
  }, [id]);

  const loadTenants = async () => {
    try {
      const response = await api.get('/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      setFormData({
        tenant_id: response.data.tenant_id || '',
        vehicle_type: response.data.vehicle_type || 'motorcycle',
        brand: response.data.brand || '',
        model: response.data.model || '',
        license_plate: response.data.license_plate || '',
        color: response.data.color || '',
        description: response.data.description || '',
        image_url: response.data.image_url || ''
      });
    } catch (error) {
      console.error('Error loading vehicle:', error);
      alert('Lỗi khi tải thông tin phương tiện');
      navigate('/vehicles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        tenant_id: parseInt(formData.tenant_id),
        vehicle_type: formData.vehicle_type,
        brand: formData.brand || null,
        model: formData.model || null,
        license_plate: formData.license_plate || null,
        color: formData.color || null,
        description: formData.description || null,
        image_url: formData.image_url || null
      };
      if (id && id !== 'new') {
        await api.put(`/vehicles/${id}`, data);
        navigate(`/vehicles/${id}`);
      } else {
        const response = await api.post('/vehicles', data);
        navigate(`/vehicles/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu phương tiện');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa phương tiện' : 'Thêm phương tiện'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin phương tiện' : 'Thêm phương tiện mới vào hệ thống'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin phương tiện</CardTitle>
          <CardDescription>Điền thông tin phương tiện bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Khách thuê</Label>
                <select
                  required
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Chọn khách thuê</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name} {tenant.phone ? `(${tenant.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Loại phương tiện</Label>
                <select
                  required
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="motorcycle">Xe máy</option>
                  <option value="car">Ô tô</option>
                  <option value="bicycle">Xe đạp</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <Label>Hãng xe</Label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ví dụ: Honda, Yamaha, Toyota..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Mẫu xe</Label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ví dụ: Wave Alpha, Air Blade..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Biển số</Label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: 51A-12345"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Màu sắc</Label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Ví dụ: Đỏ, Xanh, Đen..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          <div>
            <Label>Ảnh phương tiện</Label>
            <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData((prev) => ({ ...prev, image_url: reader.result || '' }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.image_url && (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <img src={formData.image_url} alt="Ảnh phương tiện" className="w-full object-cover max-h-64" />
                  </div>
                )}
              </div>
              {formData.image_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                  className="h-fit"
                >
                  Xóa ảnh
                </Button>
              )}
            </div>
          </div>
            <div>
              <Label>Mô tả</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                placeholder="Mô tả thêm về phương tiện..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/vehicles')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="vehicle-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleForm;

