// Firebase Realtime Database API Wrapper
// This wrapper provides axios-like interface for Firebase operations
import { database } from './firebase';
import { ensureFirebaseAuthSession } from './firebaseAuth';
import { 
  ref, 
  get, 
  set, 
  remove, 
  update
} from 'firebase/database';

const DEFAULT_DATE_RANGE_DAYS = 30;
const CONTROL_FILTER_KEYS = new Set(['page', 'pageSize', 'limit', 'offset', 'sort', 'order']);
const DEFAULT_SETTINGS = {
  app_name: 'Nhà Trọ',
  app_logo: null,
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_website: '',
  company_tax_code: '',
  company_representative: '',
  company_representative_position: '',
  company_bank_account: '',
  company_bank_name: '',
  company_bank_branch: '',
  notes: ''
};

// Helper: Convert Firebase object to array
const objectToArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  
  return Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return { firebase_key: key, ...value };
    }
    return value;
  });
};

const getCollectionPrefix = (collectionOrKey) => {
  return (collectionOrKey || '').replace(/s$/, '');
};

const getFirebaseKey = (collection, id) => {
  const prefix = getCollectionPrefix(collection);
  return `${prefix}_${id}`;
};

const isNumericId = (value) => {
  if (value === null || value === undefined) return false;
  return /^\d+$/.test(String(value));
};

const parsePath = (path) => {
  const cleanPath = (path || '').replace(/^\//, '').replace(/\/$/, '');
  const segments = cleanPath.length > 0 ? cleanPath.split('/') : [];
  const collection = segments[0] || null;
  const maybeIdSegment = segments[1] || null;
  const hasNumericId = isNumericId(maybeIdSegment);

  return {
    rawPath: cleanPath,
    segments,
    collection,
    id: hasNumericId ? Number(maybeIdSegment) : null,
    idSegment: hasNumericId ? maybeIdSegment : null,
    subSegments: hasNumericId ? segments.slice(2) : segments.slice(1)
  };
};

const parseFilters = (queryString, configParams) => {
  const filters = {};

  if (queryString) {
    const params = new URLSearchParams(queryString);
    params.forEach((value, key) => {
      filters[key] = value;
    });
  }

  if (configParams && typeof configParams === 'object') {
    Object.entries(configParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filters[key] = value;
      }
    });
  }

  return filters;
};

const filterableParams = (filters) => {
  if (!filters) return {};
  return Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => {
      if (CONTROL_FILTER_KEYS.has(key)) return false;
      return value !== undefined && value !== null && value !== '';
    })
  );
};

const findById = (data, id) => {
  if (!data || id === null || Number.isNaN(id)) return null;
  
  if (Array.isArray(data)) {
    return data.find((item) => item?.id === id) || null;
  }

  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;
      if (value.id === id || key === getFirebaseKey(getCollectionPrefix(key), id)) {
        return { firebase_key: key, ...value };
      }
    }
  }
  
  return null;
};

const applyFilters = (data, filters = {}) => {
  if (!filters || Object.keys(filters).length === 0) return data;
  
  let filtered = Array.isArray(data) ? [...data] : objectToArray(data);
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    filtered = filtered.filter((item) => {
      const itemValue = item?.[key];
      if (typeof itemValue === 'string' && typeof value === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase());
        }
      if (typeof itemValue === 'number' && typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) return false;
        return itemValue === parsed;
      }
      return itemValue === value;
      });
  });
  
  return filtered;
};

const fetchCollection = async (collection) => {
  if (!collection) return [];
  const dbRef = ref(database, collection);
  const snapshot = await get(dbRef);
  if (!snapshot.exists()) return [];
  return objectToArray(snapshot.val());
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const parseDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const normalizeDate = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  return formatDate(date);
};

const computeDateRange = (startDate, endDate) => {
  const today = new Date();
  const end = parseDate(endDate) || new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = parseDate(startDate) || new Date(end);
  if (!startDate) {
    start.setDate(end.getDate() - DEFAULT_DATE_RANGE_DAYS + 1);
  }
  const normalizedStart = formatDate(start);
  const normalizedEnd = formatDate(end);
  return {
    start: normalizedStart,
    end: normalizedEnd
  };
};

