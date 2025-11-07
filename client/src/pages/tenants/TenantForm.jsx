import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const TenantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_card: '',
    address: '',
    hometown: '',
    emergency_contact: '',
    has_temp_residence: 'no',
    notes: '',
    tenant_type: 'owner',
    owner_tenant_id: ''
  });

  useEffect(() => {
    loadOwners();
    if (id && id !== 'new') {
      loadTenant();
    }
  }, [id]);

  const loadOwners = async () => {
    try {
      const response = await api.get('/tenants?tenant_type=owner');
      setOwners(response.data);
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  };

  const loadTenant = async () => {
    try {
      const response = await api.get(`/tenants/${id}`);
      setFormData({
        ...response.data,
        owner_tenant_id: response.data.owner_tenant_id || ''
      });
    } catch (error) {
      console.error('Error loading tenant:', error);
      alert('Lỗi khi tải thông tin khách thuê');
      navigate('/tenants');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id && id !== 'new') {
        await api.put(`/tenants/${id}`, formData);
        navigate(`/tenants/${id}`);
      } else {
        const response = await api.post('/tenants', formData);
        navigate(`/tenants/${response.data.id}`);
      }
    } catch (error) {
      alert('Lỗi khi lưu khách thuê');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa khách thuê' : 'Thêm khách thuê'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin khách thuê' : 'Thêm khách thuê mới vào hệ thống'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách thuê</CardTitle>
          <CardDescription>Điền thông tin khách thuê bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="tenant-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Họ và tên</Label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Email</Label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>CMND/CCCD</Label>
                <input
                  type="text"
                  value={formData.id_card}
                  onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Địa chỉ</Label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Quê quán</Label>
                <input
                  type="text"
                  value={formData.hometown}
                  onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                  placeholder="Nơi sinh hoặc quê quán"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Tạm trú tạm vắng</Label>
                <select
                  value={formData.has_temp_residence}
                  onChange={(e) => setFormData({ ...formData, has_temp_residence: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="no">Chưa có</option>
                  <option value="yes">Đã có</option>
                </select>
              </div>
              <div>
                <Label>Liên hệ khẩn cấp</Label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label required>Loại khách thuê</Label>
                <select
                  required
                  value={formData.tenant_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({ 
                      ...formData, 
                      tenant_type: newType,
                      owner_tenant_id: newType === 'owner' ? '' : formData.owner_tenant_id
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="owner">Chủ phòng</option>
                  <option value="cotenant">Ở cùng</option>
                </select>
              </div>
              {formData.tenant_type === 'cotenant' && (
                <div>
                  <Label required>Chủ phòng</Label>
                  <select
                    required
                    value={formData.owner_tenant_id}
                    onChange={(e) => setFormData({ ...formData, owner_tenant_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Chọn chủ phòng</option>
                    {owners
                      .filter(o => !id || o.id !== parseInt(id)) // Exclude current tenant if editing
                      .map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.full_name} {owner.phone ? `(${owner.phone})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              )}
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
          </form>
        </CardContent>
      </Card>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tenants')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="tenant-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TenantForm;

