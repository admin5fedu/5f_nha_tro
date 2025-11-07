import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_by: user?.id || '',
    assigned_to: '',
    branch_id: '',
    room_id: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    // Set assigned_by tự động từ user hiện tại khi tạo mới
    if (user && (!id || id === 'new')) {
      setFormData(prev => ({
        ...prev,
        assigned_by: user.id
      }));
    }
    loadBranches();
    loadUsers();
    if (id && id !== 'new') {
      loadTask();
    }
  }, [id, user]);

  useEffect(() => {
    if (formData.branch_id) {
      loadRoomsByBranch(formData.branch_id);
    } else {
      setRooms([]);
      setFormData(prev => ({ ...prev, room_id: '' }));
    }
  }, [formData.branch_id]);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches?status=active');
      setBranches(response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadRoomsByBranch = async (branchId) => {
    try {
      const response = await api.get(`/rooms?branch_id=${branchId}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      const task = response.data;
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigned_by: task.assigned_by || user?.id || '',
        assigned_to: task.assigned_to || '',
        branch_id: task.branch_id || '',
        room_id: task.room_id || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date?.split('T')[0] || '',
        notes: task.notes || ''
      });
      
      if (task.branch_id) {
        await loadRoomsByBranch(task.branch_id);
      }
    } catch (error) {
      console.error('Error loading task:', error);
      alert(error.response?.data?.error || 'Lỗi khi tải thông tin công việc');
      navigate('/tasks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        assigned_by: parseInt(formData.assigned_by),
        assigned_to: parseInt(formData.assigned_to),
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
        room_id: formData.room_id ? parseInt(formData.room_id) : null,
        due_date: formData.due_date || null
      };

      if (id && id !== 'new') {
        await api.put(`/tasks/${id}`, data);
        navigate(`/tasks/${id}`);
      } else {
        const response = await api.post('/tasks', data);
        navigate(`/tasks/${response.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu công việc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {id && id !== 'new' ? 'Sửa công việc' : 'Thêm công việc'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id && id !== 'new' ? 'Cập nhật thông tin công việc' : 'Tạo công việc mới'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin công việc</CardTitle>
          <CardDescription>Điền thông tin công việc bên dưới</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>Tiêu đề công việc</Label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề công việc"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                placeholder="Nhập mô tả chi tiết công việc..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Người giao việc</Label>
                <input
                  type="text"
                  value={users.find(u => u.id === parseInt(formData.assigned_by))?.full_name || user?.full_name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <input
                  type="hidden"
                  value={formData.assigned_by}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tự động lấy từ người đang thao tác
                </p>
              </div>
              <div>
                <Label required>Người nhận việc</Label>
                <select
                  required
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Chọn người nhận việc</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Chi nhánh</Label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value, room_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Chọn chi nhánh (tùy chọn)</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu công việc không gắn với chi nhánh cụ thể
                </p>
              </div>
              <div>
                <Label>Phòng</Label>
                <select
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  disabled={!formData.branch_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn phòng (tùy chọn)</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Phòng {room.room_number}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Chọn chi nhánh trước để chọn phòng
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Trạng thái</Label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="in_progress">Đang làm</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
              <div>
                <Label>Hạn hoàn thành</Label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <Label required>Độ ưu tiên</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={formData.priority === 'low' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, priority: 'low' })}
                  className={formData.priority === 'low' ? 'bg-gray-600 text-white hover:bg-gray-700' : ''}
                >
                  Thấp
                </Button>
                <Button
                  type="button"
                  variant={formData.priority === 'medium' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, priority: 'medium' })}
                  className={formData.priority === 'medium' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                >
                  Trung bình
                </Button>
                <Button
                  type="button"
                  variant={formData.priority === 'high' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, priority: 'high' })}
                  className={formData.priority === 'high' ? 'bg-orange-600 text-white hover:bg-orange-700' : ''}
                >
                  Cao
                </Button>
                <Button
                  type="button"
                  variant={formData.priority === 'urgent' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                  className={formData.priority === 'urgent' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                >
                  Khẩn cấp
                </Button>
              </div>
            </div>

            <div>
              <Label>Ghi chú</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                placeholder="Nhập ghi chú (nếu có)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-6 px-6 mt-6">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tasks')}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button type="submit" form="task-form" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;

