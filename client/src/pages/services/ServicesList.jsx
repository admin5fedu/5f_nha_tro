import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
      alert('Lỗi khi tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    try {
      await api.delete(`/services/${id}`);
      loadServices();
    } catch (error) {
      alert('Lỗi khi xóa dịch vụ');
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = !filters.search || objectContainsTerm(service, filters.search);
    const matchesStatus = !filters.status || service.status === filters.status;
    const matchesUnit = !filters.unit || service.unit === filters.unit;
    return matchesSearch && matchesStatus && matchesUnit;
  });

  const filterConfig = [
    {
      key: 'unit',
      label: 'Loại',
      type: 'select',
      options: [
        { value: 'meter', label: 'Theo đồng hồ' },
        { value: 'quantity', label: 'Theo số lượng' }
      ]
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'active', label: 'Hoạt động' },
        { value: 'inactive', label: 'Ngừng hoạt động' }
      ]
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 lg:static sticky top-16 z-30 bg-white py-2 px-1 -mx-1 lg:py-0 lg:px-0 border-b border-transparent lg:border-0">
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm tên dịch vụ, mô tả, đơn vị..."
        />
        <Button onClick={() => navigate('/services/new')} className="flex items-center gap-2">
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
                      Tên dịch vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Đơn vị
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky right-0">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Chưa có dịch vụ
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr
                        key={service.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/services/${service.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              service.unit === 'meter'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {service.unit === 'meter' ? 'Theo đồng hồ' : 'Theo số lượng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{service.unit_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{service.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              service.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {service.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/services/${service.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(service.id);
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
        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có dịch vụ
            </CardContent>
          </Card>
        ) : (
          filteredServices.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <Zap className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <span
                        className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          service.unit === 'meter'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {service.unit === 'meter' ? 'Theo đồng hồ' : 'Theo số lượng'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      service.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {service.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-start gap-2">
                    <span className="font-medium min-w-[80px]">Đơn vị:</span>
                    <span>{service.unit_name}</span>
                  </p>
                  {service.description && (
                    <p className="flex items-start gap-2">
                      <span className="font-medium min-w-[80px]">Mô tả:</span>
                      <span className="flex-1">{service.description}</span>
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
                    onClick={() => navigate(`/services/${service.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(service.id)}
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

export default ServicesList;

