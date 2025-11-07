import { Bell, Menu, ChevronRight, Home, Loader2, AlertTriangle, CalendarClock, DollarSign, FileText, Users2, ClipboardList, Wrench, UserPlus, CheckCircle2, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useNotifications } from '../context/NotificationContext';

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Breadcrumb mapping
  const breadcrumbMap = {
    '/dashboard': 'Tổng quan',
    '/users': 'Nhân viên',
    '/users/new': 'Thêm nhân viên',
    '/branches': 'Chi nhánh',
    '/branches/new': 'Thêm chi nhánh',
    '/rooms': 'Phòng trọ',
    '/rooms/new': 'Thêm phòng',
    '/tenants': 'Khách thuê',
    '/tenants/new': 'Thêm khách thuê',
    '/contracts': 'Hợp đồng',
    '/contracts/new': 'Thêm hợp đồng',
    '/invoices': 'Hóa đơn',
    '/invoices/new': 'Thêm hóa đơn',
    '/transactions': 'Sổ thu chi',
    '/transactions/new': 'Thêm phiếu thu chi',
    '/accounts': 'Tài khoản',
    '/accounts/new': 'Thêm tài khoản',
    '/assets': 'Tài sản',
    '/assets/new': 'Thêm tài sản',
    '/images': 'Hình ảnh',
    '/images/new': 'Thêm hình ảnh',
    '/services': 'Dịch vụ',
    '/services/new': 'Thêm dịch vụ',
    '/vehicles': 'Phương tiện',
    '/vehicles/new': 'Thêm phương tiện',
    '/financial-categories': 'Danh mục tài chính',
    '/financial-categories/new': 'Thêm danh mục tài chính',
    '/settings': 'Thông tin công ty',
    '/roles': 'Vai trò',
    '/roles/new': 'Thêm vai trò',
    '/permissions': 'Phân quyền',
    '/tasks': 'Công việc',
    '/reports': 'Báo cáo',
    '/reports/profit-loss': 'Báo cáo Lãi/Lỗ',
    '/reports/accounts-receivable': 'Báo cáo Công nợ',
    '/reports/revenue': 'Phân tích doanh thu',
    '/reports/cashflow': 'Thu/Chi chi tiết',
  };

  const typeIconMap = {
    'contract.created': FileText,
    'contract.expiring': CalendarClock,
    'contract.ended': CheckCircle2,
    'tenant.created': Users2,
    'invoice.created': FileText,
    'invoice.due_soon': CalendarClock,
    'invoice.overdue': AlertTriangle,
    'transaction.created': DollarSign,
    'transaction.updated': DollarSign,
    'account.low_balance': AlertTriangle,
    'task.assigned': ClipboardList,
    'task.status_changed': ClipboardList,
    'asset.status_changed': Wrench,
    'meter_reading.missing': AlertTriangle,
    'meter_reading.anomaly': AlertTriangle,
    'user.created': UserPlus,
    'user.status_changed': UserPlus
  };

  const resolveNotificationLink = (notification) => {
    if (!notification) return null;
    switch (notification.link_type) {
      case 'contract':
        return notification.link_id ? `/contracts/${notification.link_id}` : '/contracts';
      case 'tenant':
        return notification.link_id ? `/tenants/${notification.link_id}` : '/tenants';
      case 'invoice':
        return notification.link_id ? `/invoices/${notification.link_id}` : '/invoices';
      case 'transaction':
        return notification.link_id ? `/transactions/${notification.link_id}` : '/transactions';
      case 'account':
        return notification.link_id ? `/accounts/${notification.link_id}` : '/accounts';
      case 'task':
        return notification.link_id ? `/tasks/${notification.link_id}` : '/tasks';
      case 'asset':
        return notification.link_id ? `/assets/${notification.link_id}` : '/assets';
      case 'meter-reading':
        return notification.link_id ? `/meter-readings/${notification.link_id}` : '/meter-readings';
      case 'user':
        return notification.link_id ? `/users/${notification.link_id}` : '/users';
      default:
        return null;
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const NotificationMenu = () => {
    const navigate = useNavigate();
    const {
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead
    } = useNotifications();
    const [open, setOpen] = useState(false);

    useEffect(() => {
      if (!open) return undefined;

      const handleOutsideClick = (event) => {
        if (!event.target.closest('.notification-dropdown')) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }, [open]);

    const handleToggle = () => {
      if (!open) {
        fetchNotifications();
      }
      setOpen((prev) => !prev);
    };

    const handleItemClick = async (notification) => {
      if (!notification) return;
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
      const link = resolveNotificationLink(notification);
      setOpen(false);
      if (link) {
        navigate(link);
      }
    };

    const IconFor = (type) => typeIconMap[type] || Bell;

    return (
      <div className="relative notification-dropdown">
        <Button variant="ghost" size="icon" className="relative" onClick={handleToggle}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[5px] text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        {open && (
          <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">Thông báo</p>
                <p className="text-xs text-gray-500">{unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700"
                disabled={unreadCount === 0 || loading}
                onClick={markAllAsRead}
              >
                Đánh dấu đã đọc
              </Button>
            </div>
            <div className="max-h-[22rem] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <Building2 className="h-6 w-6 text-gray-300" />
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = IconFor(notification.type);
                  const relativeTime = formatRelativeTime(notification.created_at);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleItemClick(notification)}
                      className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${
                        notification.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                        notification.is_read ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${notification.is_read ? 'text-gray-700' : 'text-blue-900'}`}>
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="mt-1 text-xs text-gray-600 line-clamp-2">{notification.body}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span>{relativeTime}</span>
                          {!notification.is_read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Generate breadcrumb from pathname
  const generateBreadcrumb = () => {
    const pathname = location.pathname;
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Tổng quan', path: '/dashboard' }];

    if (paths.length === 0) {
      return breadcrumbs;
    }

    let currentPath = '';
    let shouldStop = false;
    
    for (let index = 0; index < paths.length && !shouldStop; index++) {
      const path = paths[index];
      currentPath += `/${path}`;
      
      // Check if it's an ID (numeric)
      if (/^\d+$/.test(path)) {
        // This is a detail page
        const parentPath = paths.slice(0, index).join('/');
        const parentLabel = breadcrumbMap[`/${parentPath}`] || parentPath;
        breadcrumbs.push({ 
          label: parentLabel, 
          path: `/${parentPath}` 
        });
        // For detail pages, we'll show "Chi tiết" - can be enhanced later with actual names
        breadcrumbs.push({ 
          label: 'Chi tiết', 
          path: currentPath 
        });
        shouldStop = true; // Stop processing after ID
      } else if (path === 'new') {
        const parentPath = paths.slice(0, index).join('/');
        const parentLabel = breadcrumbMap[`/${parentPath}`] || parentPath;
        breadcrumbs.push({ 
          label: parentLabel, 
          path: `/${parentPath}` 
        });
        breadcrumbs.push({ 
          label: breadcrumbMap[currentPath] || 'Thêm mới',
          path: currentPath 
        });
        shouldStop = true; // Stop processing after new
      } else if (path === 'edit') {
        // For edit pages, we need to get the parent path (which should be an ID)
        if (index > 0 && /^\d+$/.test(paths[index - 1])) {
          const grandParentPath = paths.slice(0, index - 1).join('/');
          const grandParentLabel = breadcrumbMap[`/${grandParentPath}`] || grandParentPath;
          breadcrumbs.push({ 
            label: grandParentLabel, 
            path: `/${grandParentPath}` 
          });
          breadcrumbs.push({ 
            label: 'Chi tiết', 
            path: `/${paths.slice(0, index).join('/')}` 
          });
        }
        breadcrumbs.push({ 
          label: 'Sửa', 
          path: currentPath 
        });
        shouldStop = true; // Stop processing after edit
      } else {
        const label = breadcrumbMap[currentPath] || path.charAt(0).toUpperCase() + path.slice(1);
        breadcrumbs.push({ 
          label, 
          path: currentPath 
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumb();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 flex items-center gap-2 px-4 overflow-x-auto">
          <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 font-medium truncate max-w-[200px]">
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(crumb.path)}
                    className="text-gray-600 hover:text-gray-900 hover:underline truncate max-w-[200px]"
                  >
                    {index === 0 ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      crumb.label
                    )}
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          <NotificationMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;

