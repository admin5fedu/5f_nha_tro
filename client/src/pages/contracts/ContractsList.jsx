import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Eye, FileText, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { formatCurrency, getExpiryStatus } from '../../utils/format';
import { objectContainsTerm } from '../../utils/search';

const ContractsList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await api.get('/contracts');
      setContracts(response.data);
    } catch (error) {
      console.error('Error loading contracts:', error);
      alert('Lỗi khi tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa hợp đồng này?')) return;
    try {
      await api.delete(`/contracts/${id}`);
      loadContracts();
    } catch (error) {
      alert('Lỗi khi xóa hợp đồng');
    }
  };

  const handleExportContract = async (id) => {
    try {
      const response = await api.get(`/contracts/${id}`);
      const contract = response.data;
      
      // Create contract document content
      const contractText = `
HỢP ĐỒNG THUÊ PHÒNG TRỌ

Thông tin chi nhánh:
- Tên: ${contract.name || '-'}
- Địa chỉ: ${contract.address || '-'}
- Người đại diện: ${contract.representative_name || '-'}
- Chức vụ: ${contract.representative_position || '-'}
- CMND/CCCD: ${contract.representative_id_card || '-'}
- Địa chỉ: ${contract.representative_address || '-'}
- SĐT: ${contract.representative_phone || '-'}

Thông tin khách thuê:
- Họ tên: ${contract.full_name || '-'}
- SĐT: ${contract.phone || '-'}
- CMND/CCCD: ${contract.id_card || '-'}
- Địa chỉ: ${contract.address || '-'}

Thông tin phòng:
- Phòng: ${contract.room_number || '-'}
- Chi nhánh: ${contract.branch_name || '-'}

Điều khoản hợp đồng:
- Ngày bắt đầu: ${new Date(contract.start_date).toLocaleDateString('vi-VN')}
- Ngày kết thúc: ${contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : 'Không xác định'}
- Giá thuê/tháng: ${formatCurrency(contract.monthly_rent)}
- Tiền cọc: ${formatCurrency(contract.deposit || 0)}

Dịch vụ:
${contract.services && contract.services.length > 0
  ? contract.services.map(s => `- ${s.service_name}: ${formatCurrency(s.price)}`).join('\n')
  : 'Không có'}

Ghi chú: ${contract.notes || '-'}
      `.trim();

      // Create and download file
      const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HopDong_${contract.room_number}_${new Date().getTime()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting contract:', error);
      alert('Lỗi khi xuất hợp đồng');
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = !filters.search || objectContainsTerm(contract, filters.search);
    const matchesStatus = !filters.status || contract.status === filters.status;
    const matchesBranch = !filters.branch_name || contract.branch_name === filters.branch_name;
    const matchesStartDate = !filters.start_date_from || new Date(contract.start_date) >= new Date(filters.start_date_from);
    const matchesStartDateTo = !filters.start_date_to || new Date(contract.start_date) <= new Date(filters.start_date_to);
    const matchesRentMin = !filters.rent_min || contract.monthly_rent >= parseFloat(filters.rent_min);
    const matchesRentMax = !filters.rent_max || contract.monthly_rent <= parseFloat(filters.rent_max);
    return matchesSearch && matchesStatus && matchesBranch && matchesStartDate && matchesStartDateTo && matchesRentMin && matchesRentMax;
  });

  const branches = contracts && contracts.length > 0 ? [...new Set(contracts.map(c => c.branch_name).filter(Boolean))] : [];

  const filterConfig = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'ended', label: 'Đã kết thúc' }
      ]
    },
    {
      key: 'branch_name',
      label: 'Chi nhánh',
      type: 'select',
      options: branches && branches.length > 0 ? branches.map(b => ({ value: b, label: b })) : []
    },
    {
      key: 'start_date',
      label: 'Ngày bắt đầu',
      type: 'range',
      dateRange: true
    },
    {
      key: 'rent',
      label: 'Giá thuê (đ)',
      type: 'range'
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
          searchPlaceholder="Tìm hợp đồng, khách thuê, phòng..."
        />
        <Button onClick={() => navigate('/contracts/new')} className="flex items-center gap-2">
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
                      Phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Ngày bắt đầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Giá thuê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Hết hạn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky right-0">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        Chưa có hợp đồng
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((contract) => (
                      <tr
                        key={contract.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{contract.tenant_name}</div>
                              <div className="text-sm text-gray-500">{contract.tenant_phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Phòng {contract.room_number}</div>
                          <div className="text-sm text-gray-500">{contract.branch_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(contract.monthly_rent)}/tháng
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              contract.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {contract.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contract.end_date && (() => {
                            const expiry = getExpiryStatus(contract.end_date);
                            return expiry ? (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${expiry.color}`}>
                                {expiry.label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            );
                          })()}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportContract(contract.id);
                            }}
                            title="Xuất hợp đồng"
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(contract.id);
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
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có hợp đồng
            </CardContent>
          </Card>
        ) : (
          filteredContracts.map((contract) => (
            <Card
              key={contract.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
              onClick={() => navigate(`/contracts/${contract.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contract.tenant_name}</CardTitle>
                      <p className="text-sm text-gray-600">Phòng {contract.room_number} - {contract.branch_name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      contract.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {contract.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center justify-between">
                    <span className="font-medium">Ngày bắt đầu:</span>
                    <span>{new Date(contract.start_date).toLocaleDateString('vi-VN')}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">Giá thuê:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(contract.monthly_rent)}/tháng
                    </span>
                  </p>
                  {contract.end_date && (() => {
                    const expiry = getExpiryStatus(contract.end_date);
                    return expiry ? (
                      <p className="flex items-center justify-between">
                        <span className="font-medium">Hết hạn:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${expiry.color}`}>
                          {expiry.label}
                        </span>
                      </p>
                    ) : null;
                  })()}
                  {contract.end_date && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Ngày kết thúc:</span>
                      <span>{new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>
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
                    onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleExportContract(contract.id)}
                  >
                    <Download size={16} className="mr-2" />
                    Xuất
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(contract.id)}
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

export default ContractsList;

