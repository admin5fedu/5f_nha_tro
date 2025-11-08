import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppSettings } from '../../context/SettingsContext';

const SettingsDetail = () => {
  const navigate = useNavigate();
  const { settings, loading, refresh } = useAppSettings();

  useEffect(() => {
    if (!settings) {
      refresh();
    }
  }, [settings, refresh]);

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!settings) {
    return <div className="text-center py-8">Không tìm thấy thiết lập</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Thiết lập</h1>
              <p className="text-gray-600 mt-1">Thông tin ứng dụng và công ty</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/settings/edit')}>
              <Edit size={16} className="mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Thông tin ứng dụng</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tên ứng dụng</p>
                <p className="text-gray-800 mt-1 font-semibold text-lg">{settings.app_name || '-'}</p>
              </div>
              {settings.app_logo && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Logo</p>
                  <img
                    src={settings.app_logo}
                    alt="Logo"
                    className="max-w-xs max-h-32 border border-gray-300 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin công ty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.company_name && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tên công ty</p>
                  <p className="text-gray-800 mt-1 font-semibold">{settings.company_name}</p>
                </div>
              )}
              {settings.company_address && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                  <p className="text-gray-800 mt-1">{settings.company_address}</p>
                </div>
              )}
              {settings.company_phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Điện thoại</p>
                  <p className="text-gray-800 mt-1">{settings.company_phone}</p>
                </div>
              )}
              {settings.company_email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-800 mt-1">{settings.company_email}</p>
                </div>
              )}
              {settings.company_website && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Website</p>
                  <p className="text-gray-800 mt-1">{settings.company_website}</p>
                </div>
              )}
              {settings.company_tax_code && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mã số thuế</p>
                  <p className="text-gray-800 mt-1">{settings.company_tax_code}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Representative Information */}
        {(settings.company_representative || settings.company_representative_position) && (
          <Card>
            <CardHeader>
              <CardTitle>Người đại diện</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.company_representative && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                    <p className="text-gray-800 mt-1 font-semibold">{settings.company_representative}</p>
                  </div>
                )}
                {settings.company_representative_position && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chức vụ</p>
                    <p className="text-gray-800 mt-1">{settings.company_representative_position}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank Information */}
        {(settings.company_bank_account || settings.company_bank_name) && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản ngân hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.company_bank_account && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Số tài khoản</p>
                    <p className="text-gray-800 mt-1 font-semibold">{settings.company_bank_account}</p>
                  </div>
                )}
                {settings.company_bank_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tên ngân hàng</p>
                    <p className="text-gray-800 mt-1">{settings.company_bank_name}</p>
                  </div>
                )}
                {settings.company_bank_branch && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chi nhánh</p>
                    <p className="text-gray-800 mt-1">{settings.company_bank_branch}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {settings.notes && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ghi chú</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 whitespace-pre-wrap">{settings.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsDetail;

