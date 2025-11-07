import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, FileText, Printer, Download, Receipt, Calendar, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      const response = await api.get(`/contracts/${id}`);
      setContract(response.data);
    } catch (error) {
      console.error('Error loading contract:', error);
      alert('Lỗi khi tải thông tin hợp đồng');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa hợp đồng này?')) return;
    try {
      await api.delete(`/contracts/${id}`);
      navigate('/contracts');
    } catch (error) {
      alert('Lỗi khi xóa hợp đồng');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportDOC = async () => {
    try {
      const response = await api.get(`/contracts/${id}/export`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HopDong_${contract.room_number}_${contract.id}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting contract:', error);
      alert('Lỗi khi xuất hợp đồng');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!contract) {
    return <div className="text-center py-8">Không tìm thấy hợp đồng</div>;
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/contracts')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Hợp đồng #{contract.id}</h1>
              <p className="text-gray-600 mt-1">Chi tiết hợp đồng thuê phòng</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintPDF}>
              <Printer size={16} className="mr-2" />
              In PDF
            </Button>
            <Button variant="outline" onClick={handleExportDOC}>
              <Download size={16} className="mr-2" />
              Xuất DOC
            </Button>
            <Button onClick={() => navigate(`/contracts/${id}/edit`)}>
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

      {/* Print-friendly content */}
      <div className="print-content print-only">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold text-center mb-8">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>
          <p className="text-center mb-8">Số hợp đồng: {contract.id}</p>
          
          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-xl font-bold mb-4">BÊN CHO THUÊ (Bên A):</h2>
              <div className="space-y-2 ml-4">
                <p>- Tên chi nhánh: {contract.name || '-'}</p>
                <p>- Địa chỉ: {contract.address || '-'}</p>
                <p>- Người đại diện: {contract.representative_name || '-'}</p>
                <p>- Chức vụ: {contract.representative_position || '-'}</p>
                <p>- CMND/CCCD: {contract.representative_id_card || '-'}</p>
                <p>- Địa chỉ: {contract.representative_address || '-'}</p>
                <p>- Số điện thoại: {contract.representative_phone || '-'}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">BÊN THUÊ (Bên B):</h2>
              <div className="space-y-2 ml-4">
                <p>- Họ và tên: {contract.full_name || '-'}</p>
                <p>- Số điện thoại: {contract.phone || '-'}</p>
                <p>- Email: {contract.email || '-'}</p>
                <p>- CMND/CCCD: {contract.id_card || '-'}</p>
                <p>- Địa chỉ: {contract.address || '-'}</p>
                {contract.hometown && <p>- Quê quán: {contract.hometown}</p>}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">THÔNG TIN PHÒNG:</h2>
              <div className="space-y-2 ml-4">
                <p>- Phòng số: {contract.room_number || '-'}</p>
                <p>- Chi nhánh: {contract.branch_name || '-'}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">ĐIỀU KHOẢN HỢP ĐỒNG:</h2>
              <div className="space-y-4 ml-4">
                <div>
                  <p className="font-semibold">1. Thời hạn hợp đồng:</p>
                  <p className="ml-4">- Ngày bắt đầu: {new Date(contract.start_date).toLocaleDateString('vi-VN')}</p>
                  {contract.end_date && (
                    <p className="ml-4">- Ngày kết thúc: {new Date(contract.end_date).toLocaleDateString('vi-VN')}</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold">2. Giá thuê và tiền cọc:</p>
                  <p className="ml-4">- Giá thuê/tháng: {new Intl.NumberFormat('vi-VN').format(contract.monthly_rent)} đ</p>
                  {contract.deposit > 0 && (
                    <p className="ml-4">- Tiền cọc: {new Intl.NumberFormat('vi-VN').format(contract.deposit)} đ</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold">3. Dịch vụ kèm theo:</p>
                  {contract.services && contract.services.length > 0 ? (
                    <ul className="ml-4 list-disc">
                      {contract.services.map((service) => {
                        const total = service.unit === 'quantity' && service.quantity > 1 
                          ? service.price * service.quantity 
                          : service.price;
                        return (
                          <li key={service.id}>
                            {service.service_name}
                            {service.unit === 'quantity' && service.quantity > 1 && ` (Số lượng: ${service.quantity})`}
                            : {new Intl.NumberFormat('vi-VN').format(service.price)} đ
                            {service.unit === 'quantity' && service.quantity > 1 && ` (Tổng: ${new Intl.NumberFormat('vi-VN').format(total)} đ)`}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="ml-4">Không có</p>
                  )}
                </div>
                {contract.notes && (
                  <div>
                    <p className="font-semibold">4. Ghi chú:</p>
                    <p className="ml-4">{contract.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <p className="text-center">Hợp đồng này có hiệu lực kể từ ngày {new Date(contract.start_date).toLocaleDateString('vi-VN')}.</p>
            <p className="text-center">Ngày lập: {new Date(contract.created_at).toLocaleDateString('vi-VN')}</p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="font-bold mb-8">BÊN CHO THUÊ (Bên A)</p>
              <p className="mt-16">{contract.representative_name || '________________'}</p>
              <p className="text-sm mt-2">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="text-center">
              <p className="font-bold mb-8">BÊN THUÊ (Bên B)</p>
              <p className="mt-16">{contract.full_name || '________________'}</p>
              <p className="text-sm mt-2">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Thông tin hợp đồng</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Khách thuê</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{contract.tenant_name}</p>
                <p className="text-sm text-gray-500 mt-1">{contract.tenant_phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phòng</p>
                <p className="text-gray-800 mt-1">Phòng {contract.room_number}</p>
                <p className="text-sm text-gray-500 mt-1">{contract.branch_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày bắt đầu</p>
                <p className="text-gray-800 mt-1">
                  {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {contract.end_date && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Ngày kết thúc</p>
                  <p className="text-gray-800 mt-1">
                    {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Giá thuê</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {new Intl.NumberFormat('vi-VN').format(contract.monthly_rent)} đ/tháng
                </p>
              </div>
              {contract.deposit > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tiền cọc</p>
                  <p className="text-gray-800 mt-1">
                    {new Intl.NumberFormat('vi-VN').format(contract.deposit)} đ
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    contract.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {contract.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dịch vụ</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.services && contract.services.length > 0 ? (
              <div className="space-y-3">
                {contract.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{service.service_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {service.unit === 'meter' ? 'Theo đồng hồ' : 'Theo số lượng'}
                        {service.unit === 'quantity' && service.quantity > 1 && (
                          <span className="ml-2">(Số lượng: {service.quantity})</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        {new Intl.NumberFormat('vi-VN').format(service.price)} đ
                      </p>
                      {service.unit === 'quantity' && service.quantity > 1 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Intl.NumberFormat('vi-VN').format(service.price * service.quantity)} đ (tổng)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có dịch vụ nào</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khác</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contract.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Ghi chú</p>
                  <p className="text-gray-800 mt-1 whitespace-pre-wrap">{contract.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-gray-800 mt-1">
                  {new Date(contract.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Invoices */}
        {contract.invoices && contract.invoices.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Receipt className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Hóa đơn liên quan ({contract.invoices.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contract.invoices.map((invoice) => (
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
                        <Eye size={14} className="mr-1" />
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
    </>
  );
};

export default ContractDetail;

