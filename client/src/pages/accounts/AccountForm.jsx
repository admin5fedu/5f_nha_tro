import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { vietnameseBanks, getBankCode, generateVietQRCode } from '../../data/vietnameseBanks';

const AccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    account_number: '',
    bank_name: '',
    bank_branch: '',
    account_holder: '',
    qr_code: '',
    opening_balance: '',
    current_balance: '',
    status: 'active',
    description: ''
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadAccount();
    }
  }, [id]);

  const loadAccount = async () => {
    try {
      const response = await api.get(`/accounts/${id}`);
      setFormData({
        ...response.data,
        opening_balance: response.data.opening_balance || '',
        current_balance: response.data.current_balance || ''
      });
    } catch (error) {
      console.error('Error loading account:', error);
      alert('Lỗi khi tải thông tin tài khoản');
      navigate('/accounts');
    }
  };

  // Format number with thousand separators
  const formatNumber = (value) => {
    if (!value) return '';
    // Remove all non-numeric characters
    const numericValue = value.toString().replace(/\D/g, '');
    // Format with thousand separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted number to numeric value
  const parseNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };

  // Generate QR code URL from account information using VietQR API
  const generateQRCode = () => {
    if (formData.type === 'bank') {
      // For bank account, use VietQR API
      if (formData.bank_name && formData.account_number && formData.account_holder) {
        const bankCode = getBankCode(formData.bank_name);
        if (bankCode) {
          // Use VietQR API to generate QR code
          const qrUrl = generateVietQRCode(bankCode, formData.account_number, formData.account_holder);
          return qrUrl;
        } else {
          // Fallback to generic QR code if bank code not found
          const qrText = `${formData.bank_name}|${formData.account_number}|${formData.account_holder}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
          return qrUrl;
        }
      }
    } else {
      // For cash, create simple text QR
      if (formData.name) {
        const qrText = `TIEN_MAT|${formData.name}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
        return qrUrl;
      }
    }
    return '';
  };

  // Auto-generate QR code when information is complete (only if QR code is empty)
  useEffect(() => {
    if (!formData.qr_code) {
      if (formData.type === 'bank') {
        if (formData.bank_name && formData.account_number && formData.account_holder) {
          const qrUrl = generateQRCode();
          if (qrUrl) {
            setFormData(prev => ({ ...prev, qr_code: qrUrl }));
          }
        }
      } else {
        if (formData.name) {
          const qrUrl = generateQRCode();
          if (qrUrl) {
            setFormData(prev => ({ ...prev, qr_code: qrUrl }));
          }
        }
      }
    }
  }, [formData.type, formData.bank_name, formData.account_number, formData.account_holder, formData.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Auto-generate QR code if not provided
      let qrCode = formData.qr_code;
      if (!qrCode) {
        qrCode = generateQRCode();
      }

      const data = {
        ...formData,
        opening_balance: parseFloat(parseNumber(formData.opening_balance)) || 0,
        current_balance: parseFloat(parseNumber(formData.current_balance)) || (parseFloat(parseNumber(formData.opening_balance)) || 0),
        qr_code: qrCode
      };
      if (id && id !== 'new') {
        await api.put(`/accounts/${id}`, data);
        navigate(`/accounts/${id}`);
      } else {
        const response = await api.post('/accounts', data);
        navigate(`/accounts/${response.data.id}`);
      }
    } catch (error) {
      alert('Lỗi khi lưu tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa tài khoản' : 'Thêm tài khoản'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin tài khoản' : 'Thêm tài khoản mới vào hệ thống'}
          </p>
        </div>
      </div>

      <form id="account-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Điền thông tin tài khoản bên dưới</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label required>Tên tài khoản</Label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Tài khoản Vietcombank, Tiền mặt chi nhánh 1..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label required>Loại tài khoản</Label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({
                      ...formData,
                      type: newType,
                      // Clear bank-specific fields if switching to cash
                      ...(newType === 'cash' ? {
                        account_number: '',
                        bank_name: '',
                        bank_branch: '',
                        account_holder: ''
                      } : {})
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Tài khoản ngân hàng</option>
                </select>
              </div>
              <div>
                <Label>Mô tả</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
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

        {/* Bank Account Information - Only show if type is bank */}
        {formData.type === 'bank' && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản ngân hàng</CardTitle>
              <CardDescription>Thông tin chi tiết tài khoản ngân hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Số tài khoản</Label>
                  <input
                    type="text"
                    required
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="Nhập số tài khoản"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label required>Tên ngân hàng</Label>
                  <select
                    required
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Chọn ngân hàng</option>
                    {vietnameseBanks.map((bank) => (
                      <option key={bank.code} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Chi nhánh ngân hàng</Label>
                  <input
                    type="text"
                    value={formData.bank_branch}
                    onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <Label required>Chủ tài khoản</Label>
                  <input
                    type="text"
                    required
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    placeholder="Nhập tên chủ tài khoản"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>QR Code</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.qr_code}
                      onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                      placeholder="Tự động tạo khi nhập đủ thông tin"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const qrUrl = generateQRCode();
                        if (qrUrl) {
                          setFormData(prev => ({ ...prev, qr_code: qrUrl }));
                        } else {
                          alert('Vui lòng nhập đủ thông tin để tạo QR Code');
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <QrCode size={16} />
                      Tạo QR
                    </Button>
                  </div>
                  {formData.qr_code && formData.qr_code.startsWith('http') && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">QR Code đã tạo:</p>
                      <img
                        src={formData.qr_code}
                        alt="QR Code"
                        className="max-w-xs border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code for cash accounts */}
        {formData.type === 'cash' && (
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Mã QR Code cho thanh toán (tự động tạo khi nhập đủ thông tin)</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label>QR Code</Label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.qr_code}
                    onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                    placeholder="Tự động tạo khi nhập đủ thông tin"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const qrUrl = generateQRCode();
                      if (qrUrl) {
                        setFormData(prev => ({ ...prev, qr_code: qrUrl }));
                      } else {
                        alert('Vui lòng nhập đủ thông tin để tạo QR Code');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <QrCode size={16} />
                    Tạo QR
                  </Button>
                </div>
                {formData.qr_code && formData.qr_code.startsWith('http') && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-2">QR Code đã tạo:</p>
                    <img
                      src={formData.qr_code}
                      alt="QR Code"
                      className="max-w-xs border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin số dư</CardTitle>
            <CardDescription>Số dư đầu kỳ và số dư hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Số dư đầu kỳ (đ)</Label>
                <input
                  type="text"
                  value={formatNumber(formData.opening_balance)}
                  onChange={(e) => {
                    const numericValue = parseNumber(e.target.value);
                    setFormData({
                      ...formData,
                      opening_balance: numericValue,
                      // Auto-set current_balance if not manually set
                      current_balance: formData.current_balance || numericValue
                    });
                  }}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Số dư cuối (đ)</Label>
                <input
                  type="text"
                  value={formatNumber(formData.current_balance)}
                  onChange={(e) => {
                    const numericValue = parseNumber(e.target.value);
                    setFormData({ ...formData, current_balance: numericValue });
                  }}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-sm text-gray-500 mt-1">Số dư hiện tại của tài khoản</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </form>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/accounts')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="account-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountForm;

