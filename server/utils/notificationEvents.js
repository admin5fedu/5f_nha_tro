const { getDb } = require('../database/db');
const {
  createNotification
} = require('./notificationService');
const {
  getBranchManagers,
  getBranchStaff,
  getBranchAccountants,
  getAccountants,
  getAdmins,
  getUsersByIds,
  getUsersByRoles,
  getUniqueRecipientIds
} = require('./notificationRecipients');

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const fetchSingleRow = (query, params = []) => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row || null);
    });
  });
};

const fetchAllRows = (query, params = []) => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};

const EVENT_TYPES = {
  CONTRACT_CREATED: 'contract.created',
  CONTRACT_ENDED: 'contract.ended',
  CONTRACT_EXPIRING: 'contract.expiring',
  TENANT_CREATED: 'tenant.created',
  TENANT_ADDED_TO_ROOM: 'tenant.added_to_room',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_DUE_SOON: 'invoice.due_soon',
  INVOICE_OVERDUE: 'invoice.overdue',
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_UPDATED: 'transaction.updated',
  ACCOUNT_LOW_BALANCE: 'account.low_balance',
  TASK_ASSIGNED: 'task.assigned',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_DUE_SOON: 'task.due_soon',
  TASK_OVERDUE: 'task.overdue',
  ASSET_STATUS_CHANGED: 'asset.status_changed',
  METER_READING_MISSING: 'meter_reading.missing',
  METER_READING_ANOMALY: 'meter_reading.anomaly',
  USER_CREATED: 'user.created',
  USER_STATUS_CHANGED: 'user.status_changed',
  ROOM_VACANT_LONG: 'room.vacant_long'
};

const buildUniqueKey = (parts = []) => parts.filter(Boolean).join(':');

const notifyContractCreated = async ({ contractId }) => {
  if (!contractId) return;
  const contract = await fetchSingleRow(
    `SELECT c.id, c.branch_id, c.start_date, c.end_date, t.full_name as tenant_name, r.room_number
     FROM contracts c
     LEFT JOIN tenants t ON c.tenant_id = t.id
     LEFT JOIN rooms r ON c.room_id = r.id
     WHERE c.id = ?`,
    [contractId]
  );

  if (!contract) return;

  const [managers, staff, admins] = await Promise.all([
    getBranchManagers(contract.branch_id),
    getBranchStaff(contract.branch_id),
    getAdmins()
  ]);

  const recipients = getUniqueRecipientIds([managers, staff, admins]);
  if (recipients.length === 0) return;

  await createNotification({
    title: 'Hợp đồng mới',
    body: `Đã tạo hợp đồng mới cho khách thuê ${contract.tenant_name || ''} (phòng ${contract.room_number || 'N/A'}).`,
    type: EVENT_TYPES.CONTRACT_CREATED,
    linkType: 'contract',
    linkId: contract.id,
    metadata: {
      tenant_name: contract.tenant_name,
      room_number: contract.room_number,
      start_date: contract.start_date,
      end_date: contract.end_date
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.CONTRACT_CREATED, contract.id])
  });
};

const notifyContractEnded = async ({ contractId }) => {
  if (!contractId) return;
  const contract = await fetchSingleRow(
    `SELECT c.id, c.branch_id, c.end_date, t.full_name as tenant_name, r.room_number
     FROM contracts c
     LEFT JOIN tenants t ON c.tenant_id = t.id
     LEFT JOIN rooms r ON c.room_id = r.id
     WHERE c.id = ?`,
    [contractId]
  );

  if (!contract) return;

  const [managers, staff, admins] = await Promise.all([
    getBranchManagers(contract.branch_id),
    getBranchStaff(contract.branch_id),
    getAdmins()
  ]);

  const recipients = getUniqueRecipientIds([managers, staff, admins]);
  if (recipients.length === 0) return;

  await createNotification({
    title: 'Hợp đồng đã kết thúc',
    body: `Hợp đồng của khách ${contract.tenant_name || ''} tại phòng ${contract.room_number || 'N/A'} đã kết thúc.`,
    type: EVENT_TYPES.CONTRACT_ENDED,
    linkType: 'contract',
    linkId: contract.id,
    metadata: {
      tenant_name: contract.tenant_name,
      room_number: contract.room_number,
      end_date: contract.end_date
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.CONTRACT_ENDED, contract.id, contract.end_date])
  });
};

