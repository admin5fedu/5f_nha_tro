const clone = (value) => structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));

const now = () => new Date().toISOString();

const collections = {
  branches: [
    {
      id: 1,
      name: 'Chi nhánh Trung Tâm',
      address: '123 Lê Lợi, Quận 1, TP.HCM',
      phone: '0901 234 567',
      status: 'active',
      created_at: now()
    },
    {
      id: 2,
      name: 'Chi nhánh Bình Thạnh',
      address: '45 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
      phone: '0908 765 432',
      status: 'active',
      created_at: now()
    }
  ],
  rooms: [
    {
      id: 1,
      branch_id: 1,
      room_number: '101',
      floor: 1,
      price: 1500000,
      deposit: 2000000,
      status: 'occupied',
      description: 'Phòng 20m2, có ban công',
      created_at: now()
    },
    {
      id: 2,
      branch_id: 1,
      room_number: '102',
      floor: 1,
      price: 1300000,
      deposit: 1500000,
      status: 'available',
      description: 'Phòng 18m2, có cửa sổ lớn',
      created_at: now()
    },
    {
      id: 3,
      branch_id: 2,
      room_number: '201',
      floor: 2,
      price: 1200000,
      deposit: 1500000,
      status: 'maintenance',
      description: 'Phòng 16m2 đang bảo trì',
      created_at: now()
    }
  ],
  tenants: [
    {
      id: 1,
      full_name: 'Nguyễn Văn A',
      phone: '0912 345 678',
      email: 'tenant1@example.com',
      address: 'Quận 7, TP.HCM',
      hometown: 'Đồng Nai',
      tenant_type: 'owner',
      status: 'active',
      created_at: now()
    },
    {
      id: 2,
      full_name: 'Trần Thị B',
      phone: '0987 654 321',
      email: 'tenant2@example.com',
      address: 'Thủ Đức, TP.HCM',
      hometown: 'Tiền Giang',
      tenant_type: 'resident',
      owner_tenant_id: 1,
      status: 'active',
      created_at: now()
    }
  ],
  contracts: [
    {
      id: 1,
      branch_id: 1,
      room_id: 1,
      tenant_id: 1,
      start_date: '2024-01-01',
      end_date: null,
      monthly_rent: 1500000,
      deposit: 2000000,
      status: 'active',
      created_at: now()
    }
  ],
  services: [
    {
      id: 1,
      name: 'Điện',
      unit: 'meter',
      unit_name: 'kWh',
      status: 'active',
      created_at: now()
    },
    {
      id: 2,
      name: 'Nước',
      unit: 'meter',
      unit_name: 'm3',
      status: 'active',
      created_at: now()
    }
  ],
  meter_readings: [
    {
      id: 1,
      room_id: 1,
      service_id: 1,
      reading_date: '2025-01-01',
      meter_start: 1234,
      meter_end: 1250,
      meter_usage: 16,
      recorded_by: 1,
      created_at: now(),
      updated_at: now()
    }
  ],
  notifications: [
    {
      id: 1,
      title: 'Nhắc đóng tiền phòng',
      body: 'Hạn đóng tiền phòng tháng này là ngày 05.',
      type: 'payment',
      is_read: false,
      created_at: now()
    },
    {
      id: 2,
      title: 'Đơn sửa chữa mới',
      body: 'Phòng 102 báo hỏng máy lạnh.',
      type: 'maintenance',
      is_read: false,
      created_at: now()
    }
  ],
  tasks: [
    {
      id: 1,
      title: 'Kiểm tra phòng 101',
      description: 'Kiểm tra tình trạng vệ sinh phòng 101',
      assigned_by: 1,
      assigned_to: 1,
      status: 'in_progress',
      priority: 'high',
      due_date: '2025-02-01',
      created_at: now(),
      updated_at: now()
    }
  ],
  accounts: [
    {
      id: 1,
      name: 'Tài khoản ngân hàng ACB',
      type: 'bank',
      account_holder: 'Công ty Nhà Trọ',
      account_number: '123456789',
      current_balance: 50000000,
      status: 'active',
      created_at: now()
    }
  ],
  images: [],
  assets: [],
  roles: [
    { id: 1, code: 'admin', name: 'Quản trị viên' },
    { id: 2, code: 'manager', name: 'Quản lý' },
    { id: 3, code: 'accountant', name: 'Kế toán' },
    { id: 4, code: 'staff', name: 'Nhân viên' },
    { id: 5, code: 'office_staff', name: 'Nhân viên văn phòng' }
  ],
  settings: {
    app_name: 'Quản lý Nhà trọ',
    app_logo: null,
    company_name: 'Công ty Cổ phần Nhà Trọ',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
    phone: '0901 234 567',
    email: 'contact@nhatro.vn',
    updated_at: now()
  }
};

