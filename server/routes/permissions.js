const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const router = express.Router();

router.use(authenticateToken);

const DEFAULT_MODULES = [
  { code: 'dashboard', name: 'Tổng quan', actions: ['view'] },
  { code: 'branches', name: 'Chi nhánh', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'rooms', name: 'Phòng trọ', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'assets', name: 'Tài sản', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'images', name: 'Hình ảnh', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'services', name: 'Dịch vụ', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'meter-readings', name: 'Sổ ghi dịch vụ', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'tenants', name: 'Khách thuê', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'vehicles', name: 'Phương tiện', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'contracts', name: 'Hợp đồng', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'invoices', name: 'Hóa đơn', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'accounts', name: 'Tài khoản', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'transactions', name: 'Sổ thu chi', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'financial-categories', name: 'Danh mục tài chính', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'users', name: 'Nhân viên', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'roles', name: 'Vai trò', actions: ['view', 'create', 'update', 'delete'] },
  { code: 'permissions', name: 'Phân quyền', actions: ['view', 'update'] },
  { code: 'settings', name: 'Thiết lập', actions: ['view', 'update'] },
];

const ACTION_METADATA = {
  view: {
    action_name: 'Xem',
    description: 'Quyền xem danh sách và chi tiết',
  },
  create: {
    action_name: 'Thêm',
    description: 'Quyền tạo bản ghi mới',
  },
  update: {
    action_name: 'Sửa',
    description: 'Quyền cập nhật bản ghi',
  },
  delete: {
    action_name: 'Xóa',
    description: 'Quyền xóa bản ghi',
  },
};

const ROLE_PERMISSION_PRESETS = {
  admin: 'ALL',
  manager: [
    'branches',
    'rooms',
    'assets',
    'images',
    'services',
    'meter-readings',
    'tenants',
    'vehicles',
    'contracts',
    'invoices',
    'accounts',
    'transactions',
    'financial-categories',
    'dashboard',
  ],
  user: [
    'dashboard',
    'tenants',
    'contracts',
    'invoices',
  ],
};

const ensureDefaultPermissions = (db) => {
  return new Promise((resolve, reject) => {
    const statements = [];

    DEFAULT_MODULES.forEach((module) => {
      module.actions.forEach((action) => {
        const meta = ACTION_METADATA[action] || {
          action_name: action.charAt(0).toUpperCase() + action.slice(1),
          description: null,
        };

        statements.push({
          sql: `INSERT OR IGNORE INTO permissions (module_code, module_name, action, action_name, description, status)
                VALUES (?, ?, ?, ?, ?, 'active')`,
          params: [module.code, module.name, action, meta.action_name, meta.description],
        });
      });
    });

    if (statements.length === 0) {
      resolve();
      return;
    }

    let completed = 0;
    let hasError = false;

    statements.forEach(({ sql, params }) => {
      db.run(sql, params, (err) => {
        if (hasError) return;
        if (err) {
          hasError = true;
          reject(err);
          return;
        }
        completed += 1;
        if (completed === statements.length) {
          resolve();
        }
      });
    });
  });
};

const ensureSampleRolePermissions = (db) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, code FROM roles', [], (err, roles) => {
      if (err) return reject(err);
      if (!roles || roles.length === 0) return resolve();

      db.all('SELECT id, module_code FROM permissions WHERE status = ? ORDER BY module_code', ['active'], (err, permissions) => {
        if (err) return reject(err);
        if (!permissions || permissions.length === 0) return resolve();

        const moduleToPermissionIds = permissions.reduce((map, perm) => {
          if (!map[perm.module_code]) {
            map[perm.module_code] = [];
          }
          map[perm.module_code].push(perm.id);
          return map;
        }, {});

        const allPermissionIds = permissions.map((perm) => perm.id);

        const assignments = roles
          .filter((role) => ROLE_PERMISSION_PRESETS[role.code])
          .map((role) => {
            return new Promise((resolveRole, rejectRole) => {
              db.get('SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ?', [role.id], (err, row) => {
                if (err) return rejectRole(err);
                if (row.count > 0) return resolveRole();

                let targetPermissionIds;
                const preset = ROLE_PERMISSION_PRESETS[role.code];
                if (preset === 'ALL') {
                  targetPermissionIds = allPermissionIds;
                } else {
                  const modules = Array.isArray(preset) ? preset : [];
                  const set = new Set();
                  modules.forEach((moduleCode) => {
                    const ids = moduleToPermissionIds[moduleCode];
                    if (ids && ids.length) {
                      ids.forEach((id) => set.add(id));
                    }
                  });
                  // Always ensure dashboard view is available for presets
                  if (moduleToPermissionIds.dashboard) {
                    moduleToPermissionIds.dashboard.forEach((id) => set.add(id));
                  }
                  targetPermissionIds = Array.from(set);
                }

                if (targetPermissionIds.length === 0) {
                  return resolveRole();
                }

                const stmt = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
                let completed = 0;
                targetPermissionIds.forEach((permissionId) => {
                  stmt.run(role.id, permissionId, (err) => {
                    if (err) {
                      console.error('Error inserting sample role permission:', err);
                    }
                    completed += 1;
                    if (completed === targetPermissionIds.length) {
                      stmt.finalize((finalizeErr) => {
                        if (finalizeErr) {
                          console.error('Error finalizing role permission statement:', finalizeErr);
                        }
                        resolveRole();
                      });
                    }
                  });
                });
              });
            });
          });

        Promise.all(assignments)
          .then(() => resolve())
          .catch((assignErr) => reject(assignErr));
      });
    });
  });
};