const withinDateRange = (dateString, start, end) => {
  if (!dateString) return false;
  const normalized = normalizeDate(dateString);
  if (!normalized) return false;
  if (start && normalized < start) return false;
  if (end && normalized > end) return false;
  return true;
};

const getCurrentUserId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && parsed.id) {
      return Number(parsed.id);
    }
    if (parsed && parsed.user?.id) {
      return Number(parsed.user.id);
    }
    return null;
  } catch (error) {
    console.warn('Unable to parse stored user session:', error);
    return null;
  }
};

const aggregateDashboardStats = async () => {
  const [branches, rooms, tenants, contracts, transactions] = await Promise.all([
    fetchCollection('branches'),
    fetchCollection('rooms'),
    fetchCollection('tenants'),
    fetchCollection('contracts'),
    fetchCollection('transactions')
  ]);

  const now = new Date();
  const currentMonth = formatDate(new Date(now.getFullYear(), now.getMonth(), 1)).slice(0, 7);

  const incomes = transactions.filter((txn) => txn.type === 'income');
  const totalRevenue = incomes.reduce((sum, txn) => sum + toNumber(txn.amount), 0);
  const monthlyRevenue = incomes
    .filter((txn) => {
      const datePart = normalizeDate(txn.transaction_date) || normalizeDate(txn.created_at) || '';
      return datePart.startsWith(currentMonth);
    })
    .reduce((sum, txn) => sum + toNumber(txn.amount), 0);

  return {
    totalBranches: branches.length,
    totalRooms: rooms.length,
    availableRooms: rooms.filter((room) => room.status === 'available').length,
    occupiedRooms: rooms.filter((room) => room.status === 'occupied').length,
    totalTenants: tenants.length,
    activeContracts: contracts.filter((contract) => contract.status === 'active').length,
    monthlyRevenue,
    totalRevenue
  };
};

