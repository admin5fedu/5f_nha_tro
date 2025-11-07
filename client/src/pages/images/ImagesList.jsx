import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const ImagesList = () => {
  const [images, setImages] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [imagesRes, branchesRes, roomsRes] = await Promise.all([
        api.get('/images'),
        api.get('/branches'),
        api.get('/rooms')
      ]);
      setImages(imagesRes.data);
      setBranches(branchesRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa hình ảnh này?')) return;
    try {
      await api.delete(`/images/${id}`);
      loadData();
    } catch (error) {
      alert('Lỗi khi xóa hình ảnh');
    }
  };

  const filteredImages = images.filter((image) => {
    const matchesSearch = !filters.search || objectContainsTerm(image, filters.search);
    const matchesLocationType = !filters.location_type || image.location_type === filters.location_type;
    const matchesRoom = !filters.room_id || image.room_id === parseInt(filters.room_id);
    const matchesBranch = !filters.branch_id || image.branch_id === parseInt(filters.branch_id);
    return matchesSearch && matchesLocationType && matchesRoom && matchesBranch;
  });

  const filterConfig = [
    {
      key: 'location_type',
      label: 'Vị trí',
      type: 'select',
      options: [
        { value: 'room', label: 'Phòng' },
        { value: 'branch', label: 'Chi nhánh' }
      ]
    },
    {
      key: 'branch_id',
      label: 'Chi nhánh',
      type: 'select',
      options: branches && branches.length > 0 ? branches.map(b => ({ value: b.id, label: b.name })) : []
    },
    {
      key: 'room_id',
      label: 'Phòng',
      type: 'select',
      options: rooms && rooms.length > 0 ? rooms.map(r => ({ value: r.id, label: `Phòng ${r.room_number} - ${r.branch_name}` })) : []
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex items-center justify-between gap-4">
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm hình ảnh, mô tả, vị trí..."
        />
        <Button onClick={() => navigate('/images/new')} className="flex items-center gap-2">
          <Plus size={16} />
          Thêm
        </Button>
      </div>

      {/* Desktop: Grid View */}
      <div className="hidden lg:block">
        {filteredImages.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có hình ảnh
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <Card
                key={image.id}
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/images/${image.id}`)}
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EẢnh%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {image.location_type === 'room' ? 'Phòng' : 'Chi nhánh'}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{image.name}</h3>
                  {image.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{image.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-400">
                    {image.location_type === 'room' && image.room_number
                      ? `Phòng ${image.room_number}`
                      : image.location_type === 'branch' && image.branch_name
                      ? image.branch_name
                      : '-'}
                  </div>
                  <div
                    className="flex gap-2 mt-3 pt-3 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/images/${image.id}/edit`)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredImages.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có hình ảnh
            </CardContent>
          </Card>
        ) : (
          filteredImages.map((image) => (
            <Card
              key={image.id}
              className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => navigate(`/images/${image.id}`)}
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EẢnh%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {image.location_type === 'room' ? 'Phòng' : 'Chi nhánh'}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{image.name}</CardTitle>
                {image.description && (
                  <p className="text-sm text-gray-600 mt-1">{image.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {image.location_type === 'room' && image.room_number
                    ? `Phòng ${image.room_number}`
                    : image.location_type === 'branch' && image.branch_name
                    ? image.branch_name
                    : '-'}
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="flex gap-2 pt-4 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/images/${image.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ImagesList;