const normalizePath = (path = '') => path.replace(/\?.*$/, '').replace(/\/+$/, '').replace(/^\/+/, '');

const parseSegments = (path) => {
  const normalized = normalizePath(path);
  if (!normalized) {
    return { collection: null, id: null, subPath: null };
  }
  const segments = normalized.split('/');
  const [collection, maybeId, ...rest] = segments;
  const id = maybeId && !Number.isNaN(Number(maybeId)) ? Number(maybeId) : null;
  const subPath = id ? rest.join('/') : [maybeId, ...rest].filter(Boolean).join('/');
  return { collection, id, subPath };
};

const nextId = (collection) => {
  const items = collections[collection];
  if (!items?.length) return 1;
  return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
};

const response = (data) => Promise.resolve({ data: clone(data) });

const getDashboardStats = () => {
  const rooms = collections.rooms || [];
  const occupiedRooms = rooms.filter((room) => room.status === 'occupied').length;
  const availableRooms = rooms.filter((room) => room.status === 'available').length;
  const tenants = collections.tenants || [];
  const revenue = (collections.contracts || []).reduce((total, contract) => total + (contract.monthly_rent || 0), 0);
  return {
    total_rooms: rooms.length,
    occupied_rooms: occupiedRooms,
    available_rooms: availableRooms,
    active_tenants: tenants.length,
    monthly_revenue: revenue,
    unpaid_invoices: 2,
    maintenance_requests: 1
  };
};

const getDashboardRecent = () => ({
  recentContracts: collections.contracts.slice(-5),
  recentPayments: [
    {
      id: 1,
      tenant_name: 'Nguyễn Văn A',
      amount: 1500000,
      payment_date: '2025-01-05',
      method: 'transfer',
      created_at: now()
    }
  ],
  maintenanceTickets: [
    {
      id: 1,
      room_number: '102',
      issue: 'Máy lạnh hỏng',
      status: 'pending',
      created_at: now()
    }
  ]
});

const getNotificationsUnreadCount = () => ({
  unread: (collections.notifications || []).filter((item) => !item.is_read).length
});

const getReports = (type) => {
  switch (type) {
    case 'profit-loss':
      return {
        total_income: 5000000,
        total_expense: 1500000,
        net_profit: 3500000,
        breakdown: [
          { category: 'Tiền phòng', amount: 4500000 },
          { category: 'Tiền dịch vụ', amount: 500000 }
        ]
      };
    case 'accounts-receivable':
      return {
        total_outstanding: 2000000,
        items: [
          {
            contract_id: 1,
            tenant_name: 'Nguyễn Văn A',
            due_amount: 1500000,
            days_overdue: 3
          }
        ]
      };
    case 'revenue-analysis':
      return {
        monthly: [
          { month: '2024-11', revenue: 4200000 },
          { month: '2024-12', revenue: 4800000 },
          { month: '2025-01', revenue: 5000000 }
        ],
        by_branch: [
          { branch_id: 1, branch_name: 'Chi nhánh Trung Tâm', revenue: 3200000 },
          { branch_id: 2, branch_name: 'Chi nhánh Bình Thạnh', revenue: 1800000 }
        ]
      };
    case 'cashflow-detail':
      return {
        inflow: 5200000,
        outflow: 1700000,
        transactions: [
          { id: 1, type: 'inflow', amount: 1500000, description: 'Thu tiền phòng 101', date: '2025-01-05' },
          { id: 2, type: 'outflow', amount: 500000, description: 'Thanh toán điện nước', date: '2025-01-03' }
        ]
      };
    default:
      return { data: [] };
  }
};

