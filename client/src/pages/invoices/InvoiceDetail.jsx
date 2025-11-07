import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Receipt, QrCode, Printer, Eye, TrendingUp, Calendar, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError(error.response?.data?.error || 'Lỗi khi tải thông tin hóa đơn');
      alert(error.response?.data?.error || 'Lỗi khi tải thông tin hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa hóa đơn này?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      navigate('/invoices');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa hóa đơn');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chưa thanh toán', class: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'Thanh toán một phần', class: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Đã thanh toán', class: 'bg-green-100 text-green-800' },
      overdue: { label: 'Quá hạn', class: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges.pending;
  };

  const handleExportPDF = async () => {
    try {
      // Tạo element để render PDF
      const pdfContent = document.createElement('div');
      pdfContent.style.width = '210mm';
      pdfContent.style.padding = '20mm';
      pdfContent.style.backgroundColor = '#ffffff';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      document.body.appendChild(pdfContent);

      // Tạo nội dung PDF
      const statusBadge = getStatusBadge(invoice.status);
      const totalAmount = (invoice.rent_amount || 0) + (invoice.service_amount || 0) + (invoice.previous_debt || 0);

      pdfContent.innerHTML = `
        <div style="max-width: 100%;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
            <h1 style="color: #3b82f6; font-size: 28px; margin: 0; font-weight: bold;">HÓA ĐƠN THANH TOÁN</h1>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Hệ thống Quản lý Nhà trọ</p>
          </div>

          <!-- Invoice Info -->
          <div style="margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div>
                <p style="margin: 5px 0; color: #333;"><strong>Số hóa đơn:</strong> ${invoice.invoice_number || '-'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Ngày hóa đơn:</strong> ${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('vi-VN') : '-'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Hạn thanh toán:</strong> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 5px 0; color: #333;"><strong>Kỳ thanh toán:</strong> Tháng ${invoice.period_month || '-'}/${invoice.period_year || '-'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Trạng thái:</strong> <span style="background: ${statusBadge.class.includes('yellow') ? '#fef3c7' : statusBadge.class.includes('green') ? '#d1fae5' : statusBadge.class.includes('red') ? '#fee2e2' : '#dbeafe'}; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${statusBadge.label}</span></p>
              </div>
            </div>
          </div>

          <!-- Tenant Info -->
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Thông tin khách thuê</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <p style="margin: 5px 0; color: #333;"><strong>Khách thuê:</strong> ${invoice.full_name || invoice.tenant_name || '-'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>SĐT:</strong> ${invoice.phone || invoice.tenant_phone || '-'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Phòng:</strong> ${invoice.room_number || '-'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Chi nhánh:</strong> ${invoice.branch_name || '-'}</p>
              ${invoice.email ? `<p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${invoice.email}</p>` : ''}
              ${invoice.id_card ? `<p style="margin: 5px 0; color: #333;"><strong>CMND/CCCD:</strong> ${invoice.id_card}</p>` : ''}
            </div>
          </div>

          <!-- Services Table -->
          ${invoice.services && invoice.services.length > 0 ? `
            <div style="margin-bottom: 25px;">
              <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Chi tiết dịch vụ</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; color: #374151;">Tên dịch vụ</th>
                    <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; color: #374151;">Đơn vị</th>
                    <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; color: #374151;">Số lượng/Sử dụng</th>
                    <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 12px; color: #374151;">Đơn giá</th>
                    <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 12px; color: #374151;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.services.map((service, index) => `
                    <tr>
                      <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 12px; color: #111827;">${service.service_name || '-'}</td>
                      <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 12px; color: #6b7280;">${service.unit_name || '-'}</td>
                      <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 12px; color: #111827;">
                        ${service.unit === 'meter' 
                          ? (service.meter_usage !== null && service.meter_usage !== undefined
                              ? `${service.meter_start || 0} → ${service.meter_end || 0} = ${service.meter_usage}`
                              : '-')
                          : (service.quantity || 1)}
                      </td>
                      <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 12px; color: #111827; text-align: right;">${formatCurrency(service.price || 0)} đ</td>
                      <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 12px; color: #3b82f6; font-weight: bold; text-align: right;">${formatCurrency(service.amount || 0)} đ</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Summary -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Tổng kết thanh toán</h2>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
              <span style="color: #374151;">Tiền thuê:</span>
              <span style="color: #111827; font-weight: 600;">${formatCurrency(invoice.rent_amount || 0)} đ</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
              <span style="color: #374151;">Tiền dịch vụ:</span>
              <span style="color: #111827; font-weight: 600;">${formatCurrency(invoice.service_amount || 0)} đ</span>
            </div>
            ${(invoice.previous_debt || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; color: #dc2626;">
                <span>Nợ kỳ trước:</span>
                <span style="font-weight: 600;">${formatCurrency(invoice.previous_debt || 0)} đ</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin: 15px 0 10px 0; padding-top: 15px; border-top: 2px solid #3b82f6; font-size: 16px; font-weight: bold;">
              <span style="color: #3b82f6;">Tổng tiền phải thanh toán:</span>
              <span style="color: #3b82f6;">${formatCurrency(totalAmount)} đ</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; color: #059669;">
              <span>Đã thanh toán:</span>
              <span style="font-weight: 600;">${formatCurrency(invoice.paid_amount || 0)} đ</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 18px; font-weight: bold;">
              <span style="color: ${(invoice.remaining_amount || 0) > 0 ? '#dc2626' : (invoice.remaining_amount || 0) < 0 ? '#2563eb' : '#059669'};">
                ${(invoice.remaining_amount || 0) < 0 ? 'Thừa/Đã hoàn:' : 'Còn lại:'}
              </span>
              <span style="color: ${(invoice.remaining_amount || 0) > 0 ? '#dc2626' : (invoice.remaining_amount || 0) < 0 ? '#2563eb' : '#059669'};">
                ${formatCurrency(Math.abs(invoice.remaining_amount || 0))} đ${(invoice.remaining_amount || 0) < 0 ? ' (Thừa)' : ''}
              </span>
            </div>
          </div>

          ${invoice.notes ? `
            <div style="margin-bottom: 25px;">
              <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Ghi chú</h2>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${invoice.notes}</p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 5px 0;">Hệ thống Quản lý Nhà trọ - Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      `;

      // Chờ render xong
      await new Promise(resolve => setTimeout(resolve, 100));

      // Chuyển đổi sang canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Tạo PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Xóa element tạm
      document.body.removeChild(pdfContent);

      // Tải xuống
      const fileName = `HoaDon_${invoice.invoice_number || invoice.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Lỗi khi xuất PDF. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lỗi</h1>
            <p className="text-gray-600 mt-1">{error || 'Không tìm thấy hóa đơn'}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">{error || 'Không tìm thấy hóa đơn'}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/invoices')}>Quay lại danh sách</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(invoice.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{invoice.invoice_number || 'Hóa đơn'}</h1>
              <p className="text-gray-600 mt-1">Chi tiết hóa đơn</p>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.remaining_amount > 0 && (
              <Button 
                variant="outline" 
                className="bg-green-50 text-green-700 hover:bg-green-100"
                onClick={() => navigate(`/transactions/new?invoiceId=${id}`)}
              >
                <Receipt size={16} className="mr-2" />
                Tạo phiếu thu
              </Button>
            )}
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown size={16} className="mr-2" />
              Xuất PDF
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} className="mr-2" />
              In
            </Button>
            <Button onClick={() => navigate(`/invoices/${id}/edit`)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Receipt className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Thông tin hóa đơn</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Số hóa đơn</p>
                    <p className="text-lg font-semibold text-gray-800 mt-1">{invoice.invoice_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadge.class}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày hóa đơn</p>
                    <p className="text-gray-800 mt-1">
                      {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hạn thanh toán</p>
                    <p className="text-gray-800 mt-1">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kỳ thanh toán</p>
                    <p className="text-gray-800 mt-1">
                      {invoice.period_month && invoice.period_year 
                        ? `Tháng ${invoice.period_month}/${invoice.period_year}` 
                        : '-'}
                    </p>
                  </div>
                  {invoice.actual_days && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Số ngày thực tế</p>
                      <p className="text-gray-800 mt-1">{invoice.actual_days} ngày</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Thông tin phòng và khách thuê</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Phòng:</span> {invoice.room_number || '-'}</p>
                    <p><span className="font-medium">Chi nhánh:</span> {invoice.branch_name || '-'}</p>
                    <p><span className="font-medium">Khách thuê:</span> {invoice.full_name || invoice.tenant_name || '-'}</p>
                    <p><span className="font-medium">SĐT:</span> {invoice.phone || invoice.tenant_phone || '-'}</p>
                    <p><span className="font-medium">Email:</span> {invoice.email || '-'}</p>
                    <p><span className="font-medium">CMND/CCCD:</span> {invoice.id_card || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          {invoice.services && invoice.services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dịch vụ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên dịch vụ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn vị
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng/Sử dụng
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoice.services.map((service, index) => (
                        <tr key={service.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{service.service_name || '-'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{service.unit_name || '-'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {service.unit === 'meter' 
                                ? (service.meter_usage !== null && service.meter_usage !== undefined
                                    ? `${service.meter_start || 0} → ${service.meter_end || 0} = ${service.meter_usage}`
                                    : '-')
                                : (service.quantity || 1)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCurrency(service.price || 0)} đ</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-blue-600">
                              {formatCurrency(service.amount || 0)} đ
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Summary & QR Code */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng kết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiền thuê:</span>
                  <span className="font-medium">{formatCurrency(invoice.rent_amount || 0)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiền dịch vụ:</span>
                  <span className="font-medium">{formatCurrency(invoice.service_amount || 0)} đ</span>
                </div>
                <div className={`flex justify-between border-t pt-2 ${
                  (invoice.previous_debt || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <span className="font-medium">Nợ kỳ trước:</span>
                  <span className={`font-semibold ${(invoice.previous_debt || 0) > 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(invoice.previous_debt || 0)} đ
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Tổng tiền phải thanh toán:</span>
                  <span className="text-blue-600">
                    {formatCurrency(
                      (invoice.rent_amount || 0) + 
                      (invoice.service_amount || 0) + 
                      (invoice.previous_debt || 0)
                    )} đ
                  </span>
                </div>
                <div className="text-xs text-gray-500 pt-1">
                  (Tiền thuê + Tiền dịch vụ + Nợ kỳ trước)
                </div>
                <div className="flex justify-between text-green-600 border-t pt-2">
                  <span>Đã thanh toán:</span>
                  <span className="font-semibold">{formatCurrency(invoice.paid_amount || 0)} đ</span>
                </div>
                <div className={`flex justify-between border-t pt-2 ${
                  (invoice.remaining_amount || 0) > 0 
                    ? 'text-red-600' 
                    : (invoice.remaining_amount || 0) < 0 
                      ? 'text-blue-600' 
                      : 'text-green-600'
                }`}>
                  <span className="font-medium">
                    {(invoice.remaining_amount || 0) < 0 ? 'Thừa/Đã hoàn:' : 'Còn lại:'}
                  </span>
                  <span className="text-xl font-bold">
                    {formatCurrency(Math.abs(invoice.remaining_amount || 0))} đ
                    {(invoice.remaining_amount || 0) < 0 && <span className="text-sm ml-1">(Thừa)</span>}
                  </span>
                </div>
                {invoice.transactions && invoice.transactions.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-2">
                      Tổng đã thanh toán qua {invoice.transactions.length} phiếu thu:
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(invoice.transactions.reduce((sum, t) => sum + (t.amount || 0), 0))} đ
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          {invoice.qr_code && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Mã QR thanh toán</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <img
                    src={invoice.qr_code}
                    alt="QR Code"
                    className="w-48 h-48 border border-gray-300 rounded-lg p-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Quét mã QR để thanh toán
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Transactions */}
          {invoice.transactions && invoice.transactions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <CardTitle>Lịch sử thanh toán</CardTitle>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {invoice.transactions.length} phiếu thu liên quan đến hóa đơn này
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/transactions/${transaction.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-green-700">
                            {transaction.transaction_number}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full">
                            Phiếu thu
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{new Date(transaction.transaction_date).toLocaleDateString('vi-VN')}</span>
                          </div>
                          {transaction.account_name && (
                            <span>Tài khoản: {transaction.account_name}</span>
                          )}
                          {transaction.payment_method && (
                            <span>
                              {transaction.payment_method === 'cash' ? 'Tiền mặt' :
                               transaction.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                               transaction.payment_method === 'momo' ? 'MoMo' :
                               transaction.payment_method === 'zalo_pay' ? 'ZaloPay' : 'Khác'}
                            </span>
                          )}
                        </div>
                        {transaction.description && (
                          <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +{formatCurrency(transaction.amount || 0)} đ
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions/${transaction.id}`);
                          }}
                        >
                          <Eye size={14} className="mr-1" />
                          Xem
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Tổng đã thanh toán:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(invoice.transactions.reduce((sum, t) => sum + (t.amount || 0), 0))} đ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
