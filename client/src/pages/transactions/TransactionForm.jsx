import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const TransactionForm = () => {
  const { id, invoiceId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const invoiceIdFromQuery = searchParams.get('invoiceId') || invoiceId;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    type: 'income',
    category_id: '',
    account_id: '',
    invoice_id: invoiceIdFromQuery || '',
    contract_id: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
    if (id && id !== 'new') {
      loadTransaction();
    }
    if (invoiceIdFromQuery) {
      loadInvoice(invoiceIdFromQuery);
    }
  }, [id, invoiceIdFromQuery]);

  const loadData = async () => {
    try {
      const [categoriesRes, accountsRes, invoicesRes] = await Promise.all([
        api.get('/financial-categories'),
        api.get('/accounts?status=active'),
        api.get('/invoices?status=pending')
      ]);
      setCategories(categoriesRes.data);
      setAccounts(accountsRes.data);
      setInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadInvoice = async (invId) => {
    try {
      const response = await api.get(`/invoices/${invId}`);
      const invoice = response.data;
      setSelectedInvoice(invoice);
      setFormData(prev => ({
        ...prev,
        invoice_id: invId,
        amount: invoice.remaining_amount || invoice.total_amount || '',
        description: `Thanh toán hóa đơn ${invoice.invoice_number}`,
        contract_id: invoice.contract_id || ''
      }));
    } catch (error) {
      console.error('Error loading invoice:', error);
    }
  };

  const loadTransaction = async () => {
    try {
      const response = await api.get(`/transactions/${id}`);
      const transaction = response.data;
      setFormData({
        type: transaction.type,
        category_id: transaction.category_id || '',
        account_id: transaction.account_id || '',
        invoice_id: transaction.invoice_id || '',
        contract_id: transaction.contract_id || '',
        amount: transaction.amount || '',
        transaction_date: transaction.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        payment_method: transaction.payment_method || 'cash',
        description: transaction.description || '',
        notes: transaction.notes || ''
      });
      if (transaction.invoice_id) {
        loadInvoice(transaction.invoice_id);
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
      alert('Lỗi khi tải thông tin phiếu thu chi');
      navigate('/transactions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if payment amount exceeds remaining amount for invoice
    if (formData.invoice_id && formData.type === 'income' && selectedInvoice) {
      const paymentAmount = parseFloat(formData.amount) || 0;
      const remainingAmount = selectedInvoice.remaining_amount || 0;
      const totalPaid = selectedInvoice.paid_amount || 0;
      const totalAmount = selectedInvoice.total_amount || 0;
      
      // Calculate what the new remaining amount would be
      const newTotalPaid = totalPaid + paymentAmount;
      const newRemaining = totalAmount - newTotalPaid;
      
      if (paymentAmount > remainingAmount) {
        const excessAmount = paymentAmount - remainingAmount;
        const confirmMessage = `Cảnh báo: Số tiền thanh toán (${formatNumber(paymentAmount)} đ) lớn hơn số tiền còn lại (${formatNumber(remainingAmount)} đ).\n\n` +
          `Số tiền thừa: ${formatNumber(excessAmount)} đ\n\n` +
          `Bạn có chắc muốn tiếp tục? Số tiền thừa sẽ được ghi nhận nhưng không được hoàn lại tự động.`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }
    
    setLoading(true);
    try {
      const data = {
        type: formData.type,
        category_id: formData.category_id || null,
        account_id: parseInt(formData.account_id),
        invoice_id: formData.invoice_id || null,
        contract_id: formData.contract_id || null,
        amount: parseFloat(formData.amount),
        transaction_date: formData.transaction_date,
        payment_method: formData.payment_method,
        description: formData.description || null,
        notes: formData.notes || null
      };

      if (id && id !== 'new') {
        await api.put(`/transactions/${id}`, data);
        navigate(`/transactions/${id}`);
      } else {
        const response = await api.post('/transactions', data);
        navigate(`/transactions/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu phiếu thu chi');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumber = (value) => {
    return value.toString().replace(/,/g, '');
  };

  const handleAmountChange = (value) => {
    const numValue = parseNumber(value);
    setFormData({ ...formData, amount: numValue });
  };

  // Filter categories by type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa phiếu thu chi' : 'Thêm phiếu thu chi'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin phiếu thu chi' : 'Tạo phiếu thu chi mới'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin phiếu thu chi</CardTitle>
          <CardDescription>Điền thông tin phiếu thu chi bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div>
              <Label required>Loại phiếu</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, category_id: '' })}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-green-600 font-medium">Phiếu Thu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, category_id: '' })}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-red-600 font-medium">Phiếu Chi</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <Label required>Danh mục tài chính</Label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Chọn danh mục</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} {category.code ? `(${category.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account */}
              <div>
                <Label required>Tài khoản</Label>
                <select
                  required
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Chọn tài khoản</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type === 'cash' ? 'Tiền mặt' : 'Ngân hàng'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice (optional) */}
              <div>
                <Label>Hóa đơn (nếu có)</Label>
                <select
                  value={formData.invoice_id}
                  onChange={(e) => {
                    if (e.target.value) {
                      loadInvoice(e.target.value);
                    } else {
                      setFormData({ ...formData, invoice_id: '', amount: '', description: '' });
                      setSelectedInvoice(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Không có</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.tenant_name} - {formatNumber(invoice.remaining_amount || invoice.total_amount)} đ
                    </option>
                  ))}
                </select>
                {selectedInvoice && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs space-y-1">
                      <p className="text-gray-700">
                        <span className="font-medium">Tổng tiền:</span> {formatNumber(selectedInvoice.total_amount || 0)} đ
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Đã thanh toán:</span> {formatNumber(selectedInvoice.paid_amount || 0)} đ
                      </p>
                      <p className="text-red-600 font-semibold">
                        <span className="font-medium">Còn lại:</span> {formatNumber(selectedInvoice.remaining_amount || 0)} đ
                      </p>
                      {(selectedInvoice.previous_debt || 0) > 0 && (
                        <p className="text-orange-600">
                          <span className="font-medium">Nợ kỳ trước:</span> {formatNumber(selectedInvoice.previous_debt || 0)} đ
                        </p>
                      )}
                    </div>
                    {parseFloat(formData.amount || 0) > (selectedInvoice.remaining_amount || 0) && (
                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                        ⚠️ Cảnh báo: Số tiền thanh toán lớn hơn số tiền còn lại!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <Label required>Số tiền (đ)</Label>
                <input
                  type="text"
                  required
                  value={formatNumber(formData.amount)}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Transaction Date */}
              <div>
                <Label required>Ngày giao dịch</Label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label>Phương thức thanh toán</Label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="momo">MoMo</option>
                  <option value="zalo_pay">ZaloPay</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Mô tả</Label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả giao dịch"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <Label>Ghi chú</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                placeholder="Ghi chú thêm (nếu có)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/transactions')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="transaction-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;

