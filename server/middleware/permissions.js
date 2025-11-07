const { getDb } = require('../database/db');

// Check if user has permission for a module and action
const checkPermission = (moduleCode, action) => {
  return async (req, res, next) => {
    try {
      // Admin always has all permissions
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
      }

      const db = getDb();

      // Get user's role from database to get role_id
      db.get(
        'SELECT id FROM roles WHERE code = ?',
        [req.user.role],
        (err, role) => {
          if (err) {
            console.error('Error fetching role:', err);
            return res.status(500).json({ error: 'Lỗi kiểm tra quyền' });
          }

          if (!role) {
            return res.status(403).json({ error: 'Vai trò không hợp lệ' });
          }

          // Check if role has permission
          db.get(
            `SELECT COUNT(*) as count 
             FROM role_permissions rp
             JOIN permissions p ON rp.permission_id = p.id
             WHERE rp.role_id = ? AND p.module_code = ? AND p.action = ? AND p.status = 'active'`,
            [role.id, moduleCode, action],
            (err, row) => {
              if (err) {
                console.error('Error checking permission:', err);
                return res.status(500).json({ error: 'Lỗi kiểm tra quyền' });
              }

              // Also check if role has '*' permission (all permissions)
              if (row.count === 0) {
                // Check if role has all permissions via permissions field
                db.get(
                  'SELECT permissions FROM roles WHERE id = ?',
                  [role.id],
                  (err, roleRow) => {
                    if (err) {
                      return res.status(500).json({ error: 'Lỗi kiểm tra quyền' });
                    }

                    if (roleRow && roleRow.permissions) {
                      const permissions = JSON.parse(roleRow.permissions);
                      if (permissions.includes('*') || permissions.includes(moduleCode)) {
                        return next();
                      }
                    }

                    return res.status(403).json({ 
                      error: `Bạn không có quyền ${action} ${moduleCode}` 
                    });
                  }
                );
              } else {
                return next();
              }
            }
          );
        }
      );
    } catch (error) {
      console.error('Error in checkPermission middleware:', error);
      return res.status(500).json({ error: 'Lỗi kiểm tra quyền' });
    }
  };
};

// Helper function to check if user has permission (for use in routes)
const hasPermission = async (userId, moduleCode, action) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    // Get user's role
    db.get(
      'SELECT role FROM users WHERE id = ?',
      [userId],
      (err, user) => {
        if (err || !user) {
          return resolve(false);
        }

        // Admin always has all permissions
        if (user.role === 'admin') {
          return resolve(true);
        }

        // Get role_id
        db.get(
          'SELECT id, permissions FROM roles WHERE code = ?',
          [user.role],
          (err, role) => {
            if (err || !role) {
              return resolve(false);
            }

            // Check if role has '*' permission
            if (role.permissions) {
              const permissions = JSON.parse(role.permissions);
              if (permissions.includes('*') || permissions.includes(moduleCode)) {
                return resolve(true);
              }
            }

            // Check role_permissions table
            db.get(
              `SELECT COUNT(*) as count 
               FROM role_permissions rp
               JOIN permissions p ON rp.permission_id = p.id
               WHERE rp.role_id = ? AND p.module_code = ? AND p.action = ? AND p.status = 'active'`,
              [role.id, moduleCode, action],
              (err, row) => {
                if (err) {
                  return resolve(false);
                }
                resolve(row.count > 0);
              }
            );
          }
        );
      }
    );
  });
};

module.exports = { checkPermission, hasPermission };

