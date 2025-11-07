const { getDb } = require('../database/db');

const fetchIds = (query, params = []) => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows.map((row) => row.id));
    });
  });
};

const getUsersByRoles = async (roles = []) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [];
  }
  const placeholders = roles.map(() => '?').join(',');
  const query = `SELECT id FROM users WHERE role IN (${placeholders}) AND status = 'active'`;
  return fetchIds(query, roles);
};

const getBranchManagers = (branchId) => getBranchUsersByRoles(branchId, ['manager', 'branch_manager']);
const getBranchStaff = (branchId) => getBranchUsersByRoles(branchId, ['user', 'office_staff', 'staff', 'technician']);
const getBranchAccountants = (branchId) => getBranchUsersByRoles(branchId, ['accountant', 'finance']);
const getAccountants = () => getUsersByRoles(['accountant', 'finance']);
const getAdmins = () => getUsersByRoles(['admin', 'super_admin']);

const getBranchUsersByRoles = async (branchId, roles = []) => {
  if (!branchId || !Array.isArray(roles) || roles.length === 0) {
    return [];
  }
  const placeholders = roles.map(() => '?').join(',');
  const params = [branchId, ...roles];
  const query = `
    SELECT DISTINCT u.id
    FROM users u
    JOIN user_branches ub ON ub.user_id = u.id
    WHERE ub.branch_id = ? AND u.role IN (${placeholders}) AND u.status = 'active'
  `;
  return fetchIds(query, params);
};

const getUsersByIds = async (userIds = []) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }
  const placeholders = userIds.map(() => '?').join(',');
  const query = `SELECT id FROM users WHERE id IN (${placeholders}) AND status = 'active'`;
  return fetchIds(query, userIds);
};

const getUniqueRecipientIds = (lists) => {
  const set = new Set();
  lists.filter(Boolean).forEach((list) => {
    list.filter(Boolean).forEach((id) => set.add(id));
  });
  return Array.from(set);
};

module.exports = {
  getUsersByRoles,
  getBranchUsersByRoles,
  getUsersByIds,
  getUniqueRecipientIds,
  getBranchManagers,
  getBranchStaff,
  getBranchAccountants,
  getAccountants,
  getAdmins
};

