import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2, Filter, RefreshCw } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

const AccountsReceivableReport = () => {
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ branchId: 'all', minOverdueDays: 1 });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data || []);
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const loadData = async (overrideFilters) => {
    const params = overrideFilters || filters;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/accounts-receivable', {
        params: {
          branchId: params.branchId !== 'all' ? params.branchId : undefined,
          minOverdueDays: params.minOverdueDays
        }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error loading accounts receivable report:', err);
      setError(err.response?.data?.error || 'Không thể tải báo cáo công nợ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
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
    const resetFilters = { branchId: 'all', minOverdueDays: 1 };
    setFilters(resetFilters);
    loadData(resetFilters);
  };

  const summary = useMemo(() => data?.summary || { total_invoices: 0, total_amount: 0, total_outstanding: 0, max_overdue: 0 }, [data]);
  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6 lg:static lg:pb-0 lg:mb-0 lg:mx-0 lg:px-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <select
                value={filters.branchId}
                onChange={(e) => handleChange('branchId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày quá hạn tối thiểu</label>
              <input
                type="number"
                min={1}
                value={filters.minOverdueDays}
                onChange={(e) => handleChange('minOverdueDays', Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Đặt lại
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  Lọc dữ liệu
                </>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Tổng công nợ</CardTitle>
            <CardDescription>Giá trị hoá đơn chưa thu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{currencyFormatter.format(summary.total_outstanding || 0)}</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Số hoá đơn</CardTitle>
            <CardDescription>Hoá đơn đang quá hạn</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.total_invoices || 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Tổng giá trị</CardTitle>
            <CardDescription>Giá trị gốc của hoá đơn</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{currencyFormatter.format(summary.total_amount || 0)}</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Quá hạn lâu nhất</CardTitle>
            <CardDescription>Số ngày chậm nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.max_overdue || 0} ngày</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách công nợ quá hạn</CardTitle>
          <CardDescription>Các khoản chưa thu theo khách hàng/phòng</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hóa đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Khách thuê</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phòng</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Chi nhánh</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ngày đến hạn</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Quá hạn</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Giá trị</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Còn nợ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">Không có công nợ quá hạn.</td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-700">{item.invoice_number}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{item.tenant_name || '—'}</div>
                      {item.tenant_phone && (
                        <div className="text-xs text-gray-500">{item.tenant_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{item.room_number || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{item.branch_name || '—'}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-700">{new Date(item.due_date).toLocaleDateString('vi-VN')}</td>
                    <td className={`px-6 py-3 text-sm text-right font-semibold ${item.overdue_days >= 60 ? 'text-rose-600' : item.overdue_days >= 30 ? 'text-orange-500' : 'text-amber-500'}`}>
                      {item.overdue_days} ngày
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900">{currencyFormatter.format(item.total_amount || 0)}</td>
                    <td className="px-6 py-3 text-sm text-right text-rose-600 font-semibold">{currencyFormatter.format(item.remaining_amount || 0)}</td>
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

export default AccountsReceivableReport;

