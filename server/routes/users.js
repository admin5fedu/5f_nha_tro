const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const {
  notifyUserCreated,
  notifyUserStatusChanged
} = require('../utils/notificationEvents');
const { syncFirebaseAuthUser } = require('../utils/firebaseAuthSync');
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

  const defaultBranchId = await ensureDefaultBranch(db);

  for (const user of SAMPLE_USERS) {
    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO users (username, full_name, email, phone, address, role, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)` ,
          [
            user.username,
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
          `INSERT OR IGNORE INTO users (username, full_name, role)
           VALUES (?, ?, ?)` ,
          [user.username, user.full_name, user.role]
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
    const plainPassword = password && password.trim() !== '' ? password.trim() : undefined;

    db.run(
      `INSERT INTO users (username, full_name, email, phone, address, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, full_name, email || null, phone || null, address || null, role, status],
      async function(err) {
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

        await syncFirebaseAuthUser({
          userId,
          fullName: full_name,
          email: email || null,
          role,
          status,
          password: plainPassword,
          existingEmail: null
        });

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

    const plainPassword = password && password.trim() !== '' ? password.trim() : undefined;

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(updateQuery, params, async function(err) {
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

      await syncFirebaseAuthUser({
        userId: req.params.id,
        fullName: full_name,
        email: email || null,
        role,
        status,
        password: plainPassword,
        existingEmail: existingUser.email || null
      });

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

// Password update endpoint is deprecated because passwords are managed by Firebase Auth
router.put('/:id/password', async (req, res) => {
  return res.status(410).json({ error: 'Chức năng cập nhật mật khẩu đã được chuyển sang Firebase Authentication.' });
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

