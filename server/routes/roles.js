const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all roles
router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  
  let query = 'SELECT * FROM roles WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get user count for each role
    const rolesWithUserCount = rows.map(role => {
      return new Promise((resolve) => {
        db.get(
          'SELECT COUNT(*) as count FROM users WHERE role = ?',
          [role.code],
          (err, userCount) => {
            if (err) {
              console.error('Error counting users:', err);
            }
            resolve({
              ...role,
              permissions: role.permissions ? JSON.parse(role.permissions) : [],
              user_count: userCount?.count || 0
            });
          }
        );
      });
    });
    
    Promise.all(rolesWithUserCount).then(roles => {
      res.json(roles);
    });
  });
});

// Get single role
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM roles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Get user count for this role
    db.get(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      [row.code],
      (err, userCount) => {
        if (err) {
          console.error('Error counting users:', err);
        }
        
        // Get detailed permissions from role_permissions table
        db.all(
          `SELECT p.* FROM role_permissions rp
           JOIN permissions p ON rp.permission_id = p.id
           WHERE rp.role_id = ? AND p.status = 'active'
           ORDER BY p.module_code, p.action`,
          [req.params.id],
          (err, detailedPermissions) => {
            if (err) {
              console.error('Error fetching detailed permissions:', err);
            }
            
            // Parse permissions JSON
            res.json({
              ...row,
              permissions: row.permissions ? JSON.parse(row.permissions) : [],
              user_count: userCount?.count || 0,
              detailed_permissions: detailedPermissions || []
            });
          }
        );
      }
    );
  });
});

// Create role
router.post('/', (req, res) => {
  const { name, code, description, permissions, status } = req.body;
  const db = getDb();

  if (!name || !code) {
    return res.status(400).json({ error: 'Name and code are required' });
  }

  db.run(
    `INSERT INTO roles (name, code, description, permissions, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name,
      code,
      description || null,
      permissions ? JSON.stringify(permissions) : JSON.stringify([]),
      status || 'active'
    ],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Role code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update role
router.put('/:id', (req, res) => {
  const { name, code, description, permissions, status } = req.body;
  const db = getDb();

  db.run(
    `UPDATE roles SET
      name = ?, code = ?, description = ?, permissions = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      name,
      code,
      description || null,
      permissions ? JSON.stringify(permissions) : JSON.stringify([]),
      status || 'active',
      req.params.id
    ],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Role code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json({ message: 'Role updated successfully' });
    }
  );
});

// Delete role
router.delete('/:id', (req, res) => {
  const db = getDb();

  // Check if role is being used by any user
  db.get(
    'SELECT COUNT(*) as count FROM users WHERE role = (SELECT code FROM roles WHERE id = ?)',
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row.count > 0) {
        return res.status(400).json({ 
          error: `Cannot delete role. It is being used by ${row.count} user(s)` 
        });
      }

      db.run('DELETE FROM roles WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Role not found' });
        }
        res.json({ message: 'Role deleted successfully' });
      });
    }
  );
});

module.exports = router;

