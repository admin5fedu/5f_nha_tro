import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const FinancialCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'income',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    try {
      const response = await api.get(`/financial-categories/${id}`);
      setFormData({
        name: response.data.name || '',
        code: response.data.code || '',
        type: response.data.type || 'income',
        description: response.data.description || '',
        status: response.data.status || 'active'
      });
    } catch (error) {
      console.error('Error loading category:', error);
      alert('Lỗi khi tải thông tin danh mục');
      navigate('/financial-categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id && id !== 'new') {
        await api.put(`/financial-categories/${id}`, formData);
        navigate(`/financial-categories/${id}`);
      } else {
        const response = await api.post('/financial-categories', formData);
        navigate(`/financial-categories/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu danh mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/financial-categories')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa danh mục tài chính' : 'Thêm danh mục tài chính'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin danh mục' : 'Tạo danh mục mới'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin danh mục</CardTitle>
          <CardDescription>Điền thông tin danh mục tài chính bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Tên danh mục</Label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Tiền thuê phòng"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <Label>Mã danh mục</Label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ví dụ: THU001, CHI001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Mã duy nhất để phân biệt danh mục</p>
              </div>
              <div>
                <Label required>Loại</Label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="income">Thu</option>
                  <option value="expense">Chi</option>
                </select>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                placeholder="Mô tả chi tiết về danh mục này..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/financial-categories')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="category-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinancialCategoryForm;

