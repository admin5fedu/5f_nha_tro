import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Eye, Wallet, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const AccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsRes, balanceRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/accounts/total-balance')
      ]);
      setAccounts(accountsRes.data);
      setTotalBalance(balanceRes.data.total || 0);
    } catch (error) {
      console.error('Error loading accounts:', error);
      alert('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      loadData();
    } catch (error) {
      alert('Lỗi khi xóa tài khoản');
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = !filters.search || objectContainsTerm(account, filters.search);
    const matchesType = !filters.type || account.type === filters.type;
    const matchesStatus = !filters.status || account.status === filters.status;
    const matchesBalanceMin = !filters.balance_min || account.current_balance >= parseFloat(filters.balance_min);
    const matchesBalanceMax = !filters.balance_max || account.current_balance <= parseFloat(filters.balance_max);
    const matchesBank = !filters.bank_name || account.bank_name?.toLowerCase().includes(filters.bank_name.toLowerCase());
    return matchesSearch && matchesType && matchesStatus && matchesBalanceMin && matchesBalanceMax && matchesBank;
  });

  const filterConfig = [
    {
      key: 'type',
      label: 'Loại tài khoản',
      type: 'select',
      options: [
        { value: 'cash', label: 'Tiền mặt' },
        { value: 'bank', label: 'Tài khoản ngân hàng' }
      ]
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'active', label: 'Hoạt động' },
        { value: 'inactive', label: 'Ngừng hoạt động' }
      ]
    },
    {
      key: 'bank_name',
      label: 'Ngân hàng',
      type: 'text',
      placeholder: 'Tìm theo tên ngân hàng'
    },
    {
      key: 'balance',
      label: 'Số dư',
      type: 'range'
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Total Balance Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">Tổng số dư</p>
              <p className="text-4xl font-bold">
                {new Intl.NumberFormat('vi-VN').format(totalBalance)} đ
              </p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg">
              <Wallet className="h-12 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Panel */}
      <div className="flex items-center justify-between gap-4">
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm tài khoản, ngân hàng, số TK..."
        />
        <Button onClick={() => navigate('/accounts/new')} className="flex items-center gap-2">
          <Plus size={16} />
          Thêm
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
                      Tài khoản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Số tài khoản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Ngân hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Chủ tài khoản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Số dư đầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Số dư cuối
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
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        Chưa có tài khoản
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr
                        key={account.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/accounts/${account.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {account.type === 'cash' ? (
                              <Wallet className="h-5 w-5 text-green-600 mr-2" />
                            ) : (
                              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                            )}
                            <div className="text-sm font-medium text-gray-900">{account.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              account.type === 'cash'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {account.type === 'cash' ? 'Tiền mặt' : 'Ngân hàng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{account.account_number || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{account.bank_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{account.account_holder || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Intl.NumberFormat('vi-VN').format(account.opening_balance || 0)} đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${
                            account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {new Intl.NumberFormat('vi-VN').format(account.current_balance || 0)} đ
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              account.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {account.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/accounts/${account.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(account.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có tài khoản
            </CardContent>
          </Card>
        ) : (
          filteredAccounts.map((account) => (
            <Card
              key={account.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      account.type === 'cash' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {account.type === 'cash' ? (
                        <Wallet className="h-6 w-6 text-green-600" />
                      ) : (
                        <Building2 className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <span
                        className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          account.type === 'cash'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {account.type === 'cash' ? 'Tiền mặt' : 'Ngân hàng'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      account.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {account.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {account.account_number && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Số tài khoản:</span>
                      <span>{account.account_number}</span>
                    </p>
                  )}
                  {account.bank_name && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Ngân hàng:</span>
                      <span>{account.bank_name}</span>
                    </p>
                  )}
                  {account.account_holder && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Chủ tài khoản:</span>
                      <span>{account.account_holder}</span>
                    </p>
                  )}
                  <p className="flex items-center justify-between">
                    <span className="font-medium">Số dư đầu:</span>
                    <span>{new Intl.NumberFormat('vi-VN').format(account.opening_balance || 0)} đ</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">Số dư cuối:</span>
                    <span className={`font-bold ${
                      account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {new Intl.NumberFormat('vi-VN').format(account.current_balance || 0)} đ
                    </span>
                  </p>
                </div>
                <div
                  className="flex gap-2 pt-4 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/accounts/${account.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountsList;