// Get all permissions grouped by module
router.get('/', async (req, res) => {
  const db = getDb();
  try {
    await ensureDefaultPermissions(db);
    await ensureSampleRolePermissions(db);
  } catch (error) {
    console.error('Error ensuring default permissions:', error);
    return res.status(500).json({ error: 'Không thể chuẩn hóa phân quyền mặc định' });
  }

  db.all(
    `SELECT * FROM permissions WHERE status = 'active' ORDER BY module_code, action`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Group by module
      const grouped = {};
      rows.forEach(perm => {
        if (!grouped[perm.module_code]) {
          grouped[perm.module_code] = {
            module_code: perm.module_code,
            module_name: perm.module_name,
            permissions: []
          };
        }
        grouped[perm.module_code].permissions.push(perm);
      });
      
      res.json(Object.values(grouped));
    }
  );
});

// Get permissions for a specific role
router.get('/role/:roleId', async (req, res) => {
  const db = getDb();
  const roleId = req.params.roleId;
  
  try {
    await ensureDefaultPermissions(db);
    await ensureSampleRolePermissions(db);
  } catch (error) {
    console.error('Error ensuring default permissions:', error);
    return res.status(500).json({ error: 'Không thể chuẩn hóa phân quyền mặc định' });
  }

  // Get all permissions
  db.all(
    `SELECT * FROM permissions WHERE status = 'active' ORDER BY module_code, action`,
    [],
    (err, allPermissions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get role permissions
      db.all(
        `SELECT permission_id FROM role_permissions WHERE role_id = ?`,
        [roleId],
        (err, rolePerms) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          const rolePermissionIds = rolePerms.map(rp => rp.permission_id);
          
          // Mark which permissions are assigned to this role
          const permissions = allPermissions.map(perm => ({
            ...perm,
            assigned: rolePermissionIds.includes(perm.id)
          }));
          
          // Group by module
          const grouped = {};
          permissions.forEach(perm => {
            if (!grouped[perm.module_code]) {
              grouped[perm.module_code] = {
                module_code: perm.module_code,
                module_name: perm.module_name,
                permissions: []
              };
            }
            grouped[perm.module_code].permissions.push(perm);
          });
          
          res.json(Object.values(grouped));
        }
      );
    }
  );
});

// Update permissions for a role
router.put('/role/:roleId', checkPermission('roles', 'update'), (req, res) => {
  const db = getDb();
  const roleId = req.params.roleId;
  const { permission_ids } = req.body;
  
  if (!Array.isArray(permission_ids)) {
    return res.status(400).json({ error: 'permission_ids must be an array' });
  }
  
  // Delete existing role permissions
  db.run(
    'DELETE FROM role_permissions WHERE role_id = ?',
    [roleId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Insert new role permissions
      if (permission_ids.length > 0) {
        const stmt = db.prepare(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
        );
        
        let completed = 0;
        permission_ids.forEach(permissionId => {
          stmt.run(roleId, permissionId, (err) => {
            if (err) {
              console.error('Error inserting role permission:', err);
            }
            completed++;
            if (completed === permission_ids.length) {
              stmt.finalize(() => {
                res.json({ message: 'Phân quyền đã được cập nhật thành công' });
              });
            }
          });
        });
      } else {
        res.json({ message: 'Phân quyền đã được cập nhật thành công' });
      }
    }
  );
});

// Get all modules with their available actions
router.get('/modules', async (req, res) => {
  const db = getDb();

  try {
    await ensureDefaultPermissions(db);
    await ensureSampleRolePermissions(db);
  } catch (error) {
    console.error('Error ensuring default permissions:', error);
    return res.status(500).json({ error: 'Không thể chuẩn hóa phân quyền mặc định' });
  }

  db.all(
    `SELECT DISTINCT module_code, module_name FROM permissions WHERE status = 'active' ORDER BY module_code`,
    [],
    (err, modules) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get actions for each module
      const modulesWithActions = modules.map(module => {
        return new Promise((resolve) => {
          db.all(
            `SELECT id, action, action_name, description FROM permissions 
             WHERE module_code = ? AND status = 'active' 
             ORDER BY CASE action 
               WHEN 'view' THEN 1 
               WHEN 'create' THEN 2 
               WHEN 'update' THEN 3 
               WHEN 'delete' THEN 4 
               ELSE 5 
             END, action`,
            [module.module_code],
            (err, actions) => {
              if (err) {
                resolve({ ...module, actions: [] });
              } else {
                resolve({ ...module, actions });
              }
            }
          );
        });
      });
      
      Promise.all(modulesWithActions).then(results => {
        res.json(results);
      });
    }
  );
});

module.exports = router;

