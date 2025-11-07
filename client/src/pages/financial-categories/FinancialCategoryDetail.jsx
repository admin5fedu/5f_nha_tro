import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const FinancialCategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    try {
      const response = await api.get(`/financial-categories/${id}`);
      setCategory(response.data);
    } catch (error) {
      console.error('Error loading category:', error);
      alert('Lỗi khi tải thông tin danh mục');
      navigate('/financial-categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return;
    }

    try {
      await api.delete(`/financial-categories/${id}`);
      navigate('/financial-categories');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa danh mục');
    }
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getTypeLabel = (type) => {
    return type === 'income' ? 'Thu' : 'Chi';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Đang tải...</div>;
  }

  if (!category) {
    return <div className="text-center py-8 text-gray-500">Không tìm thấy danh mục</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/financial-categories')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{category.name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết danh mục tài chính</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/financial-categories/${id}/edit`)}>
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
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Thông tin chi tiết về danh mục</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tên danh mục</label>
              <p className="mt-1 text-gray-900 font-medium">{category.name}</p>
            </div>
            {category.code && (
              <div>
                <label className="text-sm font-medium text-gray-500">Mã danh mục</label>
                <p className="mt-1 text-gray-900">{category.code}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Loại</label>
              <p className="mt-1">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(category.type)}`}>
                  {getTypeLabel(category.type)}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Trạng thái</label>
              <p className="mt-1">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </p>
            </div>
            {category.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{category.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khác</CardTitle>
            <CardDescription>Thông tin bổ sung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
              <p className="mt-1 text-gray-900">
                {new Date(category.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialCategoryDetail;