const aggregateDashboardRecent = async () => {
  const [contracts, rooms, branches, tenants, transactions, invoices] = await Promise.all([
    fetchCollection('contracts'),
    fetchCollection('rooms'),
    fetchCollection('branches'),
    fetchCollection('tenants'),
    fetchCollection('transactions'),
    fetchCollection('invoices')
  ]);

  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const contractById = new Map(contracts.map((contract) => [contract.id, contract]));
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  const recentContracts = [...contracts]
    .sort((a, b) => {
      const dateA = parseDate(a.created_at || a.start_date) || new Date(0);
      const dateB = parseDate(b.created_at || b.start_date) || new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((contract) => {
      const room = roomById.get(contract.room_id);
      const branch = room ? branchById.get(room.branch_id) : null;
      const tenant = tenantById.get(contract.tenant_id);
      return {
        id: contract.id,
        tenant_name: tenant?.full_name || 'N/A',
        room_number: room?.room_number || 'N/A',
        branch_name: branch?.name || 'N/A',
        status: contract.status || 'active',
        start_date: contract.start_date,
        created_at: contract.created_at
      };
    });

  const incomeTransactions = transactions
    .filter((txn) => txn.type === 'income')
    .sort((a, b) => {
      const dateA = parseDate(a.transaction_date || a.created_at) || new Date(0);
      const dateB = parseDate(b.transaction_date || b.created_at) || new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((txn) => {
      const invoice = invoiceById.get(txn.reference_id);
      const contract = invoice ? contractById.get(invoice.contract_id) : null;
      const tenant = contract ? tenantById.get(contract.tenant_id) : null;
      const room = contract ? roomById.get(contract.room_id) : null;
      return {
        id: txn.id,
        amount: toNumber(txn.amount),
        status: invoice ? (invoice.status || 'paid') : 'paid',
        payment_date: txn.transaction_date || txn.created_at,
        tenant_name: tenant?.full_name || 'Khách thuê',
        room_number: room?.room_number || 'N/A'
      };
    });

  return {
    contracts: recentContracts,
    payments: incomeTransactions
  };
};

const aggregateAccountsTotalBalance = async () => {
  const accounts = await fetchCollection('accounts');
  const total = accounts.reduce((sum, account) => sum + toNumber(account.current_balance), 0);
  return { total };
};

const aggregateNotifications = async (filters = {}) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return {
      notifications: [],
      unread_count: 0
    };
  }

  const [notifications, recipients, users] = await Promise.all([
    fetchCollection('notifications'),
    fetchCollection('notification_recipients'),
    fetchCollection('users')
  ]);

  const notificationMap = new Map(notifications.map((notification) => [notification.id, notification]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  const userRecipients = recipients.filter((recipient) => Number(recipient.user_id) === userId);

  const unreadCount = userRecipients.filter((recipient) => toNumber(recipient.is_read, 0) === 0).length;

  const enriched = userRecipients
    .map((recipient) => {
      const notification = notificationMap.get(recipient.notification_id);
      if (!notification) return null;
      const createdBy = notification.created_by ? userMap.get(notification.created_by) : null;
      return {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        link_type: notification.link_type,
        link_id: notification.link_id,
        metadata: notification.metadata ? (() => {
          try {
            return JSON.parse(notification.metadata);
          } catch (error) {
            return notification.metadata;
          }
        })() : null,
        created_by: notification.created_by,
        creator_name: createdBy?.full_name || null,
        created_at: notification.created_at,
        is_read: toNumber(recipient.is_read, 0) === 1,
        read_at: recipient.read_at,
        recipient_id: recipient.id
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dateA = parseDate(a.created_at) || new Date(0);
      const dateB = parseDate(b.created_at) || new Date(0);
      return dateB - dateA;
    });

  const pageSize = toNumber(filters.pageSize, 20);

  return {
    notifications: enriched.slice(0, pageSize),
    unread_count: unreadCount
  };
};

const aggregateNotificationsUnreadCount = async () => {
  const { unread_count } = await aggregateNotifications();
  return { unread_count };
};

const normalizeSettingsRecord = (record) => {
  const safeRecord = record && typeof record === 'object' ? record : {};
  const { firebase_key, ...rest } = safeRecord;
  return {
    ...DEFAULT_SETTINGS,
    ...rest
  };
};

const aggregateSettings = async () => {
  const records = await fetchCollection('settings');
  if (!records || records.length === 0) {
    return { ...DEFAULT_SETTINGS };
  }
  const sorted = [...records].sort((a, b) => toNumber(b.id, 0) - toNumber(a.id, 0));
  return normalizeSettingsRecord(sorted[0]);
};

const aggregateProfitLossReport = async (filters = {}) => {
  const { startDate, endDate } = filters;
  const { start, end } = computeDateRange(startDate, endDate);

  const [transactions, categories] = await Promise.all([
    fetchCollection('transactions'),
    fetchCollection('financial_categories')
  ]);

  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const relevantTransactions = transactions.filter((txn) =>
    withinDateRange(txn.transaction_date || txn.created_at, start, end)
  );

  const summary = relevantTransactions.reduce(
    (acc, txn) => {
      if (txn.type === 'income') {
        acc.total_income += toNumber(txn.amount);
      } else if (txn.type === 'expense') {
        acc.total_expense += toNumber(txn.amount);
      }
      return acc;
    },
    { total_income: 0, total_expense: 0 }
  );
  summary.net_profit = summary.total_income - summary.total_expense;

  const incomeBreakdownMap = new Map();
  const expenseBreakdownMap = new Map();

  relevantTransactions.forEach((txn) => {
    const category = categoryMap.get(txn.category_id) || {};
    const key = category.code || 'OTHER';
    const targetMap = txn.type === 'income' ? incomeBreakdownMap : expenseBreakdownMap;
    if (!targetMap.has(key)) {
      targetMap.set(key, {
        category_code: key,
        category_name: category.name || 'Khác',
        total: 0
      });
    }
    const entry = targetMap.get(key);
    entry.total += toNumber(txn.amount);
  });

  const timelineMap = new Map();
  relevantTransactions.forEach((txn) => {
    const dateKey = normalizeDate(txn.transaction_date || txn.created_at);
    if (!dateKey) return;
    if (!timelineMap.has(dateKey)) {
      timelineMap.set(dateKey, { income: 0, expense: 0 });
    }
    const data = timelineMap.get(dateKey);
    if (txn.type === 'income') {
      data.income += toNumber(txn.amount);
    } else if (txn.type === 'expense') {
      data.expense += toNumber(txn.amount);
    }
  });

  const timeline = Array.from(timelineMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, values]) => ({
      date,
      income: values.income,
      expense: values.expense,
      net: values.income - values.expense
    }));

  return {
    range: { start, end },
    summary,
    income_breakdown: Array.from(incomeBreakdownMap.values()),
    expense_breakdown: Array.from(expenseBreakdownMap.values()),
    timeline
  };
};

const aggregateAccountsReceivable = async (filters = {}) => {
  const { branchId, minOverdueDays } = filters;
  const effectiveMinOverdue = toNumber(minOverdueDays, 1);

  const [invoices, contracts, tenants, rooms, branches] = await Promise.all([
    fetchCollection('invoices'),
    fetchCollection('contracts'),
    fetchCollection('tenants'),
    fetchCollection('rooms'),
    fetchCollection('branches')
  ]);

  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const contractById = new Map(contracts.map((contract) => [contract.id, contract]));
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  const today = new Date();
  const todayKey = formatDate(today);

  const reportItems = invoices
    .map((invoice) => {
      const contract = contractById.get(invoice.contract_id);
      const tenant = contract ? tenantById.get(contract.tenant_id) : null;
      const room = contract ? roomById.get(contract.room_id) : null;
      const branch = room ? branchById.get(room.branch_id) : null;
      if (!invoice.due_date) return null;

      const dueDate = normalizeDate(invoice.due_date);
      if (!dueDate || dueDate >= todayKey) return null;

      const overdueMs = parseDate(todayKey) - parseDate(dueDate);
      const overdueDays = Math.max(Math.floor(overdueMs / (1000 * 60 * 60 * 24)), 0);
      if (overdueDays < effectiveMinOverdue) return null;

      if (branchId && Number(branchId) !== Number(branch?.id)) {
        return null;
      }

      const remaining = toNumber(invoice.remaining_amount ?? (invoice.total_amount - invoice.paid_amount));
      if (remaining <= 0) return null;

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: toNumber(invoice.total_amount),
        paid_amount: toNumber(invoice.paid_amount),
        remaining_amount: remaining,
        status: invoice.status,
        tenant_name: tenant?.full_name || 'Khách thuê',
        tenant_phone: tenant?.phone || null,
        branch_name: branch?.name || null,
        branch_id: branch?.id || null,
        room_number: room?.room_number || null,
        overdue_days: overdueDays
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dueA = parseDate(a.due_date) || new Date(0);
      const dueB = parseDate(b.due_date) || new Date(0);
      return dueA - dueB;
    });

  const summary = reportItems.reduce(
    (acc, item) => {
      acc.total_invoices += 1;
      acc.total_amount += toNumber(item.total_amount);
      acc.total_outstanding += toNumber(item.remaining_amount);
      acc.max_overdue = Math.max(acc.max_overdue, item.overdue_days);
      return acc;
    },
    { total_invoices: 0, total_amount: 0, total_outstanding: 0, max_overdue: 0 }
  );

  return {
    generated_at: new Date().toISOString(),
    summary,
    items: reportItems
  };
};

const aggregateRevenueAnalysis = async (filters = {}) => {
  const { startDate, endDate } = filters;
  const { start, end } = computeDateRange(startDate, endDate);

  const [transactions, categories] = await Promise.all([
    fetchCollection('transactions'),
    fetchCollection('financial_categories')
  ]);

  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const incomes = transactions.filter(
    (txn) => txn.type === 'income' && withinDateRange(txn.transaction_date || txn.created_at, start, end)
  );

  const revenueByCategoryMap = new Map();
  incomes.forEach((txn) => {
    const category = categoryMap.get(txn.category_id) || {};
    const key = category.code || 'OTHER';
    if (!revenueByCategoryMap.has(key)) {
      revenueByCategoryMap.set(key, {
        category_code: key,
        category_name: category.name || 'Khác',
        total: 0
      });
    }
    const entry = revenueByCategoryMap.get(key);
    entry.total += toNumber(txn.amount);
  });

  const revenueByMonthMap = new Map();
  incomes.forEach((txn) => {
    const dateKey = normalizeDate(txn.transaction_date || txn.created_at);
    if (!dateKey) return;
    const monthKey = dateKey.slice(0, 7);
    if (!revenueByMonthMap.has(monthKey)) {
      revenueByMonthMap.set(monthKey, { period: monthKey, total: 0 });
    }
    revenueByMonthMap.get(monthKey).total += toNumber(txn.amount);
  });

  const revenueByCategory = Array.from(revenueByCategoryMap.values()).sort((a, b) => b.total - a.total);
  const totalRevenue = revenueByCategory.reduce((sum, item) => sum + item.total, 0);

  const revenueByMonth = Array.from(revenueByMonthMap.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  return {
    range: { start, end },
    total_revenue: totalRevenue,
    revenue_by_category: revenueByCategory,
    revenue_by_month: revenueByMonth
  };
};

const aggregateCashflowDetail = async (filters = {}) => {
  const { startDate, endDate, type, categoryId } = filters;
  const { start, end } = computeDateRange(startDate, endDate);

  const [transactions, categories, accounts] = await Promise.all([
    fetchCollection('transactions'),
    fetchCollection('financial_categories'),
    fetchCollection('accounts')
  ]);

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const items = transactions
    .filter((txn) => withinDateRange(txn.transaction_date || txn.created_at, start, end))
    .filter((txn) => {
      if (type && ['income', 'expense'].includes(type)) {
        if (txn.type !== type) return false;
      }
      if (categoryId) {
        return Number(txn.category_id) === Number(categoryId);
      }
      return true;
    })
    .map((txn) => {
      const category = categoryMap.get(txn.category_id) || {};
      const account = accountMap.get(txn.account_id) || {};
      return {
        ...txn,
        amount: toNumber(txn.amount),
        category_name: category.name || 'Khác',
        category_code: category.code || 'OTHER',
        account_name: account.name || null,
        account_type: account.type || null
      };
    })
    .sort((a, b) => {
      const dateA = parseDate(a.transaction_date || a.created_at) || new Date(0);
      const dateB = parseDate(b.transaction_date || b.created_at) || new Date(0);
      return dateB - dateA;
    });

  const totals = items.reduce(
    (acc, item) => {
      if (item.type === 'income') {
        acc.total_income += item.amount;
      } else if (item.type === 'expense') {
        acc.total_expense += item.amount;
      }
      return acc;
    },
    { total_income: 0, total_expense: 0 }
  );

  return {
    range: { start, end },
    totals: {
      ...totals,
      net_cashflow: totals.total_income - totals.total_expense
    },
    items
  };
};

const aggregatePermissions = async () => {
  const permissions = await fetchCollection('permissions');
  const activePermissions = permissions.filter((perm) => (perm.status || 'active') === 'active');

  const grouped = activePermissions.reduce((acc, perm) => {
    if (!acc[perm.module_code]) {
      acc[perm.module_code] = {
        module_code: perm.module_code,
        module_name: perm.module_name,
        permissions: []
      };
    }
    acc[perm.module_code].permissions.push(perm);
    return acc;
  }, {});

  return Object.values(grouped).map((module) => ({
    ...module,
    permissions: module.permissions.sort((a, b) => a.action.localeCompare(b.action))
  }));
};

const aggregatePermissionsModules = async () => {
  const permissions = await fetchCollection('permissions');
  const activePermissions = permissions.filter((perm) => (perm.status || 'active') === 'active');

  const grouped = activePermissions.reduce((acc, perm) => {
    if (!acc[perm.module_code]) {
      acc[perm.module_code] = {
        module_code: perm.module_code,
        module_name: perm.module_name,
        actions: []
      };
    }
    acc[perm.module_code].actions.push({
      id: perm.id,
      action: perm.action,
      action_name: perm.action_name,
      description: perm.description
    });
    return acc;
  }, {});

  const actionPriority = {
    view: 1,
    create: 2,
    update: 3,
    delete: 4
  };

  return Object.values(grouped).map((module) => ({
    ...module,
    actions: module.actions.sort((a, b) => {
      const priorityA = actionPriority[a.action] ?? 99;
      const priorityB = actionPriority[b.action] ?? 99;
      if (priorityA === priorityB) {
        return a.action.localeCompare(b.action);
      }
      return priorityA - priorityB;
    })
  }));
};

const aggregateRolePermissions = async (roleId) => {
  if (!roleId) {
    return [];
  }

  const [permissions, rolePermissions] = await Promise.all([
    fetchCollection('permissions'),
    fetchCollection('role_permissions')
  ]);

  const activePermissions = permissions.filter((perm) => (perm.status || 'active') === 'active');
  const assignedSet = new Set(
    rolePermissions
      .filter((rp) => Number(rp.role_id) === Number(roleId))
      .map((rp) => rp.permission_id)
  );

  const grouped = activePermissions.reduce((acc, perm) => {
    if (!acc[perm.module_code]) {
      acc[perm.module_code] = {
        module_code: perm.module_code,
        module_name: perm.module_name,
        permissions: []
      };
    }
    acc[perm.module_code].permissions.push({
      ...perm,
      assigned: assignedSet.has(perm.id)
    });
    return acc;
  }, {});

  return Object.values(grouped).map((module) => ({
    ...module,
    permissions: module.permissions.sort((a, b) => a.action.localeCompare(b.action))
  }));
};

const handleSpecialGet = async (segments, filters) => {
  const [first, second, third] = segments;
  const key = segments.join('/');

  switch (key) {
    case 'dashboard/stats':
      return aggregateDashboardStats();
    case 'dashboard/recent':
      return aggregateDashboardRecent();
    case 'accounts/total-balance':
      return aggregateAccountsTotalBalance();
    case 'notifications/unread-count':
      return aggregateNotificationsUnreadCount();
    case 'notifications':
      return aggregateNotifications(filters);
    case 'reports/profit-loss':
      return aggregateProfitLossReport(filters);
    case 'reports/accounts-receivable':
      return aggregateAccountsReceivable(filters);
    case 'reports/revenue-analysis':
      return aggregateRevenueAnalysis(filters);
    case 'reports/cashflow-detail':
      return aggregateCashflowDetail(filters);
    case 'settings':
      return aggregateSettings();
    case 'permissions':
      return aggregatePermissions();
    case 'permissions/modules':
      return aggregatePermissionsModules();
    default:
      break;
  }

  if (first === 'permissions' && second === 'role' && third) {
    return aggregateRolePermissions(Number(third));
  }

  return undefined;
};

const firebaseApi = {
  /**
   * GET request - Fetch data from Firebase
   * @param {string} path - API path (e.g., '/users', '/users/1', '/users?role=admin')
   */
  async get(path, config = {}) {
    try {
      await ensureFirebaseAuthSession();
      // Parse URL and query params
      const [pathname, queryString] = path.split('?');
      const { collection, id, idSegment, subSegments, segments } = parsePath(pathname);
      const params = parseFilters(queryString, config?.params);
      const listFilters = filterableParams(params);

      const special = await handleSpecialGet(segments, params);
      if (special !== undefined) {
        return { data: special };
      }

      if (!collection) {
        throw { response: { status: 400, data: { error: 'Đường dẫn không hợp lệ' } } };
      }

      if (id !== null) {
        const dbRef = ref(database, collection);
        const snapshot = await get(dbRef);
        if (!snapshot.exists()) {
          throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
        }
        
        const data = snapshot.val();
        const item = findById(data, id);
        
        if (!item) {
          throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
        }
        
        if (subSegments.length > 0) {
          const subRefPath = [collection, item.firebase_key, ...subSegments].join('/');
          const subRef = ref(database, subRefPath);
          const subSnapshot = await get(subRef);
          if (subSnapshot.exists()) {
            const subData = objectToArray(subSnapshot.val());
            return { data: applyFilters(subData, listFilters) };
          }
          return { data: [] };
        }
        return { data: item };
      }

      if (subSegments.length > 0) {
        const nestedPath = [collection, ...subSegments].join('/');
        const nestedRef = ref(database, nestedPath);
        const nestedSnapshot = await get(nestedRef);
        if (!nestedSnapshot.exists()) {
          return { data: [] };
        }
        const value = nestedSnapshot.val();
        if (Array.isArray(value)) {
          return { data: applyFilters(value, listFilters) };
        }
        if (typeof value === 'object') {
          return { data: applyFilters(objectToArray(value), listFilters) };
        }
        return { data: value };
      }

      const dbRef = ref(database, collection);
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists()) {
          return { data: [] };
        }
        
      const data = objectToArray(snapshot.val());
      return { data: applyFilters(data, listFilters) };
    } catch (error) {
      console.error('Firebase GET error:', error);
      throw error;
    }
  },

  /**
   * POST request - Create new data in Firebase
   * @param {string} path - API path (e.g., '/users')
   * @param {object} payload - Data to create
   */
  async post(path, payload, config = {}) {
    try {
      await ensureFirebaseAuthSession();
      const { collection } = parsePath(path);
      const dbRef = ref(database, collection);

      if (collection === 'settings') {
        const snapshot = await get(dbRef);
        const existing = snapshot.exists() ? objectToArray(snapshot.val()) : [];
        const isUpdate = existing.length > 0;

        if (isUpdate) {
          const sorted = [...existing].sort((a, b) => toNumber(b.id, 0) - toNumber(a.id, 0));
          const current = sorted[0];
          const firebaseKey = current.firebase_key || getFirebaseKey('settings', current.id || 1);
          const updatedData = normalizeSettingsRecord({
            ...current,
            ...payload,
            id: current.id || 1,
            updated_at: new Date().toISOString()
          });
          await set(ref(database, `${collection}/${firebaseKey}`), updatedData);
        } else {
          const newId = 1;
          const firebaseKey = getFirebaseKey('settings', newId);
          const newData = normalizeSettingsRecord({
            ...payload,
            id: newId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          await set(ref(database, `${collection}/${firebaseKey}`), newData);
        }

        const normalized = await aggregateSettings();
        return {
          data: {
            ...normalized,
            message: isUpdate ? 'Cập nhật thành công' : 'Tạo mới thành công'
          }
        };
      }
      
      // Get current max ID to generate new ID
      const snapshot = await get(dbRef);
      let maxId = 0;
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = objectToArray(data);
        maxId = Math.max(...items.map(item => item.id || 0), 0);
      }
      
      const newId = maxId + 1;
      const newData = {
        id: newId,
        ...payload,
        created_at: payload.created_at || new Date().toISOString()
      };
      
      // Generate Firebase key
      const firebaseKey = getFirebaseKey(collection, newId);
      const newRef = ref(database, `${collection}/${firebaseKey}`);
      
      await set(newRef, newData);
      
      return { data: newData };
    } catch (error) {
      console.error('Firebase POST error:', error);
      throw error;
    }
  },

  /**
   * PUT request - Update existing data in Firebase
   * @param {string} path - API path (e.g., '/users/1')
   * @param {object} payload - Data to update
   */
  async put(path, payload, config = {}) {
    try {
      await ensureFirebaseAuthSession();
      const { collection, id } = parsePath(path);

      // Special handling for permissions assignment
      if (collection === 'permissions' && path.includes('/role/')) {
        const roleIdSegment = path.split('/role/')[1];
        const roleId = Number(roleIdSegment?.split('/')[0]);
        if (!roleId) {
          throw { response: { status: 400, data: { error: 'ID vai trò không hợp lệ' } } };
        }
        const permissionIds = Array.isArray(payload?.permission_ids) ? payload.permission_ids : [];
        const rolePermissionsRef = ref(database, 'role_permissions');
        const snapshot = await get(rolePermissionsRef);
        const existing = snapshot.exists() ? objectToArray(snapshot.val()) : [];

        // Remove existing entries for this role
        const updates = {};
        existing
          .filter((rp) => Number(rp.role_id) === roleId)
          .forEach((rp) => {
            if (rp.firebase_key) {
              updates[rp.firebase_key] = null;
            }
          });

        await update(rolePermissionsRef, updates);

        if (permissionIds.length > 0) {
          const newSnapshot = await get(rolePermissionsRef);
          const currentData = newSnapshot.exists() ? objectToArray(newSnapshot.val()) : [];
          let maxId = currentData.reduce((max, item) => Math.max(max, toNumber(item.id)), 0);
          const insertPayload = {};
          permissionIds.forEach((permissionId) => {
            maxId += 1;
            const firebaseKey = getFirebaseKey('role_permissions', maxId);
            insertPayload[firebaseKey] = {
              id: maxId,
              role_id: roleId,
              permission_id: permissionId,
              created_at: new Date().toISOString()
            };
          });
          await update(rolePermissionsRef, insertPayload);
        }

        return {
          data: { message: 'Phân quyền đã được cập nhật thành công' }
        };
      }
      
      if (!id) {
        throw { response: { status: 400, data: { error: 'ID không hợp lệ' } } };
      }
      
      // Find the item first
      const dbRef = ref(database, collection);
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      const data = snapshot.val();
      const item = findById(data, id);
      
      if (!item) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      // Update the item
      const firebaseKey = item.firebase_key;
      const updateRef = ref(database, `${collection}/${firebaseKey}`);
      
      const updatedData = {
        ...item,
        ...payload,
        id: id,
        updated_at: new Date().toISOString()
      };
      
      // Remove firebase_key from data before saving
      delete updatedData.firebase_key;
      
      await set(updateRef, updatedData);
      
      return { data: { message: 'Cập nhật thành công', ...updatedData } };
    } catch (error) {
      console.error('Firebase PUT error:', error);
      throw error;
    }
  },

  /**
   * PATCH request - Partially update data in Firebase
   * @param {string} path - API path (e.g., '/users/1')
   * @param {object} payload - Data to update
   */
  async patch(path, payload) {
    await ensureFirebaseAuthSession();
    const { collection, segments } = parsePath(path);

    if (collection === 'notifications' && segments[1] === 'mark-all-read') {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          return { data: { message: 'No user session' } };
        }
        const recipientsRef = ref(database, 'notification_recipients');
        const snapshot = await get(recipientsRef);
        if (!snapshot.exists()) {
          return { data: { message: 'No notifications to update' } };
        }
        const recipients = objectToArray(snapshot.val());
        const updates = {};
        const now = new Date().toISOString();
        recipients
          .filter((item) => Number(item.user_id) === userId && toNumber(item.is_read, 0) === 0)
          .forEach((item) => {
            if (item.firebase_key) {
              updates[`${item.firebase_key}/is_read`] = 1;
              updates[`${item.firebase_key}/read_at`] = now;
            }
          });
        if (Object.keys(updates).length > 0) {
          await update(recipientsRef, updates);
        }
        return { data: { message: 'Đã cập nhật thông báo' } };
      } catch (error) {
        console.error('Firebase PATCH error:', error);
        throw error;
      }
    }

    if (collection === 'notifications' && segments.length === 3 && segments[2] === 'read') {
      try {
        const notificationId = Number(segments[1]);
        if (!notificationId) {
          throw { response: { status: 400, data: { error: 'Notification ID không hợp lệ' } } };
        }
        const userId = getCurrentUserId();
        if (!userId) {
          throw { response: { status: 401, data: { error: 'Không tìm thấy người dùng' } } };
        }
        const recipientsRef = ref(database, 'notification_recipients');
        const snapshot = await get(recipientsRef);
        const recipients = snapshot.exists() ? objectToArray(snapshot.val()) : [];
        const recipient = recipients.find(
          (item) => Number(item.notification_id) === notificationId && Number(item.user_id) === userId
        );
        if (!recipient) {
          throw { response: { status: 404, data: { error: 'Không tìm thấy thông báo' } } };
        }
        if (recipient.firebase_key) {
          await update(ref(database, `notification_recipients/${recipient.firebase_key}`), {
            is_read: 1,
            read_at: new Date().toISOString()
          });
        }
        return { data: { message: 'Đã đánh dấu đã đọc' } };
      } catch (error) {
        console.error('Firebase PATCH error:', error);
        throw error;
      }
    }

    return this.put(path, payload);
  },

  /**
   * DELETE request - Remove data from Firebase
   * @param {string} path - API path (e.g., '/users/1')
   */
  async delete(path) {
    try {
      await ensureFirebaseAuthSession();
      const { collection, id } = parsePath(path);
      
      if (!id) {
        throw { response: { status: 400, data: { error: 'ID không hợp lệ' } } };
      }
      
      // Find the item first
      const dbRef = ref(database, collection);
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      const data = snapshot.val();
      const item = findById(data, id);
      
      if (!item) {
        throw { response: { status: 404, data: { error: 'Không tìm thấy dữ liệu' } } };
      }
      
      // Delete the item
      const firebaseKey = item.firebase_key;
      const deleteRef = ref(database, `${collection}/${firebaseKey}`);
      
      await remove(deleteRef);
      
      return { data: { message: 'Xóa thành công' } };
    } catch (error) {
      console.error('Firebase DELETE error:', error);
      throw error;
    }
  },

  // Utility methods
  defaults: {
    headers: {
      common: {}
    }
  }
};

export default firebaseApi;


