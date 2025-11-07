import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2, CheckCircle2, Clock, XCircle, Flag, TrendingUp, MapPin, User, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressForm, setProgressForm] = useState({ status: '', result: '' });

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
      setProgressForm({
        status: response.data.status || '',
        result: response.data.result || ''
      });
    } catch (error) {
      console.error('Error loading task:', error);
      setError(error.response?.data?.error || 'Lỗi khi tải thông tin công việc');
      alert(error.response?.data?.error || 'Lỗi khi tải thông tin công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/tasks');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa công việc');
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressForm.status) {
      alert('Vui lòng chọn trạng thái');
      return;
    }
    try {
      setUpdatingProgress(true);
      // Update task with status and result
      await api.put(`/tasks/${id}`, {
        status: progressForm.status,
        result: progressForm.result || null
      });
      alert('Báo cáo tiến độ thành công!');
      setShowProgressDialog(false);
      loadTask();
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi báo cáo tiến độ');
    } finally {
      setUpdatingProgress(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lỗi</h1>
            <p className="text-gray-600 mt-1">{error || 'Không tìm thấy công việc'}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">{error || 'Không tìm thấy công việc'}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/tasks')}>Quay lại danh sách</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(task.status);
  const priorityBadge = getPriorityBadge(task.priority);
  const StatusIcon = statusBadge.icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const canUpdateProgress = user && (user.id === task.assigned_to || user.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
              <p className="text-gray-600 mt-1">Chi tiết công việc</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canUpdateProgress && (
              <Button
                onClick={() => {
                  setProgressForm({
                    status: task.status || '',
                    result: task.result || ''
                  });
                  setShowProgressDialog(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Báo cáo tiến độ
              </Button>
            )}
            <Button onClick={() => navigate(`/tasks/${id}/edit`)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Task Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Thông tin công việc</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Mô tả</p>
                  <p className="text-gray-800 mt-1 whitespace-pre-wrap">{task.description || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                    <span className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusBadge.class}`}>
                      <StatusIcon size={16} />
                      {statusBadge.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Độ ưu tiên</p>
                    <div className="flex gap-2">
                      <Button
                        variant={task.priority === 'low' ? 'default' : 'outline'}
                        size="sm"
                        disabled
                        className={task.priority === 'low' ? 'bg-gray-600 text-white' : ''}
                      >
                        Thấp
                      </Button>
                      <Button
                        variant={task.priority === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        disabled
                        className={task.priority === 'medium' ? 'bg-blue-600 text-white' : ''}
                      >
                        Trung bình
                      </Button>
                      <Button
                        variant={task.priority === 'high' ? 'default' : 'outline'}
                        size="sm"
                        disabled
                        className={task.priority === 'high' ? 'bg-orange-600 text-white' : ''}
                      >
                        Cao
                      </Button>
                      <Button
                        variant={task.priority === 'urgent' ? 'default' : 'outline'}
                        size="sm"
                        disabled
                        className={task.priority === 'urgent' ? 'bg-red-600 text-white' : ''}
                      >
                        Khẩn cấp
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Người giao việc</p>
                    <p className="text-gray-800 mt-1 flex items-center gap-2">
                      <User size={16} />
                      {task.assigned_by_name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Người nhận việc</p>
                    <p className="text-gray-800 mt-1 flex items-center gap-2">
                      <User size={16} />
                      {task.assigned_to_name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vị trí</p>
                    <p className="text-gray-800 mt-1 flex items-center gap-2">
                      <MapPin size={16} />
                      {task.room_number ? `Phòng ${task.room_number}` : task.branch_name || 'Không xác định'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hạn hoàn thành</p>
                    <p className={`text-gray-800 mt-1 flex items-center gap-2 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                      <Calendar size={16} />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '-'}
                      {isOverdue && <span>⚠️ Quá hạn</span>}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Tiến độ công việc</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tiến độ</span>
                    <span className="text-sm font-semibold text-blue-600">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>

                {task.result && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Kết quả công việc</h3>
                    <p className="text-gray-800 whitespace-pre-wrap">{task.result}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {task.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 whitespace-pre-wrap">{task.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-medium">
                    {task.created_at ? new Date(task.created_at).toLocaleDateString('vi-VN') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cập nhật lần cuối:</span>
                  <span className="font-medium">
                    {task.updated_at ? new Date(task.updated_at).toLocaleDateString('vi-VN') : '-'}
                  </span>
                </div>
                {task.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Còn lại:</span>
                    <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {isOverdue ? 'Quá hạn' : 
                       Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)) + ' ngày'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Report Dialog */}
      {showProgressDialog && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowProgressDialog(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Báo cáo tiến độ</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowProgressDialog(false)}
                  >
                    <XCircle size={20} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={progressForm.status}
                      onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Chọn trạng thái</option>
                      <option value="pending">Chờ xử lý</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú kết quả
                    </label>
                    <textarea
                      value={progressForm.result}
                      onChange={(e) => setProgressForm({ ...progressForm, result: e.target.value })}
                      rows="4"
                      placeholder="Nhập ghi chú kết quả công việc..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowProgressDialog(false)}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleUpdateProgress}
                      disabled={updatingProgress}
                      className="flex-1"
                    >
                      {updatingProgress ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskDetail;