const notifyContractExpiring = async ({ contractId, daysRemaining }) => {
  if (!contractId || typeof daysRemaining !== 'number') return;
  const contract = await fetchSingleRow(
    `SELECT c.id, c.branch_id, c.end_date, t.full_name as tenant_name, r.room_number
     FROM contracts c
     LEFT JOIN tenants t ON c.tenant_id = t.id
     LEFT JOIN rooms r ON c.room_id = r.id
     WHERE c.id = ?`,
    [contractId]
  );

  if (!contract) return;

  const [managers, staff, admins] = await Promise.all([
    getBranchManagers(contract.branch_id),
    getBranchStaff(contract.branch_id),
    getAdmins()
  ]);

  const recipients = getUniqueRecipientIds([managers, staff, admins]);
  if (recipients.length === 0) return;

  await createNotification({
    title: 'Hợp đồng sắp hết hạn',
    body: `Hợp đồng của khách ${contract.tenant_name || ''} tại phòng ${contract.room_number || 'N/A'} sẽ hết hạn trong ${daysRemaining} ngày.`,
    type: EVENT_TYPES.CONTRACT_EXPIRING,
    linkType: 'contract',
    linkId: contract.id,
    metadata: {
      tenant_name: contract.tenant_name,
      room_number: contract.room_number,
      end_date: contract.end_date,
      days_remaining: daysRemaining
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.CONTRACT_EXPIRING, contract.id, daysRemaining])
  });
};

const notifyTenantCreated = async ({ tenantId }) => {
  if (!tenantId) return;
  const tenant = await fetchSingleRow(
    `SELECT id, full_name, tenant_type FROM tenants WHERE id = ?`,
    [tenantId]
  );
  if (!tenant) return;

  const recipients = getUniqueRecipientIds([
    await getUsersByRoles(['manager']),
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Khách thuê mới',
    body: `Khách thuê ${tenant.full_name || ''} vừa được thêm vào hệ thống.`,
    type: EVENT_TYPES.TENANT_CREATED,
    linkType: 'tenant',
    linkId: tenant.id,
    metadata: {
      tenant_type: tenant.tenant_type
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.TENANT_CREATED, tenant.id])
  });
};

const notifyTenantAssignedToRoom = async ({ tenantId, roomId }) => {
  if (!tenantId || !roomId) return;
  const tenant = await fetchSingleRow(
    `SELECT t.id, t.full_name, r.room_number, r.branch_id
     FROM tenants t
     JOIN contracts c ON c.tenant_id = t.id
     JOIN rooms r ON c.room_id = r.id
     WHERE t.id = ?
     ORDER BY c.created_at DESC
     LIMIT 1`,
    [tenantId]
  );

  if (!tenant) return;

  const recipients = getUniqueRecipientIds([
    await getBranchManagers(tenant.branch_id),
    await getBranchStaff(tenant.branch_id),
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Khách thuê mới vào phòng',
    body: `Khách thuê ${tenant.full_name || ''} đã được xếp vào phòng ${tenant.room_number || 'N/A'}.`,
    type: EVENT_TYPES.TENANT_ADDED_TO_ROOM,
    linkType: 'tenant',
    linkId: tenant.id,
    metadata: {
      room_number: tenant.room_number,
      branch_id: tenant.branch_id
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.TENANT_ADDED_TO_ROOM, tenant.id, tenant.room_number])
  });
};

const notifyInvoiceEvent = async ({ invoiceId, type, title, body, uniqueSuffix }) => {
  if (!invoiceId) return;
  const invoice = await fetchSingleRow(
    `SELECT i.id, i.invoice_number, i.due_date, i.total_amount, c.branch_id
     FROM invoices i
     LEFT JOIN contracts c ON i.contract_id = c.id
     WHERE i.id = ?`,
    [invoiceId]
  );

  if (!invoice) return;

  const recipients = getUniqueRecipientIds([
    await getBranchManagers(invoice.branch_id),
    await getBranchAccountants(invoice.branch_id),
    await getAccountants(),
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title,
    body,
    type,
    linkType: 'invoice',
    linkId: invoice.id,
    metadata: {
      invoice_number: invoice.invoice_number,
      due_date: invoice.due_date,
      total_amount: invoice.total_amount
    },
    recipients,
    uniqueKey: buildUniqueKey([type, invoice.id, uniqueSuffix])
  });
};

const notifyInvoiceCreated = ({ invoiceId }) =>
  notifyInvoiceEvent({
    invoiceId,
    type: EVENT_TYPES.INVOICE_CREATED,
    title: 'Hóa đơn mới tạo',
    body: 'Một hóa đơn mới đã được tạo.',
    uniqueSuffix: 'created'
  });