const markNotificationRead = (id) => {
  const notifications = collections.notifications || [];
  const item = notifications.find((notification) => Number(notification.id) === Number(id));
  if (item) {
    item.is_read = true;
    item.read_at = now();
  }
  return item;
};

const markAllNotificationsRead = () => {
  (collections.notifications || []).forEach((notification) => {
    notification.is_read = true;
    notification.read_at = now();
  });
};

const mockApi = {
  async get(path) {
    const { collection, id, subPath } = parseSegments(path);

    if (!collection) {
      return response({});
    }

    if (collection === 'dashboard') {
      if (subPath === 'stats') {
        return response(getDashboardStats());
      }
      if (subPath === 'recent') {
        return response(getDashboardRecent());
      }
    }

    if (collection === 'notifications' && subPath === 'unread-count') {
      return response(getNotificationsUnreadCount());
    }

    if (collection === 'accounts' && subPath === 'total-balance') {
      const total = (collections.accounts || []).reduce((sum, account) => sum + (account.current_balance || 0), 0);
      return response({ total_balance: total });
    }

    if (collection === 'reports') {
      return response(getReports(subPath));
    }

    if (collection === 'settings') {
      return response(collections.settings || {});
    }

    if (!collections[collection]) {
      collections[collection] = [];
    }

    if (!id) {
      return response(collections[collection]);
    }

    const items = collections[collection];
    const item = items.find((record) => Number(record.id) === Number(id));
    if (!item) {
      throw new Error('Không tìm thấy dữ liệu');
    }

    return response(item);
  },

  async post(path, payload) {
    const { collection, subPath } = parseSegments(path);

    if (collection === 'settings') {
      collections.settings = { ...collections.settings, ...payload, updated_at: now() };
      return response({ ...collections.settings, message: 'Lưu thiết lập thành công' });
    }

    if (collection === 'notifications' && subPath === 'create') {
      const id = nextId('notifications');
      const notification = { id, ...payload, is_read: false, created_at: now() };
      collections.notifications.push(notification);
      return response(notification);
    }

    if (collection === 'invoices' && subPath === 'bulk') {
      // Simply acknowledge bulk creation
      return response({ success: true });
    }

    if (!collections[collection]) {
      collections[collection] = [];
    }

    const id = nextId(collection);
    const record = {
      id,
      ...payload,
      created_at: now(),
      updated_at: now()
    };
    collections[collection].push(record);
    return response(record);
  },

  async put(path, payload) {
    const { collection, id } = parseSegments(path);
    if (!collection || !id) {
      throw new Error('Yêu cầu không hợp lệ');
    }

    if (!collections[collection]) {
      collections[collection] = [];
    }

    const items = collections[collection];
    const index = items.findIndex((record) => Number(record.id) === Number(id));
    if (index === -1) {
      throw new Error('Không tìm thấy dữ liệu');
    }

    const updated = {
      ...items[index],
      ...payload,
      updated_at: now()
    };
    items[index] = updated;
    return response(updated);
  },

  async patch(path) {
    const { collection, id, subPath } = parseSegments(path);

    if (collection === 'notifications' && id && subPath === 'read') {
      const updated = markNotificationRead(id);
      return response(updated || {});
    }

    if (collection === 'notifications' && subPath === 'mark-all-read') {
      markAllNotificationsRead();
      return response({ success: true });
    }

    return response({ success: true });
  },

  async delete(path) {
    const { collection, id } = parseSegments(path);
    if (!collection || !id) {
      throw new Error('Yêu cầu không hợp lệ');
    }

    if (!collections[collection]) {
      collections[collection] = [];
    }

    const items = collections[collection];
    const index = items.findIndex((record) => Number(record.id) === Number(id));
    if (index === -1) {
      throw new Error('Không tìm thấy dữ liệu');
    }
    const [removed] = items.splice(index, 1);
    return response(removed);
  }
};

export default mockApi;

