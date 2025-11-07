import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const TransactionsList = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsRes, categoriesRes, accountsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/financial-categories'),
        api.get('/accounts?status=active')
      ]);
      setTransactions(transactionsRes.data);
      setCategories(categoriesRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa phiếu thu chi này?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      loadData();
    } catch (error) {
      alert('Lỗi khi xóa phiếu thu chi');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const getTypeBadge = (type) => {
    if (type === 'income') {
      return { label: 'Thu', class: 'bg-green-100 text-green-800', icon: TrendingUp };
    } else {
      return { label: 'Chi', class: 'bg-red-100 text-red-800', icon: TrendingDown };
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = !filters.search || objectContainsTerm(transaction, filters.search);
    const matchesType = !filters.type || transaction.type === filters.type;
    const matchesCategory = !filters.category_id || transaction.category_id === parseInt(filters.category_id);
    const matchesAccount = !filters.account_id || transaction.account_id === parseInt(filters.account_id);
    const matchesDateFrom = !filters.date_from || new Date(transaction.transaction_date) >= new Date(filters.date_from);
    const matchesDateTo = !filters.date_to || new Date(transaction.transaction_date) <= new Date(filters.date_to);
    return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesDateFrom && matchesDateTo;
  });

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterPanel
          filters={[
            {
              key: 'type',
              label: 'Loại',
              type: 'select',
              options: [
                { value: 'income', label: 'Thu' },
                { value: 'expense', label: 'Chi' }
              ]
            },
            {
              key: 'category_id',
              label: 'Danh mục',
              type: 'select',
              options: categories.map(cat => ({ value: String(cat.id), label: `${cat.name} ${cat.code ? `(${cat.code})` : ''}` }))
            },
            {
              key: 'account_id',
              label: 'Tài khoản',
              type: 'select',
              options: accounts.map(acc => ({ value: String(acc.id), label: acc.name }))
            },
            {
              key: 'date_from',
              label: 'Từ ngày',
              type: 'date'
            },
            {
              key: 'date_to',
              label: 'Đến ngày',
              type: 'date'
            }
          ]}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm số phiếu, nội dung, ghi chú..."
        />
        <Button onClick={() => navigate('/transactions/new')} className="flex items-center gap-2">
          <Plus size={16} />
          Thêm phiếu
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
                      Số phiếu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Tài khoản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky right-0">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        Chưa có phiếu thu chi
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const typeBadge = getTypeBadge(transaction.type);
                      const Icon = typeBadge.icon;
                      return (
                        <tr
                          key={transaction.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={(e) => {
                            if (e.target.closest('button') || e.target.closest('td[onclick]')) {
                              return;
                            }
                            navigate(`/transactions/${transaction.id}`);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{transaction.transaction_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeBadge.class}`}>
                              <Icon size={12} className="mr-1" />
                              {typeBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction.category_name || '-'}</div>
                            {transaction.category_code && (
                              <div className="text-xs text-gray-500">{transaction.category_code}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction.account_name || '-'}</div>
                            <div className="text-xs text-gray-500">{transaction.account_type || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-bold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)} đ
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.transaction_date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {transaction.description || transaction.notes || '-'}
                            </div>
                            {transaction.invoice_number && (
                              <div className="text-xs text-blue-600">HĐ: {transaction.invoice_number}</div>
                            )}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/transactions/${transaction.id}/export`)}
                              title="Xuất PDF/DOCS"
                            >
                              <Download size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(transaction.id);
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
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có phiếu thu chi
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => {
            const typeBadge = getTypeBadge(transaction.type);
            const Icon = typeBadge.icon;
            return (
              <Card
                key={transaction.id}
                className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${
                  transaction.type === 'income' ? 'border-green-500' : 'border-red-500'
                }`}
                onClick={(e) => {
                  if (e.target.closest('button') || e.target.closest('[onclick]')) {
                    return;
                  }
                  navigate(`/transactions/${transaction.id}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{transaction.transaction_number}</CardTitle>
                        <p className="text-sm text-gray-600">{transaction.category_name || '-'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${typeBadge.class}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)} đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tài khoản:</span>
                      <span>{transaction.account_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày:</span>
                      <span>{new Date(transaction.transaction_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {transaction.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mô tả:</span>
                        <span className="text-right">{transaction.description}</span>
                      </div>
                    )}
                    {transaction.invoice_number && (
                      <div className="flex justify-between text-blue-600">
                        <span>Hóa đơn:</span>
                        <span>{transaction.invoice_number}</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                    >
                      <Edit size={16} className="mr-2" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/transactions/${transaction.id}/export`)}
                    >
                      <Download size={16} className="mr-2" />
                      Xuất
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDelete(transaction.id)}
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

export default TransactionsList;

