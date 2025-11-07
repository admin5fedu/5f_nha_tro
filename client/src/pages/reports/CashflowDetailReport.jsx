import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const CashflowDetailReport = () => {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [filters, setFilters] = useState({
    startDate: defaultRange.start,
    endDate: defaultRange.end,
    type: 'all',
    categoryId: 'all'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadCategories = async () => {
    try {
      const response = await api.get('/financial-categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading financial categories:', err);
    }
  };

  const loadData = async (overrideFilters) => {
    const params = overrideFilters || filters;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/cashflow-detail', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          type: params.type !== 'all' ? params.type : undefined,
          categoryId: params.categoryId !== 'all' ? params.categoryId : undefined
        }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error loading cashflow detail report:', err);
      setError(err.response?.data?.error || 'Không thể tải báo cáo thu/chi chi tiết.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadData(filters);
  };

  const handleReset = () => {
    const resetFilters = { ...defaultRange, type: 'all', categoryId: 'all' };
    setFilters(resetFilters);
    loadData(resetFilters);
  };

  const totals = data?.totals || { total_income: 0, total_expense: 0, net_cashflow: 0 };
  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6 lg:static lg:pb-0 lg:mb-0 lg:mx-0 lg:px-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={filters.startDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
              <select
                value={filters.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="income">Thu vào</option>
                <option value="expense">Chi ra</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Đặt lại
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải
                </span>
              ) : (
                'Lọc dữ liệu'
              )}
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Tổng thu</CardTitle>
            <CardDescription className="text-emerald-100">Thu vào trong kỳ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{currencyFormatter.format(totals.total_income || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Tổng chi</CardTitle>
            <CardDescription className="text-rose-100">Chi ra trong kỳ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{currencyFormatter.format(totals.total_expense || 0)}</p>
          </CardContent>
        </Card>
        <Card className={`shadow-lg ${totals.net_cashflow >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white'}`}>
          <CardHeader>
            <CardTitle>Dòng tiền ròng</CardTitle>
            <CardDescription>Chênh lệch thu - chi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{currencyFormatter.format(totals.net_cashflow || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết giao dịch</CardTitle>
          <CardDescription>Tổng hợp các giao dịch tài chính theo bộ lọc</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Số chứng từ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tài khoản</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nội dung</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Không có giao dịch phù hợp điều kiện lọc.</td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">{new Date(item.transaction_date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.transaction_number}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          item.type === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.type === 'income' ? 'Thu vào' : 'Chi ra'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{item.category_name}</div>
                      <div className="text-xs text-gray-500">{item.category_code}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{item.account_name || '—'}</div>
                      <div className="text-xs text-gray-500 uppercase">{item.account_type || '—'}</div>
                    </td>
                    <td className={`px-6 py-3 text-sm text-right font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currencyFormatter.format(item.amount || 0)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 max-w-xs">
                      <div className="line-clamp-2">{item.description || item.notes || '—'}</div>
                      {item.notes && item.description && (
                        <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashflowDetailReport;

