import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState({
    branch_id: '',
    room_id: '',
    contract_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    actual_days: '',
    rent_amount: '',
    service_amount: '',
    previous_debt: '',
    paid_amount: '',
    notes: '',
    services: []
  });

  useEffect(() => {
    loadBranches();
    if (id && id !== 'new') {
      loadInvoice();
    }
  }, [id]);

  useEffect(() => {
    if (formData.branch_id) {
      loadRoomsByBranch(formData.branch_id);
    } else {
      setRooms([]);
      setContracts([]);
    }
  }, [formData.branch_id]);

  useEffect(() => {
    if (formData.room_id) {
      loadContractsByRoom(formData.room_id);
    } else {
      setContracts([]);
    }
  }, [formData.room_id]);

  useEffect(() => {
    if (formData.contract_id) {
      loadContractDetails(formData.contract_id);
    } else {
      setSelectedContract(null);
    }
  }, [formData.contract_id]);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches?status=active');
      setBranches(response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
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

  const loadContractsByRoom = async (roomId) => {
    try {
      const response = await api.get('/contracts?status=active');
      const filtered = response.data.filter(c => c.room_id === parseInt(roomId));
      setContracts(filtered);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const loadInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}`);
      const invoice = response.data;
      
      // Get branch_id from room_branch_id or branch_id
      const branchId = invoice.room_branch_id || invoice.branch_id || '';
      
      setFormData({
        branch_id: branchId,
        room_id: invoice.room_id || '',
        contract_id: invoice.contract_id || '',
        invoice_date: invoice.invoice_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date?.split('T')[0] || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_month: invoice.period_month || new Date().getMonth() + 1,
        period_year: invoice.period_year || new Date().getFullYear(),
        actual_days: invoice.actual_days || '',
        rent_amount: invoice.rent_amount || '',
        service_amount: invoice.service_amount || '',
        previous_debt: invoice.previous_debt || '',
        paid_amount: invoice.paid_amount || '',
        notes: invoice.notes || '',
        services: invoice.services || []
      });
      
      if (branchId) {
        await loadRoomsByBranch(branchId);
      }
      if (invoice.room_id) {
        await loadContractsByRoom(invoice.room_id);
      }
      if (invoice.contract_id) {
        await loadContractDetails(invoice.contract_id);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert(error.response?.data?.error || 'Lỗi khi tải thông tin hóa đơn');
      navigate('/invoices');
    }
  };

  const loadContractDetails = async (contractId) => {
    try {
      const response = await api.get(`/contracts/${contractId}`);
      const contract = response.data;
      setSelectedContract(contract);
      
      // Auto-fill rent amount
      if (!formData.rent_amount) {
        let rentAmount = contract.monthly_rent || 0;
        // Adjust by actual_days if provided
        if (formData.actual_days && formData.actual_days > 0) {
          const daysInMonth = new Date(formData.period_year, formData.period_month, 0).getDate();
          rentAmount = Math.round((rentAmount * formData.actual_days) / daysInMonth);
        }
        setFormData(prev => ({
          ...prev,
          rent_amount: rentAmount
        }));
      }

      // Calculate service amount from contract services
      if (contract.services && contract.services.length > 0) {
        const services = contract.services.map(s => ({
          ...s,
          meter_start: '',
          meter_end: '',
          meter_usage: '',
          adjusted_quantity: s.quantity || 1
        }));
        setFormData(prev => ({
          ...prev,
          services: services
        }));
        calculateServiceAmount(services);
      }

      // Calculate previous debt
      if (formData.invoice_date) {
        try {
          const invoicesRes = await api.get(`/invoices?contract_id=${contractId}`);
          const previousInvoices = invoicesRes.data.filter(inv => 
            inv.id !== parseInt(id || '0') && 
            new Date(inv.invoice_date) < new Date(formData.invoice_date) &&
            inv.status !== 'paid'
          );
          const totalDebt = previousInvoices.reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0);
          setFormData(prev => ({
            ...prev,
            previous_debt: totalDebt
          }));
        } catch (error) {
          console.error('Error calculating previous debt:', error);
        }
      }
    } catch (error) {
      console.error('Error loading contract details:', error);
    }
  };

  const calculateServiceAmount = (services) => {
    let total = 0;
    const daysInMonth = new Date(formData.period_year, formData.period_month, 0).getDate();
    
    services.forEach(service => {
      if (service.unit === 'meter') {
        // Meter-based: calculate from meter readings
        if (service.meter_start !== '' && service.meter_end !== '') {
          const usage = parseFloat(service.meter_end) - parseFloat(service.meter_start);
          const amount = (service.price || 0) * usage;
          total += amount;
        }
      } else {
        // Quantity-based: adjust by actual_days
        let amount = (service.price || 0) * (service.adjusted_quantity || service.quantity || 1);
        if (formData.actual_days && formData.actual_days > 0) {
          amount = Math.round((amount * formData.actual_days) / daysInMonth);
        }
        total += amount;
      }
    });

    setFormData(prev => ({
      ...prev,
      service_amount: total
    }));
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumber = (value) => {
    return value.toString().replace(/,/g, '');
  };

  const handleMoneyChange = (field, value) => {
    const numValue = parseNumber(value);
    setFormData({ ...formData, [field]: numValue });
  };

  const handleServiceChange = (index, field, value) => {
    const updated = [...formData.services];
    updated[index][field] = value;
    
    // Calculate meter_usage for meter-based services
    if (field === 'meter_start' || field === 'meter_end') {
      if (updated[index].unit === 'meter' && updated[index].meter_start && updated[index].meter_end) {
        const usage = parseFloat(updated[index].meter_end) - parseFloat(updated[index].meter_start);
        updated[index].meter_usage = usage;
        updated[index].amount = (updated[index].price || 0) * usage;
      }
    }
    
    setFormData({ ...formData, services: updated });
    calculateServiceAmount(updated);
  };

  const handleActualDaysChange = (value) => {
    const days = parseInt(value) || '';
    setFormData({ ...formData, actual_days: days });
    
    // Recalculate rent and services when actual_days changes
    if (selectedContract && days > 0) {
      const daysInMonth = new Date(formData.period_year, formData.period_month, 0).getDate();
      const adjustedRent = Math.round(((selectedContract.monthly_rent || 0) * days) / daysInMonth);
      setFormData(prev => ({
        ...prev,
        rent_amount: adjustedRent
      }));
      
      // Recalculate services
      if (formData.services.length > 0) {
        const updatedServices = formData.services.map(s => {
          if (s.unit === 'quantity') {
            const quantity = s.adjusted_quantity || s.quantity || 1;
            const baseAmount = (s.price || 0) * quantity;
            const adjustedAmount = Math.round((baseAmount * days) / daysInMonth);
            return { ...s, amount: adjustedAmount };
          }
          return s;
        });
        calculateServiceAmount(updatedServices);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const services = formData.services.map(s => {
        if (s.unit === 'meter') {
          return {
            service_id: s.service_id,
            service_name: s.service_name,
            price: s.price,
            quantity: 1,
            amount: s.amount || 0,
            meter_start: s.meter_start ? parseFloat(s.meter_start) : null,
            meter_end: s.meter_end ? parseFloat(s.meter_end) : null,
            meter_usage: s.meter_usage || null,
            unit: s.unit
          };
        } else {
          return {
            service_id: s.service_id,
            service_name: s.service_name,
            price: s.price,
            quantity: s.adjusted_quantity || s.quantity || 1,
            amount: s.amount || 0,
            unit: s.unit
          };
        }
      });

      const data = {
        contract_id: parseInt(formData.contract_id),
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        period_month: parseInt(formData.period_month),
        period_year: parseInt(formData.period_year),
        actual_days: formData.actual_days ? parseInt(formData.actual_days) : null,
        rent_amount: parseFloat(parseNumber(formData.rent_amount)) || 0,
        service_amount: parseFloat(parseNumber(formData.service_amount)) || 0,
        paid_amount: parseFloat(parseNumber(formData.paid_amount)) || 0,
        notes: formData.notes || null,
        services: services
      };

      if (id && id !== 'new') {
        await api.put(`/invoices/${id}`, {
          paid_amount: data.paid_amount,
          notes: data.notes
        });
        navigate(`/invoices/${id}`);
      } else {
        const response = await api.post('/invoices', data);
        navigate(`/invoices/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (parseFloat(parseNumber(formData.rent_amount)) || 0) +
    (parseFloat(parseNumber(formData.service_amount)) || 0) +
    (parseFloat(parseNumber(formData.previous_debt)) || 0);
  const remainingAmount = totalAmount - (parseFloat(parseNumber(formData.paid_amount)) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa hóa đơn' : 'Thêm hóa đơn'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin hóa đơn' : 'Tạo hóa đơn mới'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hóa đơn</CardTitle>
          <CardDescription>Điền thông tin hóa đơn bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">
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
                      room_id: '',
                      contract_id: ''
                    });
                  }}
                  disabled={id && id !== 'new'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      room_id: e.target.value,
                      contract_id: ''
                    });
                  }}
                  disabled={!formData.branch_id || (id && id !== 'new')}
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
                <Label required>Hợp đồng</Label>
                <select
                  required
                  value={formData.contract_id}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                  disabled={!formData.room_id || (id && id !== 'new')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.room_id ? 'Chọn hợp đồng' : 'Chọn phòng trước'}</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.tenant_name} - {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Ngày hóa đơn</Label>
                <input
                  type="date"
                  required
                  value={formData.invoice_date}
                  onChange={(e) => {
                    setFormData({ ...formData, invoice_date: e.target.value });
                    if (formData.contract_id) {
                      loadContractDetails(formData.contract_id);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label required>Hạn thanh toán</Label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label required>Tháng</Label>
                  <select
                    required
                    value={formData.period_month}
                    onChange={(e) => setFormData({ ...formData, period_month: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label required>Năm</Label>
                  <select
                    required
                    value={formData.period_year}
                    onChange={(e) => setFormData({ ...formData, period_year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div>
                <Label>Số ngày thực tế</Label>
                <input
                  type="number"
                  min="1"
                  value={formData.actual_days}
                  onChange={(e) => handleActualDaysChange(e.target.value)}
                  placeholder="Ví dụ: 15 (nếu ở 15/30 ngày)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu ở đủ tháng. Nhập số ngày thực tế để tính giảm trừ tiền phòng và dịch vụ.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Chi tiết thanh toán</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Tiền thuê (đ)</Label>
                  <input
                    type="text"
                    required
                    value={formatNumber(formData.rent_amount)}
                    onChange={(e) => handleMoneyChange('rent_amount', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {formData.actual_days && formData.actual_days > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Đã điều chỉnh theo {formData.actual_days} ngày thực tế
                    </p>
                  )}
                </div>
                <div>
                  <Label>Nợ kỳ trước (đ)</Label>
                  <input
                    type="text"
                    value={formatNumber(formData.previous_debt)}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tự động tính từ hóa đơn kỳ trước chưa thanh toán
                  </p>
                </div>
                <div>
                  <Label>Tiền dịch vụ (đ)</Label>
                  <input
                    type="text"
                    value={formatNumber(formData.service_amount)}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tự động tính từ dịch vụ bên dưới
                  </p>
                </div>
                <div>
                  <Label>Đã thanh toán (đ)</Label>
                  <input
                    type="text"
                    value={formatNumber(formData.paid_amount)}
                    onChange={(e) => handleMoneyChange('paid_amount', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Tổng cộng:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {new Intl.NumberFormat('vi-VN').format(totalAmount)} đ
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold text-gray-700">Còn lại:</span>
                  <span className={`text-xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {new Intl.NumberFormat('vi-VN').format(remainingAmount)} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Services Section */}
            {selectedContract && selectedContract.services && selectedContract.services.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Dịch vụ</h3>
                <div className="space-y-4">
                  {formData.services.map((service, index) => (
                    <div key={service.id || index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-800">{service.service_name}</p>
                          <p className="text-sm text-gray-500">
                            {service.unit === 'meter' ? 'Theo đồng hồ' : 'Theo số lượng'} ({service.unit_name})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Đơn giá: {new Intl.NumberFormat('vi-VN').format(service.price)} đ</p>
                          <p className="font-semibold text-blue-600">
                            {new Intl.NumberFormat('vi-VN').format(service.amount || 0)} đ
                          </p>
                        </div>
                      </div>
                      
                      {service.unit === 'meter' ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>Số đầu kỳ</Label>
                            <input
                              type="number"
                              step="0.01"
                              value={service.meter_start || ''}
                              onChange={(e) => handleServiceChange(index, 'meter_start', e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <Label>Số cuối kỳ</Label>
                            <input
                              type="number"
                              step="0.01"
                              value={service.meter_end || ''}
                              onChange={(e) => handleServiceChange(index, 'meter_end', e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <Label>Sử dụng</Label>
                            <input
                              type="number"
                              step="0.01"
                              value={service.meter_usage || ''}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label>Số lượng</Label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={service.adjusted_quantity || service.quantity || 1}
                            onChange={(e) => {
                              const updated = [...formData.services];
                              updated[index].adjusted_quantity = parseInt(e.target.value) || 1;
                              const daysInMonth = new Date(formData.period_year, formData.period_month, 0).getDate();
                              let amount = (updated[index].price || 0) * updated[index].adjusted_quantity;
                              if (formData.actual_days && formData.actual_days > 0) {
                                amount = Math.round((amount * formData.actual_days) / daysInMonth);
                              }
                              updated[index].amount = amount;
                              setFormData({ ...formData, services: updated });
                              calculateServiceAmount(updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                          {formData.actual_days && formData.actual_days > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Đã điều chỉnh theo {formData.actual_days} ngày thực tế
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            onClick={() => navigate('/invoices')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="invoice-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
