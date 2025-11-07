import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Building2, 
  DoorOpen, 
  Users, 
  FileText, 
  DollarSign,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState({ contracts: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent')
      ]);
      setStats(statsRes.data);
      setRecent(recentRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Tổng chi nhánh',
      value: stats?.totalBranches || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      label: 'Tổng phòng',
      value: stats?.totalRooms || 0,
      icon: DoorOpen,
      color: 'bg-green-500',
    },
    {
      label: 'Phòng trống',
      value: stats?.availableRooms || 0,
      icon: DoorOpen,
      color: 'bg-yellow-500',
    },
    {
      label: 'Phòng đã thuê',
      value: stats?.occupiedRooms || 0,
      icon: DoorOpen,
      color: 'bg-purple-500',
    },
    {
      label: 'Khách thuê',
      value: stats?.totalTenants || 0,
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      label: 'Hợp đồng',
      value: stats?.activeContracts || 0,
      icon: FileText,
      color: 'bg-pink-500',
    },
    {
      label: 'Doanh thu tháng',
      value: new Intl.NumberFormat('vi-VN').format(stats?.monthlyRevenue || 0) + ' đ',
      icon: DollarSign,
      color: 'bg-green-600',
    },
    {
      label: 'Tổng doanh thu',
      value: new Intl.NumberFormat('vi-VN').format(stats?.totalRevenue || 0) + ' đ',
      icon: TrendingUp,
      color: 'bg-teal-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Thống kê tổng quan hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contracts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hợp đồng gần đây</h2>
          <div className="space-y-3">
            {recent.contracts.length === 0 ? (
              <p className="text-gray-500">Chưa có hợp đồng</p>
            ) : (
              recent.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 rounded"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{contract.tenant_name}</p>
                      <p className="text-sm text-gray-600">
                        Phòng {contract.room_number} - {contract.branch_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        contract.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contract.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Thanh toán gần đây</h2>
          <div className="space-y-3">
            {recent.payments.length === 0 ? (
              <p className="text-gray-500">Chưa có thanh toán</p>
            ) : (
              recent.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border-l-4 border-green-500 pl-4 py-2 hover:bg-gray-50 rounded"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{payment.tenant_name}</p>
                      <p className="text-sm text-gray-600">
                        Phòng {payment.room_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(payment.payment_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {new Intl.NumberFormat('vi-VN').format(payment.amount)} đ
                      </p>
                      <span
                        className={`px-2 py-1 text-xs rounded mt-1 block ${
                          payment.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payment.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

