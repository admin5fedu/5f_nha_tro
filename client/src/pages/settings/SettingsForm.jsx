import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useAppSettings } from '../../context/SettingsContext';

const SettingsForm = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, refresh } = useAppSettings();
  const [loading, setLoading] = useState(false);
  const defaults = useMemo(() => ({
    app_name: 'Nhà Trọ',
    app_logo: '',
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    company_tax_code: '',
    company_representative: '',
    company_representative_position: '',
    company_bank_account: '',
    company_bank_name: '',
    company_bank_branch: '',
    notes: ''
  }), []);
  const [formData, setFormData] = useState(() => ({
    ...defaults,
    ...(settings || {})
  }));

  useEffect(() => {
    if (settings) {
      setFormData({
        ...defaults,
        ...settings
      });
    }
  }, [settings, defaults]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, app_logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(formData);
      await refresh();
      alert('Lưu thiết lập thành công');
      navigate('/settings');
    } catch (error) {
      alert(error?.message || 'Lỗi khi lưu thiết lập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Thiết lập</h1>
          <p className="text-gray-600 mt-1">Cấu hình thông tin ứng dụng và công ty</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin ứng dụng</CardTitle>
            <CardDescription>Cấu hình logo và tên ứng dụng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Tên ứng dụng</Label>
                <input
                  type="text"
                  value={formData.app_name}
                  onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhà Trọ"
                />
              </div>
              <div>
                <Label>Logo ứng dụng</Label>
                <div className="mt-2 space-y-3">
                  {formData.app_logo && (
                    <div className="relative inline-block">
                      <img
                        src={formData.app_logo}
                        alt="Logo"
                        className="max-w-xs max-h-32 border border-gray-300 rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      <Upload size={16} />
                      <span>{formData.app_logo ? 'Thay đổi logo' : 'Tải lên logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.app_logo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => setFormData({ ...formData, app_logo: '' })}
                      >
                        Xóa logo
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Hỗ trợ định dạng: JPG, PNG, GIF. Kích thước khuyến nghị: 200x200px
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin công ty</CardTitle>
            <CardDescription>Thông tin công ty sẽ được hiển thị trên header của các biểu mẫu in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Tên công ty</Label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Công ty TNHH Nhà Trọ"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Địa chỉ</Label>
                <input
                  type="text"
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
              </div>
              <div>
                <Label>Điện thoại</Label>
                <input
                  type="text"
                  value={formData.company_phone}
                  onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <Label>Email</Label>
                <input
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="info@example.com"
                />
              </div>
              <div>
                <Label>Website</Label>
                <input
                  type="text"
                  value={formData.company_website}
                  onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label>Mã số thuế</Label>
                <input
                  type="text"
                  value={formData.company_tax_code}
                  onChange={(e) => setFormData({ ...formData, company_tax_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <Label>Người đại diện</Label>
                <input
                  type="text"
                  value={formData.company_representative}
                  onChange={(e) => setFormData({ ...formData, company_representative: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <Label>Chức vụ người đại diện</Label>
                <input
                  type="text"
                  value={formData.company_representative_position}
                  onChange={(e) => setFormData({ ...formData, company_representative_position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Giám đốc"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản ngân hàng</CardTitle>
            <CardDescription>Thông tin tài khoản ngân hàng của công ty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Số tài khoản</Label>
                <input
                  type="text"
                  value={formData.company_bank_account}
                  onChange={(e) => setFormData({ ...formData, company_bank_account: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <Label>Tên ngân hàng</Label>
                <input
                  type="text"
                  value={formData.company_bank_name}
                  onChange={(e) => setFormData({ ...formData, company_bank_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Vietcombank"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Chi nhánh ngân hàng</Label>
                <input
                  type="text"
                  value={formData.company_bank_branch}
                  onChange={(e) => setFormData({ ...formData, company_bank_branch: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Chi nhánh Hà Nội"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
            <CardDescription>Ghi chú bổ sung</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ghi chú bổ sung..."
            />
          </CardContent>
        </Card>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/settings')}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Đang lưu...' : 'Lưu thiết lập'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsForm;

