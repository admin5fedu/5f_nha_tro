import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ImageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImage();
  }, [id]);

  const loadImage = async () => {
    try {
      const response = await api.get(`/images/${id}`);
      setImage(response.data);
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Lỗi khi tải thông tin hình ảnh');
      navigate('/images');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa hình ảnh này?')) return;
    try {
      await api.delete(`/images/${id}`);
      navigate('/images');
    } catch (error) {
      alert('Lỗi khi xóa hình ảnh');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!image) {
    return <div className="text-center py-8">Không tìm thấy hình ảnh</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/images')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{image.name}</h1>
              <p className="text-gray-600 mt-1">Chi tiết hình ảnh</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/images/${id}/edit`)}>
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
        {/* Hình ảnh */}
        <Card>
          <CardHeader>
            <CardTitle>Hình ảnh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image.image_url}
                alt={image.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EẢnh không tải được%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Thông tin */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tên hình ảnh</label>
              <p className="text-gray-900 font-medium">{image.name}</p>
            </div>
            {image.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                <p className="text-gray-900">{image.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Loại vị trí</label>
              <p className="text-gray-900">
                {image.location_type === 'room' ? 'Phòng' : 'Chi nhánh'}
              </p>
            </div>
            {image.location_type === 'room' && (
              <>
                {image.room_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phòng</label>
                    <p className="text-gray-900">Phòng {image.room_number}</p>
                    {image.room_branch_name && (
                      <p className="text-sm text-gray-500">{image.room_branch_name}</p>
                    )}
                  </div>
                )}
              </>
            )}
            {image.location_type === 'branch' && image.branch_name && (
              <div>
                <label className="text-sm font-medium text-gray-500">Chi nhánh</label>
                <p className="text-gray-900">{image.branch_name}</p>
              </div>
            )}
            {image.created_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                <p className="text-gray-900">
                  {new Date(image.created_at).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageDetail;