const notifyInvoiceDueSoon = ({ invoiceId, daysRemaining }) =>
  notifyInvoiceEvent({
    invoiceId,
    type: EVENT_TYPES.INVOICE_DUE_SOON,
    title: 'Hóa đơn sắp đến hạn',
    body: `Hóa đơn sắp đến hạn trong ${daysRemaining} ngày.`,
    uniqueSuffix: `due-${daysRemaining}`
  });

const notifyInvoiceOverdue = ({ invoiceId, daysOverdue }) =>
  notifyInvoiceEvent({
    invoiceId,
    type: EVENT_TYPES.INVOICE_OVERDUE,
    title: 'Hóa đơn quá hạn',
    body: `Hóa đơn đã quá hạn ${daysOverdue} ngày.`,
    uniqueSuffix: `overdue-${daysOverdue}`
  });

const notifyTransactionCreated = async ({ transactionId }) => {
  if (!transactionId) return;
  const transaction = await fetchSingleRow(
    `SELECT t.id, t.transaction_number, t.type, t.amount, t.transaction_date
     FROM transactions t
     WHERE t.id = ?`,
    [transactionId]
  );

  if (!transaction) return;

  const recipients = getUniqueRecipientIds([
    await getAccountants(),
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: transaction.type === 'income' ? 'Phiếu thu mới' : 'Phiếu chi mới',
    body: `Phiếu ${transaction.type === 'income' ? 'thu' : 'chi'} ${transaction.transaction_number || ''} trị giá ${transaction.amount || 0} đã được tạo.`,
    type: EVENT_TYPES.TRANSACTION_CREATED,
    linkType: 'transaction',
    linkId: transaction.id,
    metadata: {
      transaction_number: transaction.transaction_number,
      amount: transaction.amount,
      transaction_date: transaction.transaction_date,
      transaction_type: transaction.type
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.TRANSACTION_CREATED, transaction.id])
  });
};

const notifyTransactionUpdated = async ({ transactionId }) => {
  if (!transactionId) return;
  const transaction = await fetchSingleRow(
    `SELECT t.id, t.transaction_number, t.type, t.amount, t.transaction_date
     FROM transactions t
     WHERE t.id = ?`,
    [transactionId]
  );
  if (!transaction) return;

  const recipients = getUniqueRecipientIds([
    await getAccountants(),
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Phiếu thu/chi được cập nhật',
    body: `Phiếu ${transaction.transaction_number || ''} đã được cập nhật thông tin.`,
    type: EVENT_TYPES.TRANSACTION_UPDATED,
    linkType: 'transaction',
    linkId: transaction.id,
    metadata: {
      transaction_number: transaction.transaction_number,
      amount: transaction.amount,
      transaction_date: transaction.transaction_date,
      transaction_type: transaction.type
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.TRANSACTION_UPDATED, transaction.id, transaction.amount])
  });
};

const notifyAccountLowBalance = async ({ accountId, threshold }) => {
  if (!accountId) return;
  const account = await fetchSingleRow(
    `SELECT id, name, current_balance FROM accounts WHERE id = ?`,
    [accountId]
  );
  if (!account) return;
  const limit = typeof threshold === 'number' ? threshold : 500000;
  if (account.current_balance >= limit) return;

  const recipients = getUniqueRecipientIds([
    await getAccountants(),
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Số dư tài khoản thấp',
    body: `Tài khoản ${account.name} hiện còn ${account.current_balance}.`,
    type: EVENT_TYPES.ACCOUNT_LOW_BALANCE,
    linkType: 'account',
    linkId: account.id,
    metadata: {
      current_balance: account.current_balance,
      threshold: limit
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.ACCOUNT_LOW_BALANCE, account.id, limit])
  });
};

const notifyMeterReadingMissing = async ({ branchId, periodKey }) => {
  const recipients = getUniqueRecipientIds([
    branchId ? await getBranchManagers(branchId) : [],
    branchId ? await getBranchStaff(branchId) : [],
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Chưa ghi chỉ số dịch vụ',
    body: 'Cần ghi chỉ số dịch vụ cho kỳ hiện tại.',
    type: EVENT_TYPES.METER_READING_MISSING,
    linkType: 'meter-reading',
    linkId: null,
    metadata: {
      branch_id: branchId,
      period: periodKey
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.METER_READING_MISSING, branchId || 'all', periodKey])
  });
};

