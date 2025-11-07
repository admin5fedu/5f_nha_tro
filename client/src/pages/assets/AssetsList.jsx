import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, Package, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const AssetsList = () => {
  const [assets, setAssets] = useState([]);
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
      const [assetsRes, branchesRes, roomsRes] = await Promise.all([
        api.get('/assets'),
        api.get('/branches'),
        api.get('/rooms')
      ]);
      setAssets(assetsRes.data);
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
    if (!confirm('Bạn có chắc muốn xóa tài sản này?')) return;
    try {
      await api.delete(`/assets/${id}`);
      loadData();
    } catch (error) {
      alert('Lỗi khi xóa tài sản');
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = !filters.search || objectContainsTerm(asset, filters.search);
    const matchesType = !filters.type || asset.type === filters.type;
    const matchesStatus = !filters.status || asset.status === filters.status;
    const matchesLocationType = !filters.location_type || asset.location_type === filters.location_type;
    const matchesRoom = !filters.room_id || asset.room_id === parseInt(filters.room_id);
    const matchesBranch = !filters.branch_id || asset.branch_id === parseInt(filters.branch_id);
    const matchesValueMin = !filters.value_min || asset.value >= parseFloat(filters.value_min);
    const matchesValueMax = !filters.value_max || asset.value <= parseFloat(filters.value_max);
    return matchesSearch && matchesType && matchesStatus && matchesLocationType && matchesRoom && matchesBranch && matchesValueMin && matchesValueMax;
  });

  const filterConfig = [
    {
      key: 'type',
      label: 'Loại tài sản',
      type: 'select',
      options: [
        { value: 'furniture', label: 'Nội thất' },
        { value: 'equipment', label: 'Thiết bị' },
        { value: 'appliance', label: 'Đồ gia dụng' },
        { value: 'other', label: 'Khác' }
      ]
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'good', label: 'Tốt' },
        { value: 'damaged', label: 'Hỏng' },
        { value: 'maintenance', label: 'Bảo trì' }
      ]
    },
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
    },
    {
      key: 'value',
      label: 'Giá trị (đ)',
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
          searchPlaceholder="Tìm tên, serial, mô tả tài sản..."
        />
        <Button onClick={() => navigate('/assets/new')} className="flex items-center gap-2">
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
                      Tên tài sản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Vị trí
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Giá trị
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
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Chưa có tài sản
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/assets/${asset.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-purple-600 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                              {asset.serial_number && (
                                <div className="text-xs text-gray-500">S/N: {asset.serial_number}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {asset.type === 'furniture' ? 'Nội thất' :
                             asset.type === 'equipment' ? 'Thiết bị' :
                             asset.type === 'appliance' ? 'Đồ gia dụng' : 'Khác'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {asset.location_type === 'room' && asset.room_number
                              ? `Phòng ${asset.room_number}`
                              : asset.location_type === 'branch' && asset.branch_name
                              ? asset.branch_name
                              : asset.location_type === 'room' && asset.room_branch_name
                              ? `Phòng - ${asset.room_branch_name}`
                              : '-'}
                          </div>
                          {asset.location_type === 'room' && asset.room_branch_name && (
                            <div className="text-xs text-gray-500">{asset.room_branch_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat('vi-VN').format(asset.value || 0)} đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              asset.status === 'good'
                                ? 'bg-green-100 text-green-800'
                                : asset.status === 'damaged'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {asset.status === 'good' ? 'Tốt' :
                             asset.status === 'damaged' ? 'Hỏng' : 'Bảo trì'}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                          >
                            <MapPin size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/assets/${asset.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(asset.id);
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
        {filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có tài sản
            </CardContent>
          </Card>
        ) : (
          filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${
                asset.status === 'good'
                  ? 'border-green-500'
                  : asset.status === 'damaged'
                  ? 'border-red-500'
                  : 'border-yellow-500'
              }`}
              onClick={() => navigate(`/assets/${asset.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      asset.status === 'good'
                        ? 'bg-green-100'
                        : asset.status === 'damaged'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}>
                      <Package
                        className={`h-6 w-6 ${
                          asset.status === 'good'
                            ? 'text-green-600'
                            : asset.status === 'damaged'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {asset.type === 'furniture' ? 'Nội thất' :
                         asset.type === 'equipment' ? 'Thiết bị' :
                         asset.type === 'appliance' ? 'Đồ gia dụng' : 'Khác'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      asset.status === 'good'
                        ? 'bg-green-100 text-green-800'
                        : asset.status === 'damaged'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {asset.status === 'good' ? 'Tốt' :
                     asset.status === 'damaged' ? 'Hỏng' : 'Bảo trì'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center justify-between">
                    <span className="font-medium">Vị trí:</span>
                    <span>
                      {asset.location_type === 'room' && asset.room_number
                        ? `Phòng ${asset.room_number}`
                        : asset.location_type === 'branch' && asset.branch_name
                        ? asset.branch_name
                        : '-'}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium">Giá trị:</span>
                    <span className="font-bold text-purple-600">
                      {new Intl.NumberFormat('vi-VN').format(asset.value || 0)} đ
                    </span>
                  </p>
                  {asset.serial_number && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Số serial:</span>
                      <span>{asset.serial_number}</span>
                    </p>
                  )}
                  {asset.purchase_date && (
                    <p className="flex items-center justify-between">
                      <span className="font-medium">Ngày mua:</span>
                      <span>{new Date(asset.purchase_date).toLocaleDateString('vi-VN')}</span>
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
                    onClick={() => navigate(`/assets/${asset.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(asset.id)}
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

export default AssetsList;

