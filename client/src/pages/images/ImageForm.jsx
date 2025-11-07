import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

const ImageForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    location_type: searchParams.get('location_type') || 'room',
    room_id: searchParams.get('room_id') || '',
    branch_id: searchParams.get('branch_id') || ''
  });

  useEffect(() => {
    loadData();
    if (id && id !== 'new') {
      loadImage();
    }
  }, [id]);

  useEffect(() => {
    if (formData.location_type === 'room') {
      loadRooms();
    }
  }, [formData.location_type]);

  const loadData = async () => {
    try {
      const [branchesRes, roomsRes] = await Promise.all([
        api.get('/branches'),
        api.get('/rooms')
      ]);
      setBranches(branchesRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadImage = async () => {
    try {
      const response = await api.get(`/images/${id}`);
      setFormData({
        ...response.data,
        room_id: response.data.room_id || '',
        branch_id: response.data.branch_id || ''
      });
      setPreview(response.data.image_url);
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Lỗi khi tải thông tin hình ảnh');
      navigate('/images');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData({ ...formData, image_url: base64String });
      setPreview(base64String);
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Lỗi khi đọc file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.image_url) {
      alert('Vui lòng chọn hình ảnh');
      return;
    }

    if (!formData.name) {
      alert('Vui lòng nhập tên hình ảnh');
      return;
    }

    // Validate location
    if (formData.location_type === 'room' && !formData.room_id) {
      alert('Vui lòng chọn phòng');
      return;
    }
    if (formData.location_type === 'branch' && !formData.branch_id) {
      alert('Vui lòng chọn chi nhánh');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        image_url: formData.image_url,
        location_type: formData.location_type,
        room_id: formData.location_type === 'room' ? (formData.room_id ? parseInt(formData.room_id) : null) : null,
        branch_id: formData.location_type === 'branch' ? (formData.branch_id ? parseInt(formData.branch_id) : null) : null
      };
      if (id && id !== 'new') {
        await api.put(`/images/${id}`, data);
        navigate(`/images/${id}`);
      } else {
        const response = await api.post('/images', data);
        navigate(`/images/${response.data.id}`);
      }
    } catch (error) {
      console.error('Error saving image:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Lỗi khi lưu hình ảnh';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/images')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa hình ảnh' : 'Thêm hình ảnh'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin hình ảnh' : 'Tải hình ảnh mới lên hệ thống'}
          </p>
        </div>
      </div>

      <form id="image-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hình ảnh</CardTitle>
            <CardDescription>Chọn và tải hình ảnh lên (tối đa 5MB)</CardDescription>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="space-y-4">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X size={16} />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  Chọn ảnh khác
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nhấp để chọn ảnh hoặc kéo thả ảnh vào đây</p>
                <p className="text-sm text-gray-400">PNG, JPG, GIF tối đa 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-2">Đang tải ảnh...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin</CardTitle>
            <CardDescription>Điền thông tin về hình ảnh</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label required>Tên hình ảnh</Label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
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
            </div>
          </CardContent>
        </Card>

        {/* Vị trí */}
        <Card>
          <CardHeader>
            <CardTitle>Vị trí</CardTitle>
            <CardDescription>Chọn vị trí gắn hình ảnh (phòng hoặc chi nhánh)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label required>Loại vị trí</Label>
                <select
                  required
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value, room_id: '', branch_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="room">Phòng</option>
                  <option value="branch">Chi nhánh</option>
                </select>
              </div>
              {formData.location_type === 'room' && (
                <div>
                  <Label required>Phòng</Label>
                  <select
                    required
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Chọn phòng</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Phòng {room.room_number} - {room.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {formData.location_type === 'branch' && (
                <div>
                  <Label required>Chi nhánh</Label>
                  <select
                    required
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Chọn chi nhánh</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/images')}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" form="image-form" disabled={loading || uploading} className="flex-1">
              {loading ? 'Đang lưu...' : uploading ? 'Đang tải ảnh...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ImageForm;

