import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Eye, Gauge, MapPin, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const MeterReadingsList = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadReadings();
    loadRooms();
    loadServices();
  }, []);

  const loadReadings = async () => {
    try {
      const response = await api.get('/meter-readings');
      setReadings(response.data);
    } catch (error) {
      console.error('Error loading meter readings:', error);
      alert('Lỗi khi tải danh sách sổ ghi dịch vụ');
    } finally {
      setLoading(false);
    }
  };

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
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
    try {
      await api.delete(`/meter-readings/${id}`);
      loadReadings();
    } catch (error) {
      alert('Lỗi khi xóa bản ghi');
    }
  };

  const filteredReadings = readings.filter((reading) => {
    const matchesSearch = !filters.search || objectContainsTerm(reading, filters.search);
    const matchesRoom = !filters.room_id || reading.room_id === parseInt(filters.room_id);
    const matchesService = !filters.service_id || reading.service_id === parseInt(filters.service_id);
    const matchesDate = !filters.start_date || new Date(reading.reading_date) >= new Date(filters.start_date);
    const matchesEndDate = !filters.end_date || new Date(reading.reading_date) <= new Date(filters.end_date);
    return matchesSearch && matchesRoom && matchesService && matchesDate && matchesEndDate;
  });

  const filterConfig = [
    {
      key: 'room_id',
      label: 'Phòng',
      type: 'select',
      options: rooms.map(r => ({ value: r.id, label: `Phòng ${r.room_number}` }))
    },
    {
      key: 'service_id',
      label: 'Dịch vụ',
      type: 'select',
      options: services.filter(s => s.unit === 'meter').map(s => ({ value: s.id, label: s.name }))
    },
    {
      key: 'start_date',
      label: 'Từ ngày',
      type: 'date'
    },
    {
      key: 'end_date',
      label: 'Đến ngày',
      type: 'date'
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => navigate('/meter-readings/new')}>
          <Plus size={16} className="mr-2" />
          Ghi số mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách sổ ghi dịch vụ</CardTitle>
            <FilterPanel
              filters={filterConfig}
              onFilterChange={setFilters}
              onReset={() => setFilters({})}
              initialFilters={filters}
              searchPlaceholder="Tìm kiếm phòng, dịch vụ, người ghi..."
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredReadings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có bản ghi nào
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày ghi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số đầu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số cuối</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số sử dụng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hóa đơn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người ghi</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReadings.map((reading) => (
                      <tr key={reading.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reading.reading_date ? new Date(reading.reading_date).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{reading.room_number || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Gauge size={14} className="text-blue-500" />
                            <span>{reading.service_name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {reading.meter_start?.toLocaleString('vi-VN') || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {reading.meter_end?.toLocaleString('vi-VN') || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-blue-600">
                          {reading.meter_usage?.toLocaleString('vi-VN') || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reading.invoice_number ? (
                            <a
                              href={`/invoices/${reading.invoice_id}`}
                              className="text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/invoices/${reading.invoice_id}`);
                              }}
                            >
                              {reading.invoice_number}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reading.recorded_by_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/meter-readings/${reading.id}/edit`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reading.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredReadings.map((reading) => (
                  <Card key={reading.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge size={18} className="text-blue-500" />
                            <span className="font-semibold">{reading.service_name || '-'}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/meter-readings/${reading.id}/edit`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reading.id)}
                              className="text-red-600"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Phòng:</span>
                            <span className="ml-2 font-medium">{reading.room_number || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Ngày ghi:</span>
                            <span className="ml-2 font-medium">
                              {reading.reading_date ? new Date(reading.reading_date).toLocaleDateString('vi-VN') : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Số đầu:</span>
                            <span className="ml-2 font-medium">{reading.meter_start?.toLocaleString('vi-VN') || '0'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Số cuối:</span>
                            <span className="ml-2 font-medium">{reading.meter_end?.toLocaleString('vi-VN') || '0'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Số sử dụng:</span>
                            <span className="ml-2 font-semibold text-blue-600">
                              {reading.meter_usage?.toLocaleString('vi-VN') || '0'}
                            </span>
                          </div>
                          {reading.invoice_number && (
                            <div className="col-span-2">
                              <span className="text-gray-600">Hóa đơn:</span>
                              <a
                                href={`/invoices/${reading.invoice_id}`}
                                className="ml-2 text-blue-600 hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/invoices/${reading.invoice_id}`);
                                }}
                              >
                                {reading.invoice_number}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MeterReadingsList;

