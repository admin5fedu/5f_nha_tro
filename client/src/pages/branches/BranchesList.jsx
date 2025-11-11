import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Building2, MapPin, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { objectContainsTerm } from '../../utils/search';
import { fetchBranches, deleteBranch } from '../../services/supabaseBranches';
import { usePermissions } from '../../context/PermissionContext';

const BranchesList = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 25;
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canView = hasPermission('branches', 'view');
  const canCreate = hasPermission('branches', 'create');
  const canUpdate = hasPermission('branches', 'update');
  const canDelete = hasPermission('branches', 'delete');

  useEffect(() => {
    if (canView) {
      loadBranches();
    } else {
      setLoading(false);
    }
  }, [canView]);

  const loadBranches = async (pageToLoad = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const { data, hasMore: moreAvailable } = await fetchBranches({ limit: pageSize, offset: pageToLoad * pageSize });
      setBranches((prev) => (append ? [...prev, ...data] : data));
      setHasMore(moreAvailable);
      setPage(pageToLoad);
    } catch (error) {
      console.error('Error loading branches:', error);
      alert('Lỗi khi tải danh sách chi nhánh');
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      alert('Bạn không có quyền xóa chi nhánh');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa chi nhánh này?')) return;
    try {
      await deleteBranch(id);
      loadBranches(page, false);
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa chi nhánh');
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    loadBranches(page + 1, true);
  };

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch = !filters.search || objectContainsTerm(branch, filters.search);
    const matchesStatus = !filters.status || branch.status === filters.status;
    const matchesManager = !filters.manager_name || 
      branch.manager_name?.toLowerCase().includes(filters.manager_name.toLowerCase());
    return matchesSearch && matchesStatus && matchesManager;
  });

  const filterConfig = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'active', label: 'Hoạt động' },
        { value: 'inactive', label: 'Ngừng hoạt động' }
      ]
    },
    {
      key: 'manager_name',
      label: 'Quản lý',
      type: 'text',
      placeholder: 'Tìm theo tên quản lý'
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-600">
          Bạn không có quyền xem danh sách chi nhánh.
        </CardContent>
      </Card>
    );
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
          searchPlaceholder="Tìm chi nhánh, địa chỉ, quản lý..."
        />
        {canCreate && (
          <Button onClick={() => navigate('/branches/new')} className="flex items-center gap-2">
            <Plus size={16} />
            Thêm
          </Button>
        )}
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
                      Tên chi nhánh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Địa chỉ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      SĐT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Quản lý
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
                  {filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Chưa có chi nhánh
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((branch) => (
                      <tr 
                        key={branch.id} 
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/branches/${branch.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                            <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{branch.address || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{branch.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{branch.manager_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              branch.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {branch.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/branches/${branch.id}/edit`)}
                            >
                              <Edit size={16} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(branch.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
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

      {hasMore && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Đang tải thêm...' : 'Tải thêm chi nhánh'}
          </Button>
        </div>
      )}

      {/* Mobile: Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredBranches.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có chi nhánh
            </CardContent>
          </Card>
        ) : (
          filteredBranches.map((branch) => (
            <Card 
              key={branch.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/branches/${branch.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{branch.name}</CardTitle>
                      <span
                        className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          branch.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {branch.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {branch.address && (
                    <p className="flex items-start gap-2">
                      <span className="font-medium min-w-[80px]">Địa chỉ:</span>
                      <span>{branch.address}</span>
                    </p>
                  )}
                  {branch.phone && (
                    <p className="flex items-start gap-2">
                      <span className="font-medium min-w-[80px]">SĐT:</span>
                      <span>{branch.phone}</span>
                    </p>
                  )}
                  {branch.manager_name && (
                    <p className="flex items-start gap-2">
                      <span className="font-medium min-w-[80px]">Quản lý:</span>
                      <span>{branch.manager_name}</span>
                    </p>
                  )}
                </div>
                <div 
                  className="flex gap-2 pt-4 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canUpdate && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/branches/${branch.id}/edit`)}
                    >
                      <Edit size={16} className="mr-2" />
                      Sửa
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDelete(branch.id)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Xóa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BranchesList;

