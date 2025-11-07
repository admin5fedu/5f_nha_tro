import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Wallet, Building2, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, [id]);

  const loadAccount = async () => {
    try {
      const response = await api.get(`/accounts/${id}`);
      const accountData = response.data;
      // Use calculated_balance if available (from transactions), otherwise use current_balance
      setAccount({
        ...accountData,
        display_balance: accountData.calculated_balance !== undefined 
          ? accountData.calculated_balance 
          : accountData.current_balance
      });
    } catch (error) {
      console.error('Error loading account:', error);
      alert('Lỗi khi tải thông tin tài khoản');
      navigate('/accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      navigate('/accounts');
    } catch (error) {
      alert('Lỗi khi xóa tài khoản');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!account) {
    return <div className="text-center py-8">Không tìm thấy tài khoản</div>;
  }

  const displayBalance = account.display_balance !== undefined 
    ? account.display_balance 
    : (account.current_balance || 0);
  const balanceChange = displayBalance - (account.opening_balance || 0);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{account.name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết tài khoản</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/accounts/${id}/edit`)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
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
              <CardTitle>Thông tin cơ bản</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tên tài khoản</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{account.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Loại tài khoản</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    account.type === 'cash'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {account.type === 'cash' ? 'Tiền mặt' : 'Ngân hàng'}
                </span>
              </div>
              {account.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mô tả</p>
                  <p className="text-gray-800 mt-1">{account.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    account.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {account.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {account.type === 'bank' && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin ngân hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {account.account_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Số tài khoản</p>
                    <p className="text-gray-800 mt-1 font-semibold text-lg">{account.account_number}</p>
                  </div>
                )}
                {account.bank_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tên ngân hàng</p>
                    <p className="text-gray-800 mt-1">{account.bank_name}</p>
                  </div>
                )}
                {account.bank_branch && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chi nhánh ngân hàng</p>
                    <p className="text-gray-800 mt-1">{account.bank_branch}</p>
                  </div>
                )}
                {account.account_holder && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chủ tài khoản</p>
                    <p className="text-gray-800 mt-1 font-semibold">{account.account_holder}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Thông tin số dư</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Số dư đầu kỳ</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {new Intl.NumberFormat('vi-VN').format(account.opening_balance || 0)} đ
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Số dư cuối (hiện tại)</p>
                <p className={`text-3xl font-bold mt-1 ${
                  displayBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('vi-VN').format(displayBalance)} đ
                </p>
                {account.calculated_balance !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    (Tính từ sổ thu chi)
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Chênh lệch</p>
                <p className={`text-lg font-semibold mt-1 ${
                  balanceChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {balanceChange >= 0 ? '+' : ''}
                  {new Intl.NumberFormat('vi-VN').format(balanceChange)} đ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(account.qr_code) && (
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                {account.qr_code.startsWith('http') ? (
                  <img
                    src={account.qr_code}
                    alt="QR Code"
                    className="max-w-xs border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 font-mono text-sm break-all">{account.qr_code}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccountDetail;

