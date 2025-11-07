import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const BranchForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager_name: '',
    status: 'active',
    // Representative information
    representative_name: '',
    representative_position: '',
    representative_id_card: '',
    representative_address: '',
    representative_phone: '',
    // Bank account information - now using account_id
    account_id: '',
    qr_code: ''
  });

  useEffect(() => {
    loadAccounts();
    if (id && id !== 'new') {
      loadBranch();
    }
  }, [id]);

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts?status=active');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadBranch = async () => {
    try {
      const response = await api.get(`/branches/${id}`);
      setFormData(response.data);
    } catch (error) {
      console.error('Error loading branch:', error);
      alert('Lỗi khi tải thông tin chi nhánh');
      navigate('/branches');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        account_id: formData.account_id ? parseInt(formData.account_id) : null
      };
      if (id && id !== 'new') {
        await api.put(`/branches/${id}`, data);
        navigate(`/branches/${id}`);
      } else {
        const response = await api.post('/branches', data);
        navigate(`/branches/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/branches')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin chi nhánh' : 'Thêm chi nhánh mới vào hệ thống'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chi nhánh</CardTitle>
            <CardDescription>Điền thông tin chi nhánh bên dưới</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label required>Tên chi nhánh</Label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Tên quản lý</Label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Representative Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin người đại diện</CardTitle>
              <CardDescription>Thông tin người đại diện cho chi nhánh (để đưa vào hợp đồng)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tên người đại diện</Label>
                  <input
                    type="text"
                    value={formData.representative_name}
                    onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label>Chức vụ</Label>
                  <input
                    type="text"
                    value={formData.representative_position}
                    onChange={(e) => setFormData({ ...formData, representative_position: e.target.value })}
                    placeholder="VD: Giám đốc, Chủ chi nhánh..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label>CMND/CCCD</Label>
                  <input
                    type="text"
                    value={formData.representative_id_card}
                    onChange={(e) => setFormData({ ...formData, representative_id_card: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <input
                    type="text"
                    value={formData.representative_phone}
                    onChange={(e) => setFormData({ ...formData, representative_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Địa chỉ</Label>
                  <input
                    type="text"
                    value={formData.representative_address}
                    onChange={(e) => setFormData({ ...formData, representative_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản ngân hàng</CardTitle>
              <CardDescription>Chọn tài khoản để khách thuê thanh toán cho chi nhánh</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Tài khoản</Label>
                  <select
                    value={formData.account_id}
                    onChange={(e) => {
                      const selectedAccount = accounts.find(a => a.id === parseInt(e.target.value));
                      setFormData({ 
                        ...formData, 
                        account_id: e.target.value,
                        qr_code: selectedAccount?.qr_code || ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Không chọn</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.account_number || 'N/A'} ({account.bank_name || 'N/A'})
                      </option>
                    ))}
                  </select>
                  {formData.account_id && (() => {
                    const selectedAccount = accounts.find(a => a.id === parseInt(formData.account_id));
                    return selectedAccount ? (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Số tài khoản:</p>
                            <p className="font-semibold text-gray-800">{selectedAccount.account_number || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Chủ tài khoản:</p>
                            <p className="font-semibold text-gray-800">{selectedAccount.account_holder || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tên ngân hàng:</p>
                            <p className="font-semibold text-gray-800">{selectedAccount.bank_name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Chi nhánh:</p>
                            <p className="font-semibold text-gray-800">{selectedAccount.bank_branch || '-'}</p>
                          </div>
                        </div>
                        {selectedAccount.qr_code && (
                          <div className="mt-3">
                            <p className="text-gray-500 text-sm mb-2">QR Code:</p>
                            {selectedAccount.qr_code.startsWith('http') ? (
                              <img
                                src={selectedAccount.qr_code}
                                alt="QR Code"
                                className="max-w-xs border border-gray-300 rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <p className="text-gray-800 font-mono text-sm">{selectedAccount.qr_code}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="md:col-span-2">
                  <Label>QR Code tùy chỉnh (tùy chọn, ghi đè QR Code từ tài khoản)</Label>
                  <input
                    type="text"
                    value={formData.qr_code}
                    onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                    placeholder="URL hình ảnh QR Code hoặc mã QR"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/branches')}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BranchForm;

