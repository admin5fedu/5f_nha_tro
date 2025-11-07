import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Eye, Car, Bike, Truck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const VehiclesList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      alert('Lỗi khi tải danh sách phương tiện');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa phương tiện này?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadVehicles();
    } catch (error) {
      alert('Lỗi khi xóa phương tiện');
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'motorcycle':
        return <Bike className="h-5 w-5" />;
      case 'car':
        return <Car className="h-5 w-5" />;
      case 'bicycle':
        return <Bike className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
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

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = !filters.search || objectContainsTerm(vehicle, filters.search);
    const matchesType = !filters.vehicle_type || vehicle.vehicle_type === filters.vehicle_type;
    return matchesSearch && matchesType;
  });

  const filterConfig = [
    {
      key: 'vehicle_type',
      label: 'Loại phương tiện',
      type: 'select',
      options: [
        { value: 'motorcycle', label: 'Xe máy' },
        { value: 'car', label: 'Ô tô' },
        { value: 'bicycle', label: 'Xe đạp' },
        { value: 'other', label: 'Khác' }
      ]
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex items-center justify-between gap-4">
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm biển số, thương hiệu, người sở hữu..."
        />
        <Button onClick={() => navigate('/vehicles/new')} className="flex items-center gap-2">
          <Plus size={16} />
          Thêm
        </Button>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Phương tiện
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Biển số
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Khách thuê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Màu sắc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky right-0">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Chưa có phương tiện
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {vehicle.image_url && (
                              <div className="mr-3 h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-blue-100">
                                <img
                                  src={vehicle.image_url}
                                  alt="Ảnh phương tiện"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-2 rounded-full bg-blue-100 mr-3">
                              {getVehicleIcon(vehicle.vehicle_type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vehicle.brand || '-'} {vehicle.model || ''}
                              </div>
                              {vehicle.description && (
                                <div className="text-sm text-gray-500">{vehicle.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.license_plate || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.tenant_name || '-'}</div>
                          <div className="text-sm text-gray-500">{vehicle.tenant_phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getVehicleTypeLabel(vehicle.vehicle_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{vehicle.color || '-'}</div>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(vehicle.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredVehicles.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có phương tiện
            </CardContent>
          </Card>
        ) : (
          filteredVehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-100">
                      {getVehicleIcon(vehicle.vehicle_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {vehicle.brand || '-'} {vehicle.model || ''}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{vehicle.license_plate || 'Chưa có biển số'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    {getVehicleTypeLabel(vehicle.vehicle_type)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {vehicle.image_url && (
                    <div className="overflow-hidden rounded-md border border-blue-100">
                      <img
                        src={vehicle.image_url}
                        alt="Ảnh phương tiện"
                        className="w-full object-cover max-h-48"
                      />
                    </div>
                  )}
                  <p>
                    <span className="font-medium">Khách thuê:</span> {vehicle.tenant_name || '-'}
                  </p>
                  {vehicle.tenant_phone && (
                    <p>
                      <span className="font-medium">SĐT:</span> {vehicle.tenant_phone}
                    </p>
                  )}
                  {vehicle.color && (
                    <p>
                      <span className="font-medium">Màu sắc:</span> {vehicle.color}
                    </p>
                  )}
                  {vehicle.description && (
                    <p>
                      <span className="font-medium">Mô tả:</span> {vehicle.description}
                    </p>
                  )}
                </div>
                <div
                  className="flex gap-2 pt-4 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VehiclesList;

