import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Receipt, Download, FileText, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showBulkForm, setShowBulkForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      alert('Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa hóa đơn này?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      loadInvoices();
    } catch (error) {
      alert('Lỗi khi xóa hóa đơn');
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const handleExportPDF = async (invoice) => {
    try {
      // Load full invoice data
      const response = await api.get(`/invoices/${invoice.id}`);
      const fullInvoice = response.data;

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
      const statusBadge = getStatusBadge(fullInvoice.status);
      const totalAmount = (fullInvoice.rent_amount || 0) + (fullInvoice.service_amount || 0) + (fullInvoice.previous_debt || 0);

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
                <p style="margin: 5px 0; color: #333;"><strong>Số hóa đơn:</strong> ${fullInvoice.invoice_number || '-'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Ngày hóa đơn:</strong> ${fullInvoice.invoice_date ? new Date(fullInvoice.invoice_date).toLocaleDateString('vi-VN') : '-'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Hạn thanh toán:</strong> ${fullInvoice.due_date ? new Date(fullInvoice.due_date).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 5px 0; color: #333;"><strong>Kỳ thanh toán:</strong> Tháng ${fullInvoice.period_month || '-'}/${fullInvoice.period_year || '-'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Trạng thái:</strong> <span style="background: ${statusBadge.class.includes('yellow') ? '#fef3c7' : statusBadge.class.includes('green') ? '#d1fae5' : statusBadge.class.includes('red') ? '#fee2e2' : '#dbeafe'}; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${statusBadge.label}</span></p>
              </div>
            </div>
          </div>

          <!-- Tenant Info -->
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Thông tin khách thuê</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <p style="margin: 5px 0; color: #333;"><strong>Khách thuê:</strong> ${fullInvoice.full_name || fullInvoice.tenant_name || '-'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>SĐT:</strong> ${fullInvoice.phone || fullInvoice.tenant_phone || '-'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Phòng:</strong> ${fullInvoice.room_number || '-'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Chi nhánh:</strong> ${fullInvoice.branch_name || '-'}</p>
              ${fullInvoice.email ? `<p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${fullInvoice.email}</p>` : ''}
              ${fullInvoice.id_card ? `<p style="margin: 5px 0; color: #333;"><strong>CMND/CCCD:</strong> ${fullInvoice.id_card}</p>` : ''}
            </div>
          </div>

          <!-- Services Table -->
          ${fullInvoice.services && fullInvoice.services.length > 0 ? `
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
                  ${fullInvoice.services.map((service, index) => `
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
              <span style="color: #111827; font-weight: 600;">${formatCurrency(fullInvoice.rent_amount || 0)} đ</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
              <span style="color: #374151;">Tiền dịch vụ:</span>
              <span style="color: #111827; font-weight: 600;">${formatCurrency(fullInvoice.service_amount || 0)} đ</span>
            </div>
            ${(fullInvoice.previous_debt || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; color: #dc2626;">
                <span>Nợ kỳ trước:</span>
                <span style="font-weight: 600;">${formatCurrency(fullInvoice.previous_debt || 0)} đ</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin: 15px 0 10px 0; padding-top: 15px; border-top: 2px solid #3b82f6; font-size: 16px; font-weight: bold;">
              <span style="color: #3b82f6;">Tổng tiền phải thanh toán:</span>
              <span style="color: #3b82f6;">${formatCurrency(totalAmount)} đ</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; color: #059669;">
              <span>Đã thanh toán:</span>
              <span style="font-weight: 600;">${formatCurrency(fullInvoice.paid_amount || 0)} đ</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 18px; font-weight: bold;">
              <span style="color: ${(fullInvoice.remaining_amount || 0) > 0 ? '#dc2626' : (fullInvoice.remaining_amount || 0) < 0 ? '#2563eb' : '#059669'};">
                ${(fullInvoice.remaining_amount || 0) < 0 ? 'Thừa/Đã hoàn:' : 'Còn lại:'}
              </span>
              <span style="color: ${(fullInvoice.remaining_amount || 0) > 0 ? '#dc2626' : (fullInvoice.remaining_amount || 0) < 0 ? '#2563eb' : '#059669'};">
                ${formatCurrency(Math.abs(fullInvoice.remaining_amount || 0))} đ${(fullInvoice.remaining_amount || 0) < 0 ? ' (Thừa)' : ''}
              </span>
            </div>
          </div>

          ${fullInvoice.notes ? `
            <div style="margin-bottom: 25px;">
              <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Ghi chú</h2>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${fullInvoice.notes}</p>
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
      const fileName = `HoaDon_${fullInvoice.invoice_number || fullInvoice.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Lỗi khi xuất PDF. Vui lòng thử lại.');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = !filters.search || objectContainsTerm(invoice, filters.search);
    const matchesStatus = !filters.status || invoice.status === filters.status;
    const matchesMonth = !filters.period_month || invoice.period_month === parseInt(filters.period_month);
    const matchesYear = !filters.period_year || invoice.period_year === parseInt(filters.period_year);
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const filterConfig = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'pending', label: 'Chưa thanh toán' },
        { value: 'partial', label: 'Thanh toán một phần' },
        { value: 'paid', label: 'Đã thanh toán' },
        { value: 'overdue', label: 'Quá hạn' }
      ]
    },
    {
      key: 'period_month',
      label: 'Tháng',
      type: 'select',
      options: Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: `Tháng ${i + 1}`
      }))
    },
    {
      key: 'period_year',
      label: 'Năm',
      type: 'select',
      options: Array.from({ length: 5 }, (_, i) => {
        const year = new Date().getFullYear() - 2 + i;
        return { value: String(year), label: String(year) };
      })
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm hóa đơn, khách thuê, phòng, ghi chú..."
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkForm(!showBulkForm)}>
            <FileText size={16} className="mr-2" />
            Tạo hàng loạt
          </Button>
          <Button onClick={() => navigate('/invoices/new')} className="flex items-center gap-2">
            <Plus size={16} />
            Thêm
          </Button>
        </div>
      </div>

      {/* Bulk Create Form */}
      {showBulkForm && (
        <BulkInvoiceForm
          onClose={() => setShowBulkForm(false)}
          onSuccess={() => {
            setShowBulkForm(false);
            loadInvoices();
          }}
        />
      )}

      {/* Desktop: Table View */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Số hóa đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Khách thuê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Kỳ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Đã thanh toán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Còn lại
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
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        Chưa có hóa đơn
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const statusBadge = getStatusBadge(invoice.status);
                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={(e) => {
                            // Only navigate if clicking on the row itself, not on buttons
                            if (e.target.closest('button') || e.target.closest('td[onclick]')) {
                              return;
                            }
                            navigate(`/invoices/${invoice.id}`);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(invoice.invoice_date).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Phòng {invoice.room_number}</div>
                            <div className="text-sm text-gray-500">{invoice.branch_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{invoice.tenant_name}</div>
                            <div className="text-sm text-gray-500">{invoice.tenant_phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {invoice.period_month}/{invoice.period_year}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.total_amount)} đ
                            </div>
                            {invoice.previous_debt > 0 && (
                              <div className="text-xs text-red-600">
                                Nợ kỳ trước: {formatCurrency(invoice.previous_debt)} đ
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(invoice.paid_amount)} đ
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              invoice.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(invoice.remaining_amount)} đ
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.class}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportPDF(invoice);
                              }}
                              title="Xuất PDF"
                            >
                              <FileDown size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(invoice.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có hóa đơn
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => {
            const statusBadge = getStatusBadge(invoice.status);
            return (
              <Card
                key={invoice.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={(e) => {
                  // Only navigate if clicking on the card itself, not on buttons
                  if (e.target.closest('button') || e.target.closest('[onclick]')) {
                    return;
                  }
                  navigate(`/invoices/${invoice.id}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                      <p className="text-sm text-gray-600">
                        Phòng {invoice.room_number} - {invoice.tenant_name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${statusBadge.class}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kỳ:</span>
                      <span className="font-medium">{invoice.period_month}/{invoice.period_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng tiền:</span>
                      <span className="font-semibold">{formatCurrency(invoice.total_amount)} đ</span>
                    </div>
                    {invoice.previous_debt > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Nợ kỳ trước:</span>
                        <span>{formatCurrency(invoice.previous_debt)} đ</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đã thanh toán:</span>
                      <span>{formatCurrency(invoice.paid_amount)} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Còn lại:</span>
                      <span className={`font-medium ${
                        invoice.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(invoice.remaining_amount)} đ
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex gap-2 pt-4 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                    >
                      <Edit size={16} className="mr-2" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleExportPDF(invoice)}
                    >
                      <FileDown size={16} className="mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                    >
                      <Edit size={16} className="mr-2" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDelete(invoice.id)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

// Bulk Invoice Form Component
const BulkInvoiceForm = ({ onClose, onSuccess }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    selected_contracts: []
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await api.get('/contracts?status=active');
      setContracts(response.data);
    } catch (error) {
      console.error('Error loading contracts:', error);
      alert('Lỗi khi tải danh sách hợp đồng');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selected_contracts.length === 0) {
      alert('Vui lòng chọn ít nhất một hợp đồng');
      return;
    }

    setLoading(true);
    try {
      await api.post('/invoices/bulk', {
        contract_ids: formData.selected_contracts,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        period_month: formData.period_month,
        period_year: formData.period_year
      });
      alert(`Đã tạo hóa đơn cho ${formData.selected_contracts.length} hợp đồng thành công!`);
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi tạo hóa đơn hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  const toggleContract = (contractId) => {
    setFormData(prev => ({
      ...prev,
      selected_contracts: prev.selected_contracts.includes(contractId)
        ? prev.selected_contracts.filter(id => id !== contractId)
        : [...prev.selected_contracts, contractId]
    }));
  };

  const selectAll = () => {
    setFormData(prev => ({
      ...prev,
      selected_contracts: contracts.map(c => c.id)
    }));
  };

  const deselectAll = () => {
    setFormData(prev => ({
      ...prev,
      selected_contracts: []
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo hóa đơn hàng loạt</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày hóa đơn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hạn thanh toán <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tháng <span className="text-red-500">*</span>
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Năm <span className="text-red-500">*</span>
              </label>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Chọn hợp đồng <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                  Chọn tất cả
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                  Bỏ chọn
                </Button>
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
              {contracts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Không có hợp đồng nào</p>
              ) : (
                <div className="space-y-2">
                  {contracts.map((contract) => (
                    <label key={contract.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selected_contracts.includes(contract.id)}
                        onChange={() => toggleContract(contract.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        Phòng {contract.room_number} - {contract.tenant_name} ({contract.branch_name})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Đã chọn: {formData.selected_contracts.length} hợp đồng
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Đang tạo...' : `Tạo ${formData.selected_contracts.length} hóa đơn`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoicesList;

