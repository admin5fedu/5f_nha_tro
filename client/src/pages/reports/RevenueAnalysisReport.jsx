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
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const RevenueAnalysisReport = () => {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [filters, setFilters] = useState({ startDate: defaultRange.start, endDate: defaultRange.end });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadData = async (overrideFilters) => {
    const params = overrideFilters || filters;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/revenue-analysis', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate
        }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error loading revenue analysis report:', err);
      setError(err.response?.data?.error || 'Không thể tải báo cáo doanh thu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    setFilters(defaultRange);
    loadData(defaultRange);
  };

  const summary = {
    total: data?.total_revenue || 0,
    range: data?.range
  };
  const categoryData = data?.revenue_by_category || [];
  const monthlyData = data?.revenue_by_month || [];
  const topCategoryShare = useMemo(() => {
    if (!categoryData.length || !summary.total) {
      return 0;
    }
    return (categoryData[0].total / summary.total) * 100;
  }, [categoryData, summary.total]);

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
        <Card className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg">
          <CardHeader>
            <CardTitle>Tổng doanh thu</CardTitle>
            <CardDescription className="text-indigo-100">Giai đoạn được chọn</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{currencyFormatter.format(summary.total)}</p>
            {summary.range && (
              <p className="mt-2 text-sm text-indigo-100">
                {new Date(summary.range.start).toLocaleDateString('vi-VN')} — {new Date(summary.range.end).toLocaleDateString('vi-VN')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Danh mục hàng đầu</CardTitle>
            <CardDescription>Đóng góp lớn nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900">
              {categoryData.length > 0 ? categoryData[0].category_name : 'Chưa có dữ liệu'}
            </p>
            {categoryData.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {currencyFormatter.format(categoryData[0].total)} ({topCategoryShare.toFixed(1)}%)
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Số tháng trong kỳ</CardTitle>
            <CardDescription>Thời gian phân tích</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{monthlyData.length}</p>
            <p className="text-sm text-gray-600 mt-1">Tháng có giao dịch được ghi nhận</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo danh mục</CardTitle>
            <CardDescription>Chi tiết từng nguồn doanh thu</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Doanh thu</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryData.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu doanh thu.</td>
                    </tr>
                  )}
                  {categoryData.map((item) => (
                    <tr key={item.category_code}>
                      <td className="px-6 py-3 text-sm text-gray-700">{item.category_name}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">{currencyFormatter.format(item.total)}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-600">
                        {summary.total ? ((item.total / summary.total) * 100).toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription>Xu hướng tăng trưởng</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tháng</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyData.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu theo tháng.</td>
                    </tr>
                  )}
                  {monthlyData.map((item) => (
                    <tr key={item.period}>
                      <td className="px-6 py-3 text-sm text-gray-700">{item.period}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">{currencyFormatter.format(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueAnalysisReport;

