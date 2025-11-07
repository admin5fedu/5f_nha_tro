const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  notifyUserCreated,
  notifyUserStatusChanged
} = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

const SAMPLE_USERS = [
  {
    username: 'quanly',
    full_name: 'Trần Thị Quản Lý',
    email: 'quanly@nhatroanbinh.vn',
    phone: '0901 234 567',
    address: 'Tầng 5, tòa nhà A, 123 Đường Hoa Cúc, Quận Phú Nhuận',
    role: 'manager',
    status: 'active'
  },
  {
    username: 'ketoan',
    full_name: 'Nguyễn Văn Kế Toán',
    email: 'ketoan@nhatroanbinh.vn',
    phone: '0908 765 432',
    address: '25 Nguyễn Văn Trỗi, Quận Phú Nhuận',
    role: 'accountant',
    status: 'active'
  },
  {
    username: 'chamsoc',
    full_name: 'Lê Ngọc Chăm Sóc',
    email: 'chamsoc@nhatroanbinh.vn',
    phone: '0912 345 678',
    address: '68 Cộng Hòa, Quận Tân Bình',
    role: 'staff',
    status: 'active'
  }
];

const runInsert = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
  });

const getSingleRow = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row || null);
    });
  });

const ensureDefaultBranch = async (db) => {
  const existing = await getSingleRow(db, 'SELECT id FROM branches ORDER BY id LIMIT 1');
  if (existing?.id) {
    return existing.id;
  }

  try {
    const branchId = await runInsert(
      db,
      `INSERT INTO branches (name, address, phone, manager_name, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [
        'Chi nhánh Trung tâm Nguyễn Văn Trỗi',
        '123 Nguyễn Văn Trỗi, Phường 12, Quận Phú Nhuận, TP. Hồ Chí Minh',
        '028 3939 0000',
        'Trần Thị Quản Lý'
      ]
    );
    return branchId;
  } catch (error) {
    if (error?.message?.includes('no such column') || error?.message?.includes('no column named')) {
      const fallbackId = await runInsert(
        db,
        `INSERT INTO branches (name, address, phone, status)
         VALUES (?, ?, ?, 'active')`,
        [
          'Chi nhánh Trung tâm Nguyễn Văn Trỗi',
          '123 Nguyễn Văn Trỗi, Phường 12, Quận Phú Nhuận, TP. Hồ Chí Minh',
          '028 3939 0000'
        ]
      );
      return fallbackId;
    }
    throw error;
  }
};

const assignUserToBranch = (db, userId, branchId) => {
  return new Promise((resolve, reject) => {
    if (!userId || !branchId) {
      return resolve();
    }
    db.run(
      'INSERT OR IGNORE INTO user_branches (user_id, branch_id) VALUES (?, ?)',
      [userId, branchId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

const ensureSampleUsers = async (db) => {
  const nonAdminCount = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users WHERE username != ?', ['admin'], (err, row) => {
      if (err) return reject(err);
      resolve(row?.count || 0);
    });
  });

  if (nonAdminCount > 0) {
    return;
  }

  const hashedPassword = await bcrypt.hash('1', 10);
  const defaultBranchId = await ensureDefaultBranch(db);

  for (const user of SAMPLE_USERS) {
    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO users (username, password, full_name, email, phone, address, role, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,
          [
            user.username,
            hashedPassword,
            user.full_name,
            user.email,
            user.phone,
            user.address,
            user.role,
            user.status
          ],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    } catch (error) {
      if (error?.message?.includes('no such column') || error?.message?.includes('no column named')) {
        await runInsert(
          db,
          `INSERT OR IGNORE INTO users (username, password, full_name, role)
           VALUES (?, ?, ?, ?)` ,
          [user.username, hashedPassword, user.full_name, user.role]
        );
      } else {
        throw error;
      }
    }

    const userRow = await getSingleRow(db, 'SELECT id FROM users WHERE username = ?', [user.username]);

    if (userRow && userRow.id) {
      const targetBranches = user.branchIds && user.branchIds.length ? user.branchIds : [defaultBranchId];
      for (const branchId of targetBranches.filter(Boolean)) {
        await assignUserToBranch(db, userRow.id, branchId);
      }
    }
  }
};

// Get all users
router.get('/', async (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
    await ensureSampleUsers(db);
  } catch (error) {
    console.error('Error getting database:', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const query = `
    SELECT u.*, 
           GROUP_CONCAT(ub.branch_id) as branch_ids,
           GROUP_CONCAT(b.name) as branch_names
    FROM users u
    LEFT JOIN user_branches ub ON u.id = ub.user_id
    LEFT JOIN branches b ON ub.branch_id = b.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  
  console.log('Fetching users with query:', query);
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      console.error('Error details:', err.message);
      if (err.stack) {
        console.error('Error stack:', err.stack);
      }
      return res.status(500).json({ error: err.message || 'Database query error' });
    }
    console.log(`Successfully fetched ${rows?.length || 0} users`);
    // Format branch_ids and branch_names
    const formattedRows = (rows || []).map(row => ({
      ...row,
      branch_ids: row.branch_ids ? row.branch_ids.split(',').map(Number) : [],
      branch_names: row.branch_names ? row.branch_names.split(',') : []
    }));
    res.json(formattedRows);
  });
});

