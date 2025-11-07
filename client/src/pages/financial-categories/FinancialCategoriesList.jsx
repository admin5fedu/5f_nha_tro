import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';

const FinancialCategoriesList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  });

  useEffect(() => {
    loadCategories();
  }, [filters]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);

      const queryString = params.toString();
      const url = queryString ? `/financial-categories?${queryString}` : '/financial-categories';
      const response = await api.get(url);
      const data = response.data || [];
      const normalized = data.filter((category) => {
        const matchesSearch = !filters.search || objectContainsTerm(category, filters.search);
        const matchesType = !filters.type || category.type === filters.type;
        const matchesStatus = !filters.status || category.status === filters.status;
        return matchesSearch && matchesType && matchesStatus;
      });
      setCategories(normalized);
    } catch (error) {
      console.error('Error loading categories:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(error.response?.data?.error || 'Lỗi khi tải danh sách danh mục tài chính');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return;
    }

    try {
      await api.delete(`/financial-categories/${id}`);
      loadCategories();
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

  // Desktop view - Table
  const DesktopView = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên danh mục</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loại</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mô tả</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider sticky right-0 bg-white">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.map((category) => (
            <tr key={category.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/financial-categories/${category.id}`)}>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{category.code || '-'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(category.type)}`}>
                  {getTypeLabel(category.type)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{category.description || '-'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/financial-categories/${category.id}/edit`)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile view - Cards
  const MobileView = () => (
    <div className="md:hidden space-y-4">
      {categories.map((category) => (
        <Card key={category.id} className="cursor-pointer" onClick={() => navigate(`/financial-categories/${category.id}`)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                {category.code && <p className="text-sm text-gray-500 mt-1">Mã: {category.code}</p>}
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(category.type)}`}>
                {getTypeLabel(category.type)}
              </span>
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
              </span>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => navigate(`/financial-categories/${category.id}/edit`)}>
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => navigate('/financial-categories/new')}>
          <Plus size={16} className="mr-2" />
          Thêm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách danh mục tài chính</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <FilterPanel
              filters={[
                {
                  key: 'type',
                  label: 'Loại',
                  type: 'select',
                  options: [
                    { value: 'income', label: 'Thu' },
                    { value: 'expense', label: 'Chi' }
                  ]
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  type: 'select',
                  options: [
                    { value: 'active', label: 'Hoạt động' },
                    { value: 'inactive', label: 'Không hoạt động' }
                  ]
                }
              ]}
              onFilterChange={(updatedFilters) => setFilters((prev) => ({ ...prev, ...updatedFilters }))}
              onReset={() => setFilters({ search: '', type: '', status: '' })}
              initialFilters={filters}
              searchPlaceholder="Tìm mã, tên danh mục..."
            />
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có dữ liệu</div>
          ) : (
            <>
              <DesktopView />
              <MobileView />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCategoriesList;

