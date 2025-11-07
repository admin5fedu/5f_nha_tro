import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Gauge, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';

const MeterReadingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [contractServices, setContractServices] = useState([]);
  const [formData, setFormData] = useState({
    room_id: '',
    reading_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  // Mảng các dịch vụ cần ghi số
  const [meterReadings, setMeterReadings] = useState([]);
  const [previousReadings, setPreviousReadings] = useState({}); // {service_id: previousReading}

  useEffect(() => {
    loadRooms();
    loadServices();
    if (id && id !== 'new') {
      loadReading();
    }
  }, [id]);

  useEffect(() => {
    if (formData.room_id) {
      loadContractServices();
    } else {
      setContractServices([]);
      setMeterReadings([]);
      setPreviousReadings({});
    }
  }, [formData.room_id]);

  useEffect(() => {
    // Khi có contract services và services đã load, tự động tạo form cho tất cả dịch vụ
    if (contractServices.length > 0 && formData.room_id && services.length > 0) {
      const newReadings = contractServices.map(cs => {
        const service = services.find(s => s.id === cs.service_id);
        return {
          service_id: cs.service_id,
          service_name: service?.name || '',
          meter_start: '',
          meter_end: '',
          meter_usage: 0
        };
      });
      setMeterReadings(newReadings);
      
      // Load previous readings cho tất cả dịch vụ
      contractServices.forEach(cs => {
        loadPreviousReading(cs.service_id);
      });
    } else if (contractServices.length === 0 && formData.room_id) {
      setMeterReadings([]);
      setPreviousReadings({});
    }
  }, [contractServices, formData.room_id, services]);

  const loadRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      // Chỉ lấy các dịch vụ tính theo đồng hồ
      const meterServices = response.data.filter(s => s.unit === 'meter');
      setServices(meterServices);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadContractServices = async () => {
    try {
      // Get active contract for this room
      const contractsResponse = await api.get(`/contracts`);
      const allContracts = contractsResponse.data || [];
      const activeContract = allContracts.find(c => 
        c.room_id === parseInt(formData.room_id) && c.status === 'active'
      );
      
      if (activeContract) {
        // Get contract services
        const contractDetail = await api.get(`/contracts/${activeContract.id}`);
        const services = contractDetail.data.services || [];
        // Filter only meter-based services
        const meterServices = services.filter(s => s.unit === 'meter');
        setContractServices(meterServices);
        
        // Auto-select first service if only one
        if (meterServices.length === 1 && !formData.service_id) {
          setFormData(prev => ({ ...prev, service_id: meterServices[0].service_id }));
        }
      } else {
        setContractServices([]);
      }
    } catch (error) {
      console.error('Error loading contract services:', error);
      setContractServices([]);
    }
  };

  const loadPreviousReading = async (serviceId) => {
    try {
      const response = await api.get(`/meter-readings/latest/${formData.room_id}/${serviceId}`);
      if (response.data) {
        setPreviousReadings(prev => ({
          ...prev,
          [serviceId]: response.data
        }));
        
        // Tự động điền số đầu = số cuối của lần ghi trước
        setMeterReadings(prev => prev.map(reading => {
          if (reading.service_id === serviceId) {
            return {
              ...reading,
              meter_start: response.data.meter_end || '0'
            };
          }
          return reading;
        }));
      } else {
        setPreviousReadings(prev => ({
          ...prev,
          [serviceId]: null
        }));
        
        // Nếu chưa có lần ghi nào, số đầu = 0
        setMeterReadings(prev => prev.map(reading => {
          if (reading.service_id === serviceId) {
            return {
              ...reading,
              meter_start: '0'
            };
          }
          return reading;
        }));
      }
    } catch (error) {
      console.error('Error loading previous reading:', error);
      setPreviousReadings(prev => ({
        ...prev,
        [serviceId]: null
      }));
      
      setMeterReadings(prev => prev.map(reading => {
        if (reading.service_id === serviceId) {
          return {
            ...reading,
            meter_start: '0'
          };
        }
        return reading;
      }));
    }
  };

  const loadReading = async () => {
    try {
      const response = await api.get(`/meter-readings/${id}`);
      const reading = response.data;
      setFormData({
        room_id: reading.room_id || '',
        reading_date: reading.reading_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: reading.notes || ''
      });
      
      // Load contract services để có thể edit
      if (reading.room_id) {
        await loadContractServices();
        // Set single reading
        setMeterReadings([{
          service_id: reading.service_id,
          service_name: reading.service_name || '',
          meter_start: reading.meter_start || '',
          meter_end: reading.meter_end || '',
          meter_usage: reading.meter_usage || 0
        }]);
      }
    } catch (error) {
      console.error('Error loading meter reading:', error);
      alert(error.response?.data?.error || 'Lỗi khi tải thông tin sổ ghi dịch vụ');
      navigate('/meter-readings');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.room_id) {
      alert('Vui lòng chọn phòng');
      return;
    }
    
    if (meterReadings.length === 0) {
      alert('Vui lòng thêm ít nhất một dịch vụ để ghi số');
      return;
    }
    
    // Validate từng dịch vụ
    for (const reading of meterReadings) {
      if (!reading.meter_end || reading.meter_end === '') {
        alert(`Vui lòng nhập số cuối cho dịch vụ ${reading.service_name}`);
        return;
      }
      
      const start = parseFloat(reading.meter_start) || 0;
      const end = parseFloat(reading.meter_end) || 0;
      
      if (end < start) {
        alert(`Số cuối phải lớn hơn hoặc bằng số đầu cho dịch vụ ${reading.service_name}`);
        return;
      }
    }
    
    setLoading(true);
    try {
      if (id && id !== 'new') {
        // Update single reading
        const reading = meterReadings[0];
        const data = {
          room_id: parseInt(formData.room_id),
          service_id: parseInt(reading.service_id),
          reading_date: formData.reading_date,
          meter_start: parseFloat(reading.meter_start),
          meter_end: parseFloat(reading.meter_end),
          notes: formData.notes || null,
          recorded_by: user?.id
        };
        await api.put(`/meter-readings/${id}`, data);
        navigate(`/meter-readings/${id}`);
      } else {
        // Create multiple readings
        const promises = meterReadings.map(reading => {
          const data = {
            room_id: parseInt(formData.room_id),
            service_id: parseInt(reading.service_id),
            reading_date: formData.reading_date,
            meter_start: parseFloat(reading.meter_start) || 0,
            meter_end: parseFloat(reading.meter_end),
            notes: formData.notes || null,
            recorded_by: user?.id
          };
          return api.post('/meter-readings', data);
        });
        
        await Promise.all(promises);
        navigate('/meter-readings');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu sổ ghi dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomChange = (roomId) => {
    setFormData(prev => ({ ...prev, room_id: roomId }));
    setMeterReadings([]);
    setPreviousReadings({});
  };

  const handleMeterEndChange = (serviceId, value) => {
    setMeterReadings(prev => prev.map(reading => {
      if (reading.service_id === serviceId) {
        const start = parseFloat(reading.meter_start) || 0;
        const end = parseFloat(value) || 0;
        return {
          ...reading,
          meter_end: value,
          meter_usage: Math.max(0, end - start)
        };
      }
      return reading;
    }));
  };

  const addService = () => {
    // Thêm dịch vụ mới (từ danh sách tất cả dịch vụ)
    const availableServices = services.filter(s => 
      !meterReadings.some(mr => mr.service_id === s.id)
    );
    
    if (availableServices.length === 0) {
      alert('Đã thêm tất cả dịch vụ');
      return;
    }
    
    // Show dialog hoặc chọn dịch vụ đầu tiên
    const newService = availableServices[0];
    const newReading = {
      service_id: newService.id,
      service_name: newService.name,
      meter_start: '0',
      meter_end: '',
      meter_usage: 0
    };
    
    setMeterReadings(prev => [...prev, newReading]);
    loadPreviousReading(newService.id);
  };

  const removeService = (serviceId) => {
    setMeterReadings(prev => prev.filter(r => r.service_id !== serviceId));
    setPreviousReadings(prev => {
      const newPrev = { ...prev };
      delete newPrev[serviceId];
      return newPrev;
    });
  };

  const calculateUsage = (meterStart, meterEnd) => {
    const start = parseFloat(meterStart) || 0;
    const end = parseFloat(meterEnd) || 0;
    return Math.max(0, end - start);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/meter-readings')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa sổ ghi dịch vụ' : 'Ghi số dịch vụ mới'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin ghi số dịch vụ' : 'Ghi số điện nước và các dịch vụ tính theo đồng hồ'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Gauge className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Thông tin ghi số dịch vụ</CardTitle>
              <CardDescription>Điền thông tin ghi số dịch vụ bên dưới</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form id="meter-reading-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Phòng trọ</Label>
                <select
                  required
                  value={formData.room_id}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Chọn phòng</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Phòng {room.room_number} - {room.branch_name || ''}
                    </option>
                  ))}
                </select>
                {contractServices.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Tìm thấy {contractServices.length} dịch vụ trong hợp đồng
                  </p>
                )}
              </div>
              <div>
                <Label required>Ngày ghi</Label>
                <input
                  type="date"
                  required
                  value={formData.reading_date}
                  onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Danh sách các dịch vụ cần ghi số */}
            {formData.room_id && meterReadings.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Danh sách dịch vụ cần ghi số</Label>
                  {contractServices.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addService}
                      className="text-xs"
                    >
                      <Plus size={14} className="mr-1" />
                      Thêm dịch vụ
                    </Button>
                  )}
                </div>
                
                {meterReadings.map((reading, index) => {
                  const previousReading = previousReadings[reading.service_id];
                  return (
                    <Card key={reading.service_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              {reading.service_name}
                            </h3>
                            {previousReading && (
                              <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                <span className="font-medium">Lần ghi trước:</span> {previousReading.reading_date ? new Date(previousReading.reading_date).toLocaleDateString('vi-VN') : '-'} - 
                                Số cuối: <span className="font-semibold text-blue-700">{previousReading.meter_end?.toLocaleString('vi-VN') || '0'}</span>
                              </div>
                            )}
                            {!previousReading && (
                              <div className="mt-2 text-xs text-gray-500">
                                Lần ghi đầu tiên
                              </div>
                            )}
                          </div>
                          {meterReadings.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(reading.service_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Số đầu kỳ (Tự động)</Label>
                            <input
                              type="text"
                              value={reading.meter_start ? parseFloat(reading.meter_start).toLocaleString('vi-VN') : '0'}
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-semibold text-gray-700"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              = Số cuối lần trước
                            </p>
                          </div>
                          <div>
                            <Label required>Số cuối kỳ</Label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              min={parseFloat(reading.meter_start) || 0}
                              value={reading.meter_end}
                              onChange={(e) => handleMeterEndChange(reading.service_id, e.target.value)}
                              placeholder="Nhập số cuối"
                              className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold bg-white"
                              autoFocus={index === 0}
                            />
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              ⚡ Chỉ cần nhập số này
                            </p>
                          </div>
                          <div>
                            <Label>Số sử dụng (Tự động)</Label>
                            <input
                              type="text"
                              value={calculateUsage(reading.meter_start, reading.meter_end).toLocaleString('vi-VN')}
                              disabled
                              className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-semibold text-lg ${
                                calculateUsage(reading.meter_start, reading.meter_end) > 0 ? 'text-blue-600' : 'text-gray-500'
                              }`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              = Số cuối - Số đầu
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {formData.room_id && meterReadings.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800">
                  {contractServices.length === 0 
                    ? 'Phòng này chưa có hợp đồng hoặc không có dịch vụ tính theo đồng hồ'
                    : 'Đang tải thông tin dịch vụ...'}
                </p>
              </div>
            )}

            <div>
              <Label>Ghi chú</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                placeholder="Nhập ghi chú (nếu có)..."
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
            onClick={() => navigate('/meter-readings')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="meter-reading-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MeterReadingForm;

