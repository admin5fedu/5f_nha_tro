import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCog, 
  Building2, 
  DoorOpen, 
  Users, 
  FileText, 
  CreditCard,
  Settings,
  BarChart3,
  Home as HomeIcon,
  Package,
  Image as ImageIcon,
  Zap,
  Car,
  Receipt,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const Home = () => {
  const moduleGroups = [
    {
      title: 'Quản lý hệ thống',
      description: 'Cấu hình và quản lý hệ thống',
      modules: [
        {
          title: 'Tổng quan',
          description: 'Dashboard thống kê tổng quan',
          icon: LayoutDashboard,
          path: '/dashboard',
          color: 'bg-blue-500'
        },
        {
          title: 'Nhân viên',
          description: 'Quản lý tài khoản và phân quyền',
          icon: UserCog,
          path: '/users',
          color: 'bg-purple-500'
        }
      ]
    },
    {
      title: 'Quản lý chi nhánh',
      description: 'Quản lý chi nhánh và phòng trọ',
      modules: [
        {
          title: 'Chi nhánh',
          description: 'Quản lý các chi nhánh nhà trọ',
          icon: Building2,
          path: '/branches',
          color: 'bg-green-500'
        },
        {
          title: 'Phòng trọ',
          description: 'Quản lý phòng trọ và thông tin phòng',
          icon: DoorOpen,
          path: '/rooms',
          color: 'bg-orange-500'
        },
        {
          title: 'Tài sản',
          description: 'Quản lý tài sản gắn với phòng hoặc chi nhánh',
          icon: Package,
          path: '/assets',
          color: 'bg-purple-500'
        },
        {
          title: 'Hình ảnh',
          description: 'Quản lý hình ảnh của phòng và chi nhánh',
          icon: ImageIcon,
          path: '/images',
          color: 'bg-pink-500'
        }
      ]
    },
    {
      title: 'Quản lý khách thuê',
      description: 'Quản lý khách thuê và hợp đồng',
      modules: [
        {
          title: 'Khách thuê',
          description: 'Quản lý thông tin khách thuê',
          icon: Users,
          path: '/tenants',
          color: 'bg-indigo-500'
        },
        {
          title: 'Phương tiện',
          description: 'Quản lý phương tiện của khách thuê',
          icon: Car,
          path: '/vehicles',
          color: 'bg-cyan-500'
        },
        {
          title: 'Hợp đồng',
          description: 'Quản lý hợp đồng thuê phòng',
          icon: FileText,
          path: '/contracts',
          color: 'bg-pink-500'
        },
        {
          title: 'Hóa đơn',
          description: 'Tạo và quản lý hóa đơn hàng tháng',
          icon: Receipt,
          path: '/invoices',
          color: 'bg-red-500'
        },
        {
          title: 'Dịch vụ',
          description: 'Quản lý các dịch vụ (điện, nước, internet...)',
          icon: Zap,
          path: '/services',
          color: 'bg-yellow-500'
        }
      ]
    },
    {
      title: 'Quản lý tài chính',
      description: 'Quản lý các khoản thu chi',
      modules: [
        {
          title: 'Sổ thu chi',
          description: 'Ghi chép các khoản thu và chi',
          icon: DollarSign,
          path: '/transactions',
          color: 'bg-emerald-500'
        },
        {
          title: 'Danh mục tài chính',
          description: 'Khai báo các khoản thu chi trong công ty',
          icon: DollarSign,
          path: '/financial-categories',
          color: 'bg-teal-500'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <HomeIcon className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Trang chủ</h1>
          <p className="text-gray-600 mt-1">Chọn module để bắt đầu làm việc</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {moduleGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{group.title}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.modules.map((module, moduleIndex) => {
                  const Icon = module.icon;
                  return (
                    <Link key={moduleIndex} to={module.path}>
                      <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors cursor-pointer group">
                        <div className={`${module.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {module.description}
                          </p>
                        </div>
                        <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                          →
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tổng chi nhánh</p>
                <p className="text-3xl font-bold mt-2">10</p>
              </div>
              <Building2 className="h-12 w-12 text-blue-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tổng phòng</p>
                <p className="text-3xl font-bold mt-2">200</p>
              </div>
              <DoorOpen className="h-12 w-12 text-green-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Khách thuê</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <Users className="h-12 w-12 text-purple-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Hợp đồng</p>
                <p className="text-3xl font-bold mt-2">0</p>
              </div>
              <FileText className="h-12 w-12 text-orange-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;

