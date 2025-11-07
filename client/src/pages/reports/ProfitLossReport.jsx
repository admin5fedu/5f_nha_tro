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

const ProfitLossReport = () => {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [filters, setFilters] = useState({
    startDate: defaultRange.start,
    endDate: defaultRange.end
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadData = async (overrideFilters) => {
    const params = overrideFilters || filters;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/profit-loss', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate
        }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error loading profit & loss report:', err);
      setError(err.response?.data?.error || 'Không thể tải báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadData(filters);
  };

  const handleReset = () => {
    setFilters(defaultRange);
    loadData(defaultRange);
  };

  const summary = data?.summary || { total_income: 0, total_expense: 0, net_profit: 0 };
  const incomeBreakdown = data?.income_breakdown || [];
  const expenseBreakdown = data?.expense_breakdown || [];
  const timeline = data?.timeline || [];

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6 lg:static lg:pb-0 lg:mb-0 lg:mx-0 lg:px-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-2 gap-4 w-full lg:max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={filters.startDate}
              />
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
                'Xem báo cáo'
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
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Doanh thu</CardTitle>
            <CardDescription className="text-blue-100">Tổng thu trong kỳ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{currencyFormatter.format(summary.total_income || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Chi phí</CardTitle>
            <CardDescription className="text-rose-100">Tổng chi trong kỳ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{currencyFormatter.format(summary.total_expense || 0)}</p>
          </CardContent>
        </Card>
        <Card className={`shadow-lg ${summary.net_profit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white'}`}>
          <CardHeader>
            <CardTitle>Lợi nhuận</CardTitle>
            <CardDescription className="text-emerald-100">Doanh thu trừ chi phí</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{currencyFormatter.format(summary.net_profit || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Chi tiết doanh thu</CardTitle>
            <CardDescription>Phân bổ theo danh mục</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomeBreakdown.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu</td>
                    </tr>
                  )}
                  {incomeBreakdown.map((item) => (
                    <tr key={item.category_code}>
                      <td className="px-6 py-3 text-sm text-gray-700">{item.category_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">{currencyFormatter.format(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Chi tiết chi phí</CardTitle>
            <CardDescription>Phân bổ theo danh mục</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Chi phí</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenseBreakdown.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu</td>
                    </tr>
                  )}
                  {expenseBreakdown.map((item) => (
                    <tr key={item.category_code}>
                      <td className="px-6 py-3 text-sm text-gray-700">{item.category_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">{currencyFormatter.format(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diễn biến theo ngày</CardTitle>
          <CardDescription>Doanh thu, chi phí và lợi nhuận mỗi ngày</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ngày</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Doanh thu</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Chi phí</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Lợi nhuận</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeline.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu</td>
                  </tr>
                )}
                {timeline.map((row) => (
                  <tr key={row.date}>
                    <td className="px-6 py-3 text-sm text-gray-700">{new Date(row.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-3 text-sm text-right text-emerald-600 font-medium">{currencyFormatter.format(row.income)}</td>
                    <td className="px-6 py-3 text-sm text-right text-rose-600 font-medium">{currencyFormatter.format(row.expense)}</td>
                    <td className={`px-6 py-3 text-sm text-right font-semibold ${row.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currencyFormatter.format(row.net)}</td>
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

export default ProfitLossReport;