// Get single user
router.get('/:id', async (req, res) => {
  const db = getDb();
  try {
    await ensureSampleUsers(db);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  const query = `
    SELECT u.*, 
           GROUP_CONCAT(ub.branch_id) as branch_ids,
           GROUP_CONCAT(b.name) as branch_names
    FROM users u
    LEFT JOIN user_branches ub ON u.id = ub.user_id
    LEFT JOIN branches b ON ub.branch_id = b.id
    WHERE u.id = ?
    GROUP BY u.id
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    const formattedRow = {
      ...row,
      branch_ids: row.branch_ids ? row.branch_ids.split(',').map(Number) : [],
      branch_names: row.branch_names ? row.branch_names.split(',') : []
    };
    res.json(formattedRow);
  });
});

// Create user
router.post('/', async (req, res) => {
  const { username, password, full_name, email, phone, address, role, status, branch_ids } = req.body;
  const db = getDb();

  if (!username || !full_name) {
    return res.status(400).json({ error: 'Username and full_name are required' });
  }

  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    // Hash password
    const plainPassword = password && password.trim() !== '' ? password : '1';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert user
    db.run(
      `INSERT INTO users (username, password, full_name, email, phone, address, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, full_name, email || null, phone || null, address || null, role, status],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        const userId = this.lastID;

        // Insert user-branch relationships
        if (branch_ids && branch_ids.length > 0) {
          const stmt = db.prepare('INSERT INTO user_branches (user_id, branch_id) VALUES (?, ?)');
          branch_ids.forEach(branchId => {
            stmt.run(userId, branchId);
          });
          stmt.finalize();
        }

        res.json({ id: userId, ...req.body, password: undefined });

        notifyUserCreated({ userId }).catch((error) => {
          console.error('Error sending user notification:', error);
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  const { username, password, full_name, email, phone, address, role, status, branch_ids } = req.body;
  const db = getDb();

  try {
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updateQuery = `UPDATE users SET full_name = ?, email = ?, phone = ?, address = ?, role = ?, status = ?`;
    let params = [full_name, email || null, phone || null, address || null, role, status];

    // Update username if provided
    if (username) {
      updateQuery += ', username = ?';
      params.push(username);
    }

    // Update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(updateQuery, params, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user-branch relationships
      if (branch_ids !== undefined) {
        // Delete existing relationships
        db.run('DELETE FROM user_branches WHERE user_id = ?', [req.params.id], () => {
          // Insert new relationships
          if (branch_ids && branch_ids.length > 0) {
            const stmt = db.prepare('INSERT INTO user_branches (user_id, branch_id) VALUES (?, ?)');
            branch_ids.forEach(branchId => {
              stmt.run(req.params.id, branchId);
            });
            stmt.finalize();
          }
        });
      }

      res.json({ message: 'User updated successfully' });

      if (status && status !== existingUser.status) {
        notifyUserStatusChanged({ userId: req.params.id, status }).catch((error) => {
          console.error('Error sending user status notification:', error);
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Self service password update
router.put('/:id/password', async (req, res) => {
  const { current_password, new_password } = req.body;
  const requestedId = parseInt(req.params.id, 10);

  if (!Number.isInteger(requestedId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (!new_password || new_password.trim() === '') {
    return res.status(400).json({ error: 'New password is required' });
  }

  const isSelf = req.user && req.user.id === requestedId;
  const isAdmin = req.user && req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'Không có quyền thay đổi mật khẩu người dùng này' });
  }

  const db = getDb();

  db.get('SELECT password FROM users WHERE id = ?', [requestedId], async (err, userRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const storedPassword = userRow.password;

    if (isSelf || (!isSelf && !isAdmin)) {
      if (!current_password) {
        return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại' });
      }

      const isMatch = await bcrypt.compare(current_password, storedPassword || '');
      if (!isMatch) {
        return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác' });
      }
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, requestedId], function(updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }

      res.json({ message: 'Cập nhật mật khẩu thành công' });
    });
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  const db = getDb();
  
  // Prevent deleting yourself
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;

