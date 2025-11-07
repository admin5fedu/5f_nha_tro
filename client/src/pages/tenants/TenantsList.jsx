import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Eye, User, Phone, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const TenantsList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await api.get('/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error('Error loading tenants:', error);
      alert('Lỗi khi tải danh sách khách thuê');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa khách thuê này?')) return;
    try {
      await api.delete(`/tenants/${id}`);
      loadTenants();
    } catch (error) {
      alert('Lỗi khi xóa khách thuê');
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = !filters.search || objectContainsTerm(tenant, filters.search);
    const matchesTenantType = !filters.tenant_type || tenant.tenant_type === filters.tenant_type;
    const matchesTempResidence = !filters.has_temp_residence || tenant.has_temp_residence === filters.has_temp_residence;
    const matchesPhone = !filters.phone || tenant.phone?.includes(filters.phone);
    const matchesIdCard = !filters.id_card || tenant.id_card?.includes(filters.id_card);
    const matchesEmail = !filters.email || tenant.email?.toLowerCase().includes(filters.email.toLowerCase());
    return matchesSearch && matchesTenantType && matchesTempResidence && matchesPhone && matchesIdCard && matchesEmail;
  });

  const filterConfig = [
    {
      key: 'tenant_type',
      label: 'Loại khách thuê',
      type: 'select',
      options: [
        { value: 'owner', label: 'Chủ phòng' },
        { value: 'cotenant', label: 'Ở cùng' }
      ]
    },
    {
      key: 'has_temp_residence',
      label: 'Tạm trú tạm vắng',
      type: 'select',
      options: [
        { value: 'yes', label: 'Đã có' },
        { value: 'no', label: 'Chưa có' }
      ]
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      type: 'text',
      placeholder: 'Tìm theo SĐT'
    },
    {
      key: 'id_card',
      label: 'CMND/CCCD',
      type: 'text',
      placeholder: 'Tìm theo CMND/CCCD'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Tìm theo email'
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex items-center justify-between gap-4 flex-wrap lg:static sticky top-16 z-30 bg-white py-2 px-1 -mx-1 lg:py-0 lg:px-0 border-b border-transparent lg:border-0">
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm khách thuê, số điện thoại, CMND..."
        />
        <Button onClick={() => navigate('/tenants/new')} className="flex items-center gap-2">
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
                      Khách thuê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      SĐT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      CMND/CCCD
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Địa chỉ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky right-0">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTenants.length === 0 ? (
                            <tr>
                              <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                Chưa có khách thuê
                              </td>
                            </tr>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/tenants/${tenant.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-full mr-3">
                              <User className="h-5 w-5 text-indigo-600" />
                            </div>
                                    <div className="text-sm font-medium text-gray-900">{tenant.full_name}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      tenant.tenant_type === 'owner'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    {tenant.tenant_type === 'owner' ? 'Chủ phòng' : 'Ở cùng'}
                                  </span>
                                  {tenant.cotenant_count > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {tenant.cotenant_count} người ở cùng
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{tenant.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{tenant.email || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{tenant.id_card || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{tenant.hometown || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      tenant.has_temp_residence === 'yes'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {tenant.has_temp_residence === 'yes' ? 'Đã có' : 'Chưa có'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {tenant.owner_name || '-'}
                                  </div>
                                </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tenants/${tenant.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tenant.id);
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
        {filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có khách thuê
            </CardContent>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/tenants/${tenant.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-3 rounded-full">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tenant.full_name}</CardTitle>
                      {tenant.id_card && (
                        <p className="text-sm text-gray-600">CMND: {tenant.id_card}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {tenant.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span>{tenant.phone}</span>
                    </p>
                  )}
                  {tenant.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span>{tenant.email}</span>
                    </p>
                  )}
                          {tenant.address && (
                            <p className="flex items-start gap-2">
                              <span className="font-medium min-w-[80px]">Địa chỉ:</span>
                              <span className="flex-1">{tenant.address}</span>
                            </p>
                          )}
                          {tenant.hometown && (
                            <p className="flex items-start gap-2">
                              <span className="font-medium min-w-[80px]">Quê quán:</span>
                              <span className="flex-1">{tenant.hometown}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <span className="font-medium min-w-[80px]">Tạm trú:</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tenant.has_temp_residence === 'yes'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {tenant.has_temp_residence === 'yes' ? 'Đã có' : 'Chưa có'}
                            </span>
                          </p>
                          {tenant.tenant_type === 'cotenant' && tenant.owner_name && (
                            <p className="flex items-start gap-2">
                              <span className="font-medium min-w-[80px]">Chủ phòng:</span>
                              <span className="flex-1 font-semibold">{tenant.owner_name}</span>
                            </p>
                          )}
                          {tenant.emergency_contact && (
                            <p className="flex items-start gap-2">
                              <span className="font-medium min-w-[80px]">Liên hệ khẩn cấp:</span>
                              <span>{tenant.emergency_contact}</span>
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
                    onClick={() => navigate(`/tenants/${tenant.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(tenant.id)}
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

export default TenantsList;

