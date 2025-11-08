import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/SettingsContext';
import Header from './Header';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  UserCog,
  Building2,
  Building,
  DoorOpen,
  Users,
  UserCircle,
  FileText,
  Wallet,
  Image as ImageIcon,
  Zap,
  Car,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  CheckSquare,
  Gauge,
  LogOut,
  ClipboardList,
  SlidersHorizontal,
  ShieldCheck,
  KeyRound,
  MapPin,
  Boxes,
  PiggyBank,
  Layers,
  Receipt,
  BarChart3,
  FileWarning,
  LineChart,
  ScrollText
} from 'lucide-react';
import { useState, useEffect } from 'react';

const shadowMobileNav = 'shadow-[0_-6px_24px_rgba(15,23,42,0.08)]';
const safePaddingBottom = 'pb-[env(safe-area-inset-bottom,0)]';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const { settings } = useAppSettings();
  const appName = settings?.app_name?.trim() || 'Nhà Trọ';
  const appLogo = settings?.app_logo || null;
  const appInitial = appName.charAt(0).toUpperCase();

  // Auto-expand submenu if current path is in it
  useEffect(() => {
    const newOpenSubmenus = {};
    menuItems.forEach((item) => {
      if (item.submenu) {
        const hasActiveChild = item.submenu.some(subItem => 
          location.pathname === subItem.path || 
          location.pathname.startsWith(subItem.path + '/')
        );
        if (hasActiveChild) {
          newOpenSubmenus[item.label] = true;
        }
      }
    });
    setOpenSubmenus(newOpenSubmenus);
  }, [location.pathname]);

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Tổng quan',
      single: true
    },
    {
      label: 'Chi nhánh & Phòng',
      icon: Building2,
      submenu: [
        { path: '/branches', icon: MapPin, label: 'Chi nhánh' },
        { path: '/rooms', icon: DoorOpen, label: 'Phòng trọ' },
        { path: '/assets', icon: Boxes, label: 'Tài sản' },
        { path: '/images', icon: ImageIcon, label: 'Hình ảnh' },
        { path: '/services', icon: Zap, label: 'Dịch vụ' },
        { path: '/meter-readings', icon: Gauge, label: 'Sổ ghi dịch vụ' },
      ]
    },
    {
      label: 'Khách thuê',
      icon: Users,
      submenu: [
        { path: '/tenants', icon: UserCircle, label: 'Khách thuê' },
        { path: '/vehicles', icon: Car, label: 'Phương tiện' },
      ]
    },
    {
      label: 'Công việc',
      icon: ClipboardList,
      submenu: [
        { path: '/tasks', icon: CheckSquare, label: 'Công việc' },
      ]
    },
    {
      label: 'Tài chính',
      icon: DollarSign,
      submenu: [
        { path: '/contracts', icon: FileText, label: 'Hợp đồng' },
        { path: '/invoices', icon: Receipt, label: 'Hóa đơn' },
        { path: '/accounts', icon: Wallet, label: 'Tài khoản' },
        { path: '/transactions', icon: PiggyBank, label: 'Sổ thu chi' },
        { path: '/financial-categories', icon: Layers, label: 'Danh mục tài chính' },
      ]
    },
    {
      label: 'Báo cáo',
      icon: BarChart3,
      submenu: [
        { path: '/reports/profit-loss', icon: BarChart3, label: 'Lãi/Lỗ' },
        { path: '/reports/accounts-receivable', icon: FileWarning, label: 'Công nợ' },
        { path: '/reports/revenue', icon: LineChart, label: 'Phân tích doanh thu' },
        { path: '/reports/cashflow', icon: ScrollText, label: 'Thu/Chi chi tiết' },
      ]
    },
    {
      label: 'Thiết lập',
      icon: SlidersHorizontal,
      submenu: [
        { path: '/settings', icon: Building, label: 'Thông tin công ty' },
        { path: '/users', icon: UserCog, label: 'Nhân viên' },
        { path: '/roles', icon: ShieldCheck, label: 'Vai trò' },
        { path: '/permissions', icon: KeyRound, label: 'Phân quyền' },
      ]
    }
  ];

  const bottomNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { path: '/tenants', icon: Users, label: 'Khách thuê' },
    { path: '/rooms', icon: DoorOpen, label: 'Phòng' },
    { path: '/tasks', icon: ClipboardList, label: 'Công việc' },
    { path: '/transactions', icon: PiggyBank, label: 'Thu chi' },
  ];

  const isPathActive = (targetPath) => {
    if (targetPath === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(targetPath);
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenus(prev => {
      const isCurrentlyOpen = !!prev[label];
      if (isCurrentlyOpen) {
        return {};
      }
      return { [label]: true };
    });
  };

  const isActive = (path) => location.pathname === path;

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => isActive(item.path));
  };

  const handleProfileClick = () => {
    if (user?.id) {
      navigate(`/users/${user.id}`);
    } else {
      navigate('/users');
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Bạn có chắc chắn muốn đăng xuất?') : true;
    if (confirmed) {
      logout();
      setMobileMenuOpen(false);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-900 to-blue-800 pt-5 pb-4 overflow-y-auto shadow-xl">
          {/* Logo */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 mb-8">
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center flex-1 min-w-0">
                  {appLogo ? (
                    <img
                      src={appLogo}
                      alt={appName}
                      className="h-10 w-10 object-contain bg-white p-1.5 rounded-lg mr-3 shadow-md"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/vite.svg';
                      }}
                    />
                  ) : (
                    <div className="bg-white p-2 rounded-lg mr-3 shadow-md">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <h1 className="text-white text-xl font-bold truncate">{appName}</h1>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="text-blue-200 hover:text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
                  title="Thu gọn sidebar"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center w-full gap-2">
                {appLogo ? (
                  <img
                    src={appLogo}
                    alt={appName}
                    className="h-8 w-8 object-contain bg-white p-1 rounded-lg shadow-md"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/vite.svg';
                    }}
                  />
                ) : (
                  <div className="bg-white p-2 rounded-lg shadow-md">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="text-blue-200 hover:text-white hover:bg-blue-800 p-2 rounded-lg transition-colors w-full flex justify-center"
                  title="Mở rộng sidebar"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item, index) => {
              if (item.single) {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`${
                      active
                        ? 'bg-blue-800 text-white shadow-lg'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      sidebarCollapsed ? 'justify-center' : ''
                    }`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <Icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'} ${active ? 'text-white' : ''}`} />
                    {!sidebarCollapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}
                    {active && !sidebarCollapsed && (
                      <div className="w-1 h-6 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              }

              const Icon = item.icon;
              const isOpen = openSubmenus[item.label];
              const hasActiveChild = isSubmenuActive(item.submenu);

              return (
                <div key={index}>
                  <button
                    onClick={() => !sidebarCollapsed && toggleSubmenu(item.label)}
                    className={`${
                      hasActiveChild
                        ? 'bg-blue-800 text-white shadow-lg'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    } w-full group flex items-center ${
                      sidebarCollapsed ? 'justify-center' : 'justify-between'
                    } px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                    title={sidebarCollapsed ? item.label : ''}
                    disabled={sidebarCollapsed}
                  >
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'} ${hasActiveChild ? 'text-white' : ''}`} />
                      {!sidebarCollapsed && (
                        <span className="flex-1 text-left">{item.label}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      isOpen ? (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                      )
                    )}
                    {hasActiveChild && !sidebarCollapsed && (
                      <div className="w-1 h-6 bg-white rounded-full ml-2"></div>
                    )}
                  </button>
                  {isOpen && !sidebarCollapsed && (
                    <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActive(subItem.path);
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`${
                              subActive
                                ? 'bg-blue-700 text-white shadow-md'
                                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                            } flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 group/item`}
                          >
                            <SubIcon className={`mr-3 h-4 w-4 ${subActive ? 'text-white' : 'text-blue-300'}`} />
                            <span className="flex-1">{subItem.label}</span>
                            {subActive && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

      {/* User info */}
      <div className="px-4 pb-4 border-t border-blue-800 pt-4 space-y-3">
        {!sidebarCollapsed ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start px-3 py-2 bg-blue-800/40 hover:bg-blue-700 text-white rounded-lg"
            onClick={handleProfileClick}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold shadow-md">
                {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || appInitial}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-blue-200 truncate">
                  {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                </p>
              </div>
            </div>
          </Button>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleProfileClick}
              className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold shadow-md hover:bg-blue-600 transition-colors"
              title="Hồ sơ"
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || appInitial}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            sidebarCollapsed
              ? 'justify-center text-blue-200 hover:text-white hover:bg-blue-700'
              : 'justify-start text-blue-100 hover:text-white hover:bg-blue-700'
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!sidebarCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
        </div>
      </aside>

      {/* Mobile menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            {appLogo ? (
              <img
                src={appLogo}
                alt={appName}
                className="h-8 w-8 object-contain bg-white p-1 rounded-lg"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/vite.svg';
                }}
              />
            ) : (
              <div className="bg-white p-1.5 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <h1 className="text-white text-lg font-bold truncate max-w-[160px]">{appName}</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity" 
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 to-blue-800 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full pt-16 pb-4">
              <nav className="flex-1 px-2 space-y-1">
                {menuItems.map((item, index) => {
                  if (item.single) {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={index}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`${
                          active
                            ? 'bg-blue-800 text-white shadow-lg'
                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                        } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.label}
                        {active && (
                          <div className="w-1 h-6 bg-white rounded-full ml-auto"></div>
                        )}
                      </Link>
                    );
                  }

                  const Icon = item.icon;
                  const isOpen = openSubmenus[item.label];
                  const hasActiveChild = isSubmenuActive(item.submenu);

                  return (
                    <div key={index}>
                      <button
                        onClick={() => toggleSubmenu(item.label)}
                        className={`${
                          hasActiveChild
                            ? 'bg-blue-800 text-white shadow-lg'
                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                        } w-full group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                      >
                        <div className="flex items-center">
                          <Icon className="mr-3 h-5 w-5" />
                          {item.label}
                        </div>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                        {hasActiveChild && (
                          <div className="w-1 h-6 bg-white rounded-full ml-2"></div>
                        )}
                      </button>
                      {isOpen && (
                        <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const subActive = isActive(subItem.path);
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`${
                                  subActive
                                    ? 'bg-blue-700 text-white shadow-md'
                                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                                } flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200`}
                              >
                                <SubIcon className="mr-3 h-4 w-4" />
                                <span className="flex-1">{subItem.label}</span>
                                {subActive && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
              <div className="px-4 pb-4 border-t border-blue-800 pt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-800/40 hover:bg-blue-700 text-white transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold shadow-md">
                    {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {user?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-blue-200 truncate">
                      {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content with header */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="p-4 pb-28 lg:pb-8 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 ${shadowMobileNav} ${safePaddingBottom}`}>
        <div className="flex justify-between px-3 pb-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center flex-1 py-3 text-[0.75rem] font-medium transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                <Icon className={`h-[22px] w-[22px] mb-1 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
