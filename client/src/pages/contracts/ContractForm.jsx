import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { formatNumber, parseNumber } from '../../utils/format';

const ContractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    branch_id: '',
    room_id: '',
    tenant_id: '',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    deposit: '',
    status: 'active',
    notes: '',
    contract_services: []
  });

  useEffect(() => {
    loadData();
    if (id && id !== 'new') {
      loadContract();
    }
  }, [id]);

  useEffect(() => {
    // Load rooms when branch changes
    if (formData.branch_id) {
      loadRoomsByBranch(formData.branch_id);
    } else {
      setRooms([]);
    }
  }, [formData.branch_id]);

  const loadData = async () => {
    try {
      const [branchesRes, tenantsRes, servicesRes] = await Promise.all([
        api.get('/branches'),
        api.get('/tenants'),
        api.get('/services?status=active')
      ]);
      setBranches(branchesRes.data);
      setTenants(tenantsRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadRoomsByBranch = async (branchId) => {
    try {
      const response = await api.get(`/rooms?branch_id=${branchId}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadContract = async () => {
    try {
      const response = await api.get(`/contracts/${id}`);
      setFormData({
        ...response.data,
        branch_id: response.data.branch_id || '',
        room_id: response.data.room_id || '',
        deposit: response.data.deposit || '',
        monthly_rent: response.data.monthly_rent || '',
        start_date: response.data.start_date?.split('T')[0] || '',
        end_date: response.data.end_date?.split('T')[0] || '',
        contract_services: response.data.services?.map(s => ({
          ...s,
          quantity: s.quantity || '1'
        })) || []
      });
      // Load rooms for the selected branch
      if (response.data.branch_id) {
        loadRoomsByBranch(response.data.branch_id);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      alert('Lỗi khi tải thông tin hợp đồng');
      navigate('/contracts');
    }
  };

  const handleMoneyChange = (field, value) => {
    const numValue = parseNumber(value);
    setFormData({ ...formData, [field]: numValue });
  };

  const handleMoneyBlur = (field) => {
    const value = formData[field];
    if (value) {
      const formatted = formatNumber(value);
      // Keep the numeric value for submission
    }
  };

  const addService = () => {
    setFormData({
      ...formData,
      contract_services: [
        ...formData.contract_services,
        { service_id: '', price: '', quantity: '1', notes: '' }
      ]
    });
  };

  const removeService = (index) => {
    setFormData({
      ...formData,
      contract_services: formData.contract_services.filter((_, i) => i !== index)
    });
  };

  const updateService = (index, field, value) => {
    const updated = [...formData.contract_services];
    if (field === 'price') {
      updated[index][field] = parseNumber(value);
    } else if (field === 'quantity') {
      updated[index][field] = value;
    } else {
      updated[index][field] = value;
    }
    setFormData({ ...formData, contract_services: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        branch_id: parseInt(formData.branch_id),
        room_id: parseInt(formData.room_id),
        tenant_id: parseInt(formData.tenant_id),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        monthly_rent: parseFloat(parseNumber(formData.monthly_rent)),
        deposit: formData.deposit ? parseFloat(parseNumber(formData.deposit)) : 0,
        status: formData.status,
        notes: formData.notes,
        services: formData.contract_services
          .filter(s => s.service_id && s.price)
          .map(s => ({
            service_id: parseInt(s.service_id),
            price: parseFloat(parseNumber(s.price)),
            quantity: parseFloat(s.quantity || 1),
            notes: s.notes || null
          }))
      };
      if (id && id !== 'new') {
        await api.put(`/contracts/${id}`, data);
        navigate(`/contracts/${id}`);
      } else {
        const response = await api.post('/contracts', data);
        navigate(`/contracts/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contracts')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa hợp đồng' : 'Thêm hợp đồng'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin hợp đồng' : 'Thêm hợp đồng mới vào hệ thống'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hợp đồng</CardTitle>
          <CardDescription>Điền thông tin hợp đồng bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="contract-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Chi nhánh</Label>
                <select
                  required
                  value={formData.branch_id}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      branch_id: e.target.value,
                      room_id: '' // Reset room when branch changes
                    });
                  }}
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
              <div>
                <Label required>Phòng</Label>
                <select
                  required
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  disabled={!formData.branch_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.branch_id ? 'Chọn phòng' : 'Chọn chi nhánh trước'}</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Phòng {room.room_number}
                    </option>
                  ))}
                </select>
              </div>
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
                      {tenant.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Ngày bắt đầu</Label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label required>Giá thuê/tháng (đ)</Label>
                <input
                  type="text"
                  required
                  value={formatNumber(formData.monthly_rent)}
                  onChange={(e) => handleMoneyChange('monthly_rent', e.target.value)}
                  onBlur={() => handleMoneyBlur('monthly_rent')}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Tiền cọc (đ)</Label>
                <input
                  type="text"
                  value={formatNumber(formData.deposit)}
                  onChange={(e) => handleMoneyChange('deposit', e.target.value)}
                  onBlur={() => handleMoneyBlur('deposit')}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="ended">Đã kết thúc</option>
                </select>
              </div>
            </div>

            {/* Services Section */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Dịch vụ</Label>
                <Button type="button" variant="outline" size="sm" onClick={addService}>
                  <Plus size={16} className="mr-2" />
                  Thêm dịch vụ
                </Button>
              </div>
              {formData.contract_services.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có dịch vụ nào</p>
              ) : (
                <div className="space-y-3">
                  {formData.contract_services.map((service, index) => {
                    const selectedService = services.find(s => s.id === parseInt(service.service_id));
                    const showQuantity = selectedService && selectedService.unit === 'quantity';
                    
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg">
                        <div className="md:col-span-4">
                          <select
                            required
                            value={service.service_id}
                            onChange={(e) => updateService(index, 'service_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          >
                            <option value="">Chọn dịch vụ</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.unit_name})
                              </option>
                            ))}
                          </select>
                        </div>
                        {showQuantity && (
                          <div className="md:col-span-2">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={service.quantity || '1'}
                              onChange={(e) => updateService(index, 'quantity', e.target.value)}
                              placeholder="Số lượng"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>
                        )}
                        <div className={showQuantity ? "md:col-span-3" : "md:col-span-5"}>
                          <input
                            type="text"
                            required
                            value={formatNumber(service.price)}
                            onChange={(e) => updateService(index, 'price', e.target.value)}
                            placeholder="Giá (đ)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
            onClick={() => navigate('/contracts')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="contract-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractForm;