const notifyMeterReadingAnomaly = async ({ readingId, usage, previousUsage }) => {
  if (!readingId) return;
  const reading = await fetchSingleRow(
    `SELECT mr.id, mr.room_id, mr.service_id, mr.reading_date, mr.branch_id, r.branch_id as room_branch_id, r.room_number
     FROM meter_readings mr
     LEFT JOIN rooms r ON mr.room_id = r.id
     WHERE mr.id = ?`,
    [readingId]
  );

  if (!reading) return;

  const branchId = reading.branch_id || reading.room_branch_id;
  const recipients = getUniqueRecipientIds([
    await getBranchManagers(branchId),
    await getBranchStaff(branchId)
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Chỉ số dịch vụ bất thường',
    body: `Chỉ số sử dụng (${usage}) chênh lệch lớn so với kỳ trước (${previousUsage}).`,
    type: EVENT_TYPES.METER_READING_ANOMALY,
    linkType: 'meter-reading',
    linkId: reading.id,
    metadata: {
      usage,
      previous_usage: previousUsage,
      room_number: reading.room_number,
      service_id: reading.service_id
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.METER_READING_ANOMALY, reading.id, usage])
  });
};

const notifyTaskAssigned = async ({ taskId }) => {
  if (!taskId) return;
  const task = await fetchSingleRow(
    `SELECT t.id, t.title, t.status, t.due_date, t.assigned_to, t.assigned_by, t.branch_id
     FROM tasks t WHERE t.id = ?`,
    [taskId]
  );

  if (!task) return;

  const recipients = getUniqueRecipientIds([
    await getUsersByIds(toArray(task.assigned_to)),
    await getUsersByIds(toArray(task.assigned_by)),
    await getBranchManagers(task.branch_id)
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Công việc mới',
    body: `Công việc "${task.title}" đã được giao.`,
    type: EVENT_TYPES.TASK_ASSIGNED,
    linkType: 'task',
    linkId: task.id,
    metadata: {
      status: task.status,
      due_date: task.due_date
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.TASK_ASSIGNED, task.id])
  });
};

const notifyTaskStatusChanged = async ({ taskId, status }) => {
  if (!taskId) return;
  const task = await fetchSingleRow(
    `SELECT t.id, t.title, t.status, t.due_date, t.assigned_to, t.assigned_by, t.branch_id
     FROM tasks t WHERE t.id = ?`,
    [taskId]
  );

  if (!task) return;

  const recipients = getUniqueRecipientIds([
    await getUsersByIds(toArray(task.assigned_to)),
    await getUsersByIds(toArray(task.assigned_by)),
    await getBranchManagers(task.branch_id)
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Cập nhật trạng thái công việc',
    body: `Công việc "${task.title}" đã chuyển sang trạng thái ${status || task.status}.`,
    type: EVENT_TYPES.TASK_STATUS_CHANGED,
    linkType: 'task',
    linkId: task.id,
    metadata: {
      status: status || task.status,
      due_date: task.due_date
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.TASK_STATUS_CHANGED, task.id, status || task.status])
  });
};

const notifyTaskDeadline = async ({ taskId, type, title, body, uniqueSuffix, metadata = {} }) => {
  if (!taskId) return;
  const task = await fetchSingleRow(
    `SELECT t.id, t.title, t.status, t.due_date, t.assigned_to, t.assigned_by, t.branch_id
     FROM tasks t WHERE t.id = ?`,
    [taskId]
  );

  if (!task) return;

  if (!task.due_date) return;

  const recipients = getUniqueRecipientIds([
    await getUsersByIds(toArray(task.assigned_to)),
    await getUsersByIds(toArray(task.assigned_by)),
    await getBranchManagers(task.branch_id)
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title,
    body,
    type,
    linkType: 'task',
    linkId: task.id,
    metadata: {
      status: task.status,
      due_date: task.due_date,
      ...metadata
    },
    recipients,
    uniqueKey: buildUniqueKey([type, task.id, uniqueSuffix])
  });
};

const notifyTaskDueSoon = ({ taskId, daysRemaining }) =>
  notifyTaskDeadline({
    taskId,
    type: EVENT_TYPES.TASK_DUE_SOON,
    title: 'Công việc sắp tới hạn',
    body: `Công việc chỉ còn ${daysRemaining} ngày tới hạn.`,
    uniqueSuffix: `due-${daysRemaining}`,
    metadata: { days_remaining: daysRemaining }
  });

