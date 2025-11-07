import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2, CheckCircle2, Clock, AlertCircle, XCircle, Flag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import FilterPanel from '../../components/FilterPanel';
import { useAuth } from '../../context/AuthContext';
import { objectContainsTerm } from '../../utils/search';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      alert('Lỗi khi tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      loadTasks();
    } catch (error) {
      alert('Lỗi khi xóa công việc');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chờ xử lý', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { label: 'Đang làm', class: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      cancelled: { label: 'Đã hủy', class: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { label: 'Thấp', class: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Trung bình', class: 'bg-blue-100 text-blue-800' },
      high: { label: 'Cao', class: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Khẩn cấp', class: 'bg-red-100 text-red-800' }
    };
    return badges[priority] || badges.medium;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = !filters.search || objectContainsTerm(task, filters.search);
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesAssignedTo = !filters.assigned_to || task.assigned_to === parseInt(filters.assigned_to);
    const matchesBranch = !filters.branch_id || task.branch_id === parseInt(filters.branch_id);
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo && matchesBranch;
  });

  const filterConfig = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'in_progress', label: 'Đang làm' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' }
      ]
    },
    {
      key: 'priority',
      label: 'Độ ưu tiên',
      type: 'select',
      options: [
        { value: 'low', label: 'Thấp' },
        { value: 'medium', label: 'Trung bình' },
        { value: 'high', label: 'Cao' },
        { value: 'urgent', label: 'Khẩn cấp' }
      ]
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
          initialFilters={filters}
          searchPlaceholder="Tìm tiêu đề, mô tả, người phụ trách..."
        />
        <Button onClick={() => navigate('/tasks/new')} className="flex items-center gap-2">
          <Plus size={16} />
          Thêm công việc
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người giao
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người nhận
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vị trí
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Độ ưu tiên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiến độ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hạn hoàn thành
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        Chưa có công việc
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const statusBadge = getStatusBadge(task.status);
                      const priorityBadge = getPriorityBadge(task.priority);
                      const StatusIcon = statusBadge.icon;
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                      
                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={(e) => {
                            if (e.target.closest('button') || e.target.closest('td[onclick]')) {
                              return;
                            }
                            navigate(`/tasks/${task.id}`);
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 truncate max-w-md">
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{task.assigned_by_name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{task.assigned_to_name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {task.room_number ? `Phòng ${task.room_number}` : task.branch_name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusBadge.class}`}>
                              <StatusIcon size={12} />
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled
                                className={`px-2 py-1 text-xs rounded ${
                                  task.priority === 'low'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                }`}
                              >
                                Thấp
                              </button>
                              <button
                                type="button"
                                disabled
                                className={`px-2 py-1 text-xs rounded ${
                                  task.priority === 'medium'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                }`}
                              >
                                TB
                              </button>
                              <button
                                type="button"
                                disabled
                                className={`px-2 py-1 text-xs rounded ${
                                  task.priority === 'high'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                }`}
                              >
                                Cao
                              </button>
                              <button
                                type="button"
                                disabled
                                className={`px-2 py-1 text-xs rounded ${
                                  task.priority === 'urgent'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                }`}
                              >
                                KC
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${task.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{task.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                              {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '-'}
                              {isOverdue && <span className="ml-1">⚠️</span>}
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 bg-white sticky right-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/tasks/${task.id}`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/tasks/${task.id}/edit`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(task.id);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Chưa có công việc
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const statusBadge = getStatusBadge(task.status);
            const priorityBadge = getPriorityBadge(task.priority);
            const StatusIcon = statusBadge.icon;
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
            
            return (
              <Card
                key={task.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={(e) => {
                  if (e.target.closest('button') || e.target.closest('[onclick]')) {
                    return;
                  }
                  navigate(`/tasks/${task.id}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${statusBadge.class}`}>
                      <StatusIcon size={12} />
                      {statusBadge.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Người giao:</span>
                      <span className="font-medium">{task.assigned_by_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Người nhận:</span>
                      <span className="font-medium">{task.assigned_to_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vị trí:</span>
                      <span className="font-medium">
                        {task.room_number ? `Phòng ${task.room_number}` : task.branch_name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Độ ưu tiên:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled
                          className={`px-2 py-1 text-xs rounded ${
                            task.priority === 'low'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}
                        >
                          Thấp
                        </button>
                        <button
                          type="button"
                          disabled
                          className={`px-2 py-1 text-xs rounded ${
                            task.priority === 'medium'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}
                        >
                          TB
                        </button>
                        <button
                          type="button"
                          disabled
                          className={`px-2 py-1 text-xs rounded ${
                            task.priority === 'high'
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}
                        >
                          Cao
                        </button>
                        <button
                          type="button"
                          disabled
                          className={`px-2 py-1 text-xs rounded ${
                            task.priority === 'urgent'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}
                        >
                          KC
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiến độ:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-gray-600">{task.progress || 0}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hạn hoàn thành:</span>
                      <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '-'}
                        {isOverdue && <span className="ml-1">⚠️</span>}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex gap-2 pt-4 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <Edit size={16} className="mr-2" />
                      Xem
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/tasks/${task.id}/edit`)}
                    >
                      <Edit size={16} className="mr-2" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TasksList;

