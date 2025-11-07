import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Download, FileText, TrendingUp, TrendingDown, Printer } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { exportToPDF, exportToDOCS } from '../../utils/exportTransaction';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/transactions/${id}`);
      setTransaction(response.data);
    } catch (error) {
      console.error('Error loading transaction:', error);
      setError(error.response?.data?.error || 'Lỗi khi tải thông tin phiếu thu chi');
      alert(error.response?.data?.error || 'Lỗi khi tải thông tin phiếu thu chi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa phiếu thu chi này?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      navigate('/transactions');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa phiếu thu chi');
    }
  };

  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        await exportToPDF(transaction, 'transaction-content');
      } else if (format === 'docs') {
        await exportToDOCS(transaction, 'transaction-content');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Lỗi khi xuất phiếu thu chi');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const getTypeBadge = (type) => {
    if (type === 'income') {
      return { label: 'Phiếu Thu', class: 'bg-green-100 text-green-800', icon: TrendingUp, color: 'text-green-600' };
    } else {
      return { label: 'Phiếu Chi', class: 'bg-red-100 text-red-800', icon: TrendingDown, color: 'text-red-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lỗi</h1>
            <p className="text-gray-600 mt-1">{error || 'Không tìm thấy phiếu thu chi'}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">{error || 'Không tìm thấy phiếu thu chi'}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/transactions')}>Quay lại danh sách</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeBadge = getTypeBadge(transaction.type);
  const Icon = typeBadge.icon;

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{transaction.transaction_number || 'Phiếu thu chi'}</h1>
              <p className="text-gray-600 mt-1">Chi tiết phiếu thu chi</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download size={16} className="mr-2" />
              Xuất PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('docs')}>
              <FileText size={16} className="mr-2" />
              Xuất DOCS
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} className="mr-2" />
              In
            </Button>
            <Button onClick={() => navigate(`/transactions/${id}/edit`)}>
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

      {/* Transaction Content for Export */}
      <div id="transaction-content" className="space-y-6">
        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {transaction.type === 'income' ? 'PHIẾU THU' : 'PHIẾU CHI'}
          </h1>
          <p className="text-sm">Số: {transaction.transaction_number}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Transaction Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <CardTitle>Thông tin phiếu thu chi</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Số phiếu</p>
                    <p className="text-lg font-semibold text-gray-800 mt-1">{transaction.transaction_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Loại phiếu</p>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${typeBadge.class}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Danh mục</p>
                    <p className="text-gray-800 mt-1">{transaction.category_name || '-'}</p>
                    {transaction.category_code && (
                      <p className="text-xs text-gray-500 mt-1">Mã: {transaction.category_code}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tài khoản</p>
                    <p className="text-gray-800 mt-1">{transaction.account_name || '-'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {transaction.account_type === 'cash' ? 'Tiền mặt' : 'Ngân hàng'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày giao dịch</p>
                    <p className="text-gray-800 mt-1">
                      {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phương thức thanh toán</p>
                    <p className="text-gray-800 mt-1">
                      {transaction.payment_method === 'cash' ? 'Tiền mặt' :
                       transaction.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                       transaction.payment_method === 'momo' ? 'MoMo' :
                       transaction.payment_method === 'zalo_pay' ? 'ZaloPay' : 'Khác'}
                    </p>
                  </div>
                </div>

                {transaction.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-2">Mô tả</p>
                    <p className="text-gray-800">{transaction.description}</p>
                  </div>
                )}

                {transaction.invoice_number && (
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4">Thông tin hóa đơn</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Số hóa đơn:</span> {transaction.invoice_number}</p>
                      <p><span className="font-medium">Số tiền hóa đơn:</span> {formatCurrency(transaction.invoice_amount)} đ</p>
                    </div>
                  </div>
                )}

                {transaction.room_number && (
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4">Thông tin phòng và khách thuê</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Phòng:</span> {transaction.room_number || '-'}</p>
                      <p><span className="font-medium">Chi nhánh:</span> {transaction.branch_name || '-'}</p>
                      <p><span className="font-medium">Khách thuê:</span> {transaction.tenant_name || '-'}</p>
                      {transaction.tenant_phone && (
                        <p><span className="font-medium">SĐT:</span> {transaction.tenant_phone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Actions */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng kết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className={`text-2xl font-bold ${typeBadge.color}`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount || 0)} đ
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Loại: {typeBadge.label}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Ngày: {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString('vi-VN') : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {transaction.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 whitespace-pre-wrap">{transaction.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Account Info */}
          {transaction.account_number && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Tài khoản:</span> {transaction.account_number}</p>
                  {transaction.bank_name && (
                    <p><span className="font-medium">Ngân hàng:</span> {transaction.bank_name}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <p className="font-semibold mb-4">Người lập phiếu</p>
            <p className="text-sm">(Ký, ghi rõ họ tên)</p>
          </div>
          <div className="text-center">
            <p className="font-semibold mb-4">Người nhận/người nộp</p>
            <p className="text-sm">(Ký, ghi rõ họ tên)</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-sm">
            Ngày {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString('vi-VN') : ''}
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TransactionDetail;