const notifyTaskOverdue = ({ taskId, daysOverdue }) =>
  notifyTaskDeadline({
    taskId,
    type: EVENT_TYPES.TASK_OVERDUE,
    title: 'Công việc quá hạn',
    body: `Công việc đã quá hạn ${daysOverdue} ngày.`,
    uniqueSuffix: `overdue-${daysOverdue}`,
    metadata: { days_overdue: daysOverdue }
  });

const notifyAssetStatusChanged = async ({ assetId, status }) => {
  if (!assetId) return;
  const asset = await fetchSingleRow(
    `SELECT id, name, status, branch_id FROM assets WHERE id = ?`,
    [assetId]
  );
  if (!asset) return;

  const recipients = getUniqueRecipientIds([
    await getBranchManagers(asset.branch_id),
    await getBranchStaff(asset.branch_id)
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Cập nhật tình trạng tài sản',
    body: `Tài sản ${asset.name} hiện có trạng thái ${status || asset.status}.`,
    type: EVENT_TYPES.ASSET_STATUS_CHANGED,
    linkType: 'asset',
    linkId: asset.id,
    metadata: {
      status: status || asset.status
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.ASSET_STATUS_CHANGED, asset.id, status || asset.status])
  });
};

const notifyRoomVacantLong = async ({ roomId, branchId, roomNumber, daysVacant, threshold }) => {
  if (!roomId || typeof threshold !== 'number') return;

  let room = { id: roomId, branch_id: branchId, room_number: roomNumber };
  if (!room.branch_id || !room.room_number) {
    const dbRoom = await fetchSingleRow(
      `SELECT id, branch_id, room_number FROM rooms WHERE id = ?`,
      [roomId]
    );
    if (!dbRoom) return;
    room = dbRoom;
  }

  const recipients = getUniqueRecipientIds([
    await getBranchManagers(room.branch_id),
    await getBranchStaff(room.branch_id),
    await getAdmins()
  ]);

  if (recipients.length === 0) return;

  await createNotification({
    title: 'Phòng trống quá lâu',
    body: `Phòng ${room.room_number || ''} đã trống ${daysVacant} ngày.`,
    type: EVENT_TYPES.ROOM_VACANT_LONG,
    linkType: 'room',
    linkId: room.id,
    metadata: {
      days_vacant: daysVacant,
      threshold,
      branch_id: room.branch_id
    },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.ROOM_VACANT_LONG, room.id, threshold])
  });
};

const notifyUserCreated = async ({ userId }) => {
  if (!userId) return;
  const user = await fetchSingleRow(
    `SELECT id, full_name FROM users WHERE id = ?`,
    [userId]
  );
  if (!user) return;

  const recipients = await getAdmins();
  if (recipients.length === 0) return;

  await createNotification({
    title: 'Tài khoản nhân viên mới',
    body: `Nhân viên ${user.full_name || ''} vừa được tạo.`,
    type: EVENT_TYPES.USER_CREATED,
    linkType: 'user',
    linkId: user.id,
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.USER_CREATED, user.id])
  });
};

const notifyUserStatusChanged = async ({ userId, status }) => {
  if (!userId) return;
  const user = await fetchSingleRow(
    `SELECT id, full_name FROM users WHERE id = ?`,
    [userId]
  );
  if (!user) return;

  const recipients = await getAdmins();
  if (recipients.length === 0) return;

  await createNotification({
    title: 'Trạng thái nhân viên thay đổi',
    body: `Nhân viên ${user.full_name || ''} đã chuyển trạng thái ${status}.`,
    type: EVENT_TYPES.USER_STATUS_CHANGED,
    linkType: 'user',
    linkId: user.id,
    metadata: { status },
    recipients,
    uniqueKey: buildUniqueKey([EVENT_TYPES.USER_STATUS_CHANGED, user.id, status])
  });
};

module.exports = {
  EVENT_TYPES,
  notifyContractCreated,
  notifyContractEnded,
  notifyContractExpiring,
  notifyTenantCreated,
  notifyTenantAssignedToRoom,
  notifyInvoiceCreated,
  notifyInvoiceDueSoon,
  notifyInvoiceOverdue,
  notifyTransactionCreated,
  notifyTransactionUpdated,
  notifyAccountLowBalance,
  notifyTaskAssigned,
  notifyTaskStatusChanged,
  notifyTaskDueSoon,
  notifyTaskOverdue,
  notifyAssetStatusChanged,
  notifyRoomVacantLong,
  notifyUserCreated,
  notifyUserStatusChanged,
  notifyMeterReadingMissing,
  notifyMeterReadingAnomaly
};

