import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, DoorOpen, MapPin, Users, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const RoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsRes, branchesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/branches')
      ]);
      setRooms(roomsRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      loadData();
    } catch (error) {
      alert('Lỗi khi xóa phòng');
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = !filters.search || objectContainsTerm(room, filters.search);
    const matchesBranch = !filters.branch_id || room.branch_id === parseInt(filters.branch_id);
    const matchesStatus = !filters.status || room.status === filters.status;
    const matchesFloor = !filters.floor || room.floor === parseInt(filters.floor);
    const matchesPriceMin = !filters.price_min || room.price >= parseFloat(filters.price_min);
    const matchesPriceMax = !filters.price_max || room.price <= parseFloat(filters.price_max);
    return matchesSearch && matchesBranch && matchesStatus && matchesFloor && matchesPriceMin && matchesPriceMax;
  });

  const filterConfig = [
    {
      key: 'branch_id',
      label: 'Chi nhánh',
      type: 'select',
      options: branches && branches.length > 0 ? branches.map(b => ({ value: b.id, label: b.name })) : []
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'available', label: 'Trống' },
        { value: 'occupied', label: 'Đã thuê' },
        { value: 'maintenance', label: 'Bảo trì' }
      ]
    },
    {
      key: 'floor',
      label: 'Tầng',
      type: 'select',
      options: rooms && rooms.length > 0 ? [...new Set(rooms.map(r => r.floor).filter(Boolean))].sort().map(f => ({ value: f, label: `Tầng ${f}` })) : []
    },
    {
      key: 'price',
      label: 'Giá thuê',
      type: 'range'
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
          searchPlaceholder="Tìm phòng, chi nhánh, mô tả..."
        />
        <Button onClick={() => navigate('/rooms/new')} className="flex items-center gap-2">
          <Plus size={16} />
          Thêm
        </Button>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Số phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Chi nhánh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Giá thuê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Diện tích
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Tầng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky right-0">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        Chưa có phòng
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room) => (
                      <tr
                        key={room.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DoorOpen className={`h-5 w-5 mr-2 ${
                              room.status === 'available'
                                ? 'text-green-600'
                                : room.status === 'occupied'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`} />
                            <div className="text-sm font-medium text-gray-900">Phòng {room.room_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{room.branch_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {new Intl.NumberFormat('vi-VN').format(room.price)} đ/tháng
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{room.area ? `${room.area} m²` : '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{room.floor || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              room.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : room.status === 'occupied'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {room.status === 'available'
                              ? 'Trống'
                              : room.status === 'occupied'
                              ? 'Đã thuê'
                              : 'Bảo trì'}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/rooms/${room.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(room.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredRooms.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có phòng
            </CardContent>
          </Card>
        ) : (
          filteredRooms.map((room) => (
            <Card
              key={room.id}
              className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${
                room.status === 'available'
                  ? 'border-green-500'
                  : room.status === 'occupied'
                  ? 'border-red-500'
                  : 'border-yellow-500'
              }`}
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        room.status === 'available'
                          ? 'bg-green-100'
                          : room.status === 'occupied'
                          ? 'bg-red-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      <DoorOpen
                        className={`h-6 w-6 ${
                          room.status === 'available'
                            ? 'text-green-600'
                            : room.status === 'occupied'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Phòng {room.room_number}</CardTitle>
                      <p className="text-sm text-gray-600">{room.branch_name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      room.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : room.status === 'occupied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {room.status === 'available'
                      ? 'Trống'
                      : room.status === 'occupied'
                      ? 'Đã thuê'
                      : 'Bảo trì'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center justify-between">
                    <span className="font-medium">Giá thuê:</span>
                    <span className="font-bold text-blue-600">
                      {new Intl.NumberFormat('vi-VN').format(room.price)} đ/tháng
                    </span>
                  </p>
                  {room.area && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Diện tích:</span>
                      <span>{room.area} m²</span>
                    </p>
                  )}
                  {room.floor && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Tầng:</span>
                      <span>{room.floor}</span>
                    </p>
                  )}
                  {room.deposit > 0 && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Tiền cọc:</span>
                      <span>{new Intl.NumberFormat('vi-VN').format(room.deposit)} đ</span>
                    </p>
                  )}
                </div>
                <div
                  className="flex gap-2 pt-4 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/rooms/${room.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(room.id)}
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

export default RoomsList;

