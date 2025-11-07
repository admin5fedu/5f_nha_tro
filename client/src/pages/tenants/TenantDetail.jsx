import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, MapPin, Users, FileText, Receipt, Calendar, Eye, Car } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    try {
      const response = await api.get(`/tenants/${id}`);
      setTenant(response.data);
    } catch (error) {
      console.error('Error loading tenant:', error);
      alert('Lỗi khi tải thông tin khách thuê');
      navigate('/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa khách thuê này?')) return;
    try {
      await api.delete(`/tenants/${id}`);
      navigate('/tenants');
    } catch (error) {
      alert('Lỗi khi xóa khách thuê');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!tenant) {
    return <div className="text-center py-8">Không tìm thấy khách thuê</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{tenant.full_name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết khách thuê</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/tenants/${id}/edit`)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{tenant.full_name}</p>
              </div>
              {tenant.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                  <p className="text-gray-800 mt-1 flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {tenant.phone}
                  </p>
                </div>
              )}
              {tenant.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-800 mt-1 flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    {tenant.email}
                  </p>
                </div>
              )}
              {tenant.id_card && (
                <div>
                  <p className="text-sm font-medium text-gray-500">CMND/CCCD</p>
                  <p className="text-gray-800 mt-1">{tenant.id_card}</p>
                </div>
              )}
              {tenant.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                  <p className="text-gray-800 mt-1 flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    {tenant.address}
                  </p>
                </div>
              )}
              {tenant.hometown && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Quê quán</p>
                  <p className="text-gray-800 mt-1">{tenant.hometown}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Tạm trú tạm vắng</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    tenant.has_temp_residence === 'yes'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {tenant.has_temp_residence === 'yes' ? 'Đã có' : 'Chưa có'}
                </span>
              </div>
              {tenant.emergency_contact && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Liên hệ khẩn cấp</p>
                  <p className="text-gray-800 mt-1">{tenant.emergency_contact}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Loại khách thuê</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    tenant.tenant_type === 'owner'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {tenant.tenant_type === 'owner' ? 'Chủ phòng' : 'Ở cùng'}
                </span>
              </div>
              {tenant.tenant_type === 'cotenant' && tenant.owner_name && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chủ phòng</p>
                    <p className="text-gray-800 mt-1 font-semibold">{tenant.owner_name}</p>
                    {tenant.owner_phone && (
                      <p className="text-sm text-gray-500">{tenant.owner_phone}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:text-blue-900 hover:border-blue-300"
                    onClick={() => {
                      if (tenant.owner_tenant_id) {
                        navigate(`/tenants/${tenant.owner_tenant_id}`);
                      }
                    }}
                    disabled={!tenant.owner_tenant_id}
                  >
                    Xem thông tin chủ phòng
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khác</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenant.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Ghi chú</p>
                  <p className="text-gray-800 mt-1 whitespace-pre-wrap">{tenant.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-gray-800 mt-1">
                  {new Date(tenant.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cotenants List (only for owners) */}
        {tenant.tenant_type === 'owner' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>
                  Khách ở cùng {tenant.cotenants && tenant.cotenants.length > 0 ? `(${tenant.cotenants.length})` : ''}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {tenant.cotenants && tenant.cotenants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenant.cotenants.map((cotenant) => (
                    <div
                      key={cotenant.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tenants/${cotenant.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{cotenant.full_name}</h4>
                          {cotenant.phone && (
                            <p className="text-sm text-gray-500 mt-1">{cotenant.phone}</p>
                          )}
                          {cotenant.email && (
                            <p className="text-sm text-gray-500">{cotenant.email}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tenants/${cotenant.id}`);
                          }}
                        >
                          Xem
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có khách ở cùng nào được khai báo.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tenant Vehicles */}
        {tenant.vehicles && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Car className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>
                  Phương tiện của khách thuê
                  {tenant.vehicles.length > 0 && ` (${tenant.vehicles.length})`}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {tenant.vehicles.length > 0 ? (
                <div className="space-y-3">
                  {tenant.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <div className="flex flex-col gap-3">
                        {vehicle.image_url && (
                          <div className="overflow-hidden rounded-md border border-amber-200">
                            <img
                              src={vehicle.image_url}
                              alt="Ảnh phương tiện"
                              className="w-full object-cover max-h-48"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                              {vehicle.license_plate || 'Chưa có biển số'}
                            </h4>
                            <p className="text-xs text-amber-700 mt-1 capitalize">
                              {vehicle.vehicle_type === 'motorcycle'
                                ? 'Xe máy'
                                : vehicle.vehicle_type === 'car'
                                ? 'Ô tô'
                                : vehicle.vehicle_type === 'bicycle'
                                ? 'Xe đạp'
                                : vehicle.vehicle_type || 'Khác'}
                            </p>
                          </div>
                          {vehicle.created_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(vehicle.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-2">
                          {vehicle.brand && <span>Hãng: {vehicle.brand}</span>}
                          {vehicle.model && <span>Model: {vehicle.model}</span>}
                          {vehicle.color && <span>Màu: {vehicle.color}</span>}
                        </div>
                        {vehicle.description && (
                          <p className="text-xs text-gray-500">
                            Ghi chú: {vehicle.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có phương tiện nào được khai báo.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Related Contracts */}
        {tenant.contracts && tenant.contracts.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Hợp đồng liên quan ({tenant.contracts.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-blue-700">
                          Hợp đồng #{contract.id}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          contract.status === 'active' ? 'bg-green-200 text-green-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {contract.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        {contract.room_number && (
                          <span>Phòng: {contract.room_number}</span>
                        )}
                        {contract.branch_name && (
                          <span>Chi nhánh: {contract.branch_name}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                            {contract.end_date && ` - ${new Date(contract.end_date).toLocaleDateString('vi-VN')}`}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          Giá thuê: {new Intl.NumberFormat('vi-VN').format(contract.monthly_rent || 0)} đ/tháng
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/contracts/${contract.id}`);
                        }}
                      >
                        Xem
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Invoices */}
        {tenant.invoices && tenant.invoices.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Receipt className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Hóa đơn liên quan ({tenant.invoices.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-red-700">
                          {invoice.invoice_number}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-200 text-green-800' :
                          invoice.status === 'partial' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Đã thanh toán' :
                           invoice.status === 'partial' ? 'Thanh toán một phần' :
                           'Chưa thanh toán'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            {invoice.period_month}/{invoice.period_year}
                          </span>
                        </div>
                        {invoice.room_number && (
                          <span>Phòng: {invoice.room_number}</span>
                        )}
                        {invoice.branch_name && (
                          <span>Chi nhánh: {invoice.branch_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          Tổng: {new Intl.NumberFormat('vi-VN').format(invoice.total_amount || 0)} đ
                        </span>
                        <span className="text-xs text-green-600">
                          Đã thanh toán: {new Intl.NumberFormat('vi-VN').format(invoice.paid_amount || 0)} đ
                        </span>
                        {(invoice.remaining_amount || 0) > 0 && (
                          <span className="text-xs text-red-600">
                            Còn lại: {new Intl.NumberFormat('vi-VN').format(invoice.remaining_amount || 0)} đ
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/invoices/${invoice.id}`);
                        }}
                      >
                        Xem
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TenantDetail;

