import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { fetchBranchById, createBranch, updateBranch } from '../../services/supabaseBranches';
import { fetchActiveAccounts } from '../../services/supabaseAccounts';
import { usePermissions } from '../../context/PermissionContext';

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
    qr_code: '',
    account_number: '',
    account_holder: '',
    bank_name: '',
    bank_branch: '',
    notes: ''
  });
  const { hasPermission } = usePermissions();
  const isEditing = useMemo(() => id && id !== 'new', [id]);
  const canEdit = isEditing ? hasPermission('branches', 'update') : hasPermission('branches', 'create');

  useEffect(() => {
    loadAccounts();
    if (isEditing) {
      loadBranch();
    }
  }, [id, isEditing]);

  const loadAccounts = async () => {
    try {
      const data = await fetchActiveAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadBranch = async () => {
    try {
      const data = await fetchBranchById(id);
      if (!data) {
        alert('Không tìm thấy chi nhánh');
        navigate('/branches');
        return;
      }
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        manager_name: data.manager_name || '',
        status: data.status || 'active',
        representative_name: data.representative_name || '',
        representative_position: data.representative_position || '',
        representative_id_card: data.representative_id_card || '',
        representative_address: data.representative_address || '',
        representative_phone: data.representative_phone || '',
        account_id: data.account_id || '',
        qr_code: data.qr_code || '',
        account_number: data.account_number || '',
        account_holder: data.account_holder || '',
        bank_name: data.bank_name || '',
        bank_branch: data.bank_branch || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Error loading branch:', error);
      alert('Lỗi khi tải thông tin chi nhánh');
      navigate('/branches');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Bạn không có quyền thực hiện thao tác này');
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...formData,
        account_id: formData.account_id ? parseInt(formData.account_id, 10) : null
      };
      if (isEditing) {
        await updateBranch(id, data);
        navigate(`/branches/${id}`);
      } else {
        const created = await createBranch(data);
        navigate(`/branches/${created.id}`);
      }
    } catch (error) {
      alert(error.message || 'Lỗi khi lưu chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-gray-600">
              Bạn chỉ có quyền xem thông tin chi nhánh. Liên hệ quản trị viên để được cấp quyền tạo hoặc cập nhật chi nhánh.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/branches')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Cập nhật thông tin chi nhánh' : 'Thêm chi nhánh mới vào hệ thống'}
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
                  disabled={!canEdit || loading}
                />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!canEdit || loading}
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!canEdit || loading}
                />
              </div>
              <div>
                <Label>Tên quản lý</Label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!canEdit || loading}
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!canEdit || loading}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
              <div>
                <Label>Ghi chú</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!canEdit || loading}
                />
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
                    disabled={!canEdit || loading}
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
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>CMND/CCCD</Label>
                  <input
                    type="text"
                    value={formData.representative_id_card}
                    onChange={(e) => setFormData({ ...formData, representative_id_card: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <input
                    type="text"
                    value={formData.representative_phone}
                    onChange={(e) => setFormData({ ...formData, representative_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Địa chỉ</Label>
                  <input
                    type="text"
                    value={formData.representative_address}
                    onChange={(e) => setFormData({ ...formData, representative_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
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
                  <Label>Tài khoản thanh toán</Label>
                  <select
                    value={formData.account_id || ''}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  >
                    <option value="">Không chọn</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name || account.account_holder || `Tài khoản ${account.account_number}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Số tài khoản</Label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>Chủ tài khoản</Label>
                  <input
                    type="text"
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>Ngân hàng</Label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>Chi nhánh ngân hàng</Label>
                  <input
                    type="text"
                    value={formData.bank_branch}
                    onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
                  />
                </div>
                <div>
                  <Label>QR Code (URL)</Label>
                  <input
                    type="text"
                    value={formData.qr_code}
                    onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={!canEdit || loading}
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
            <Button type="submit" disabled={loading || !canEdit} className="flex-1">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BranchForm;

