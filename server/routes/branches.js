const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all branches
router.get('/', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const { status } = req.query;
  let query = 'SELECT * FROM branches WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  console.log('Fetching branches with query:', query, 'params:', params);
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching branches:', err);
      console.error('Error details:', err.message);
      if (err.stack) {
        console.error('Error stack:', err.stack);
      }
      return res.status(500).json({ error: err.message || 'Database query error' });
    }
    console.log(`Successfully fetched ${rows?.length || 0} branches`);
    res.json(rows || []);
  });
});

// Get single branch
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }

    db.get(
      `SELECT b.*, 
              a.name as account_name, a.account_number, a.account_holder, 
              a.bank_name, a.bank_branch, a.qr_code as account_qr_code
       FROM branches b
       LEFT JOIN accounts a ON b.account_id = a.id
       WHERE b.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) {
          console.error('Error fetching branch:', err);
          console.error('Error details:', err.message, err.stack);
          return res.status(500).json({ error: err.message || 'Database query error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Branch not found' });
        }

      // Get related images
      db.all(
        `SELECT * FROM images WHERE branch_id = ? ORDER BY created_at DESC`,
        [req.params.id],
        (err, images) => {
          if (err) {
            console.error('Error fetching branch images:', err);
          }

          // Get related assets
          db.all(
            `SELECT * FROM assets WHERE branch_id = ? ORDER BY created_at DESC`,
            [req.params.id],
            (err, assets) => {
              if (err) {
                console.error('Error fetching branch assets:', err);
              }
              res.json({ 
                ...row, 
                images: images || [], 
                assets: assets || [] 
              });
            }
          );
        }
      );
    }
  );
  } catch (error) {
    console.error('Error in branches route:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Create branch
router.post('/', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const {
    name, address, phone, manager_name, status,
    representative_name, representative_position, representative_id_card,
    representative_address, representative_phone,
    account_id, qr_code
  } = req.body;

  db.run(
    `INSERT INTO branches (
      name, address, phone, manager_name, status,
      representative_name, representative_position, representative_id_card,
      representative_address, representative_phone,
      account_id, qr_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, address, phone, manager_name, status || 'active',
      representative_name, representative_position, representative_id_card,
      representative_address, representative_phone,
      account_id || null, qr_code || null
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update branch
router.put('/:id', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const {
    name, address, phone, manager_name, status,
    representative_name, representative_position, representative_id_card,
    representative_address, representative_phone,
    account_id, qr_code
  } = req.body;

  db.run(
    `UPDATE branches SET 
      name = ?, address = ?, phone = ?, manager_name = ?, status = ?,
      representative_name = ?, representative_position = ?, representative_id_card = ?,
      representative_address = ?, representative_phone = ?,
      account_id = ?, qr_code = ?
    WHERE id = ?`,
    [
      name, address, phone, manager_name, status,
      representative_name, representative_position, representative_id_card,
      representative_address, representative_phone,
      account_id || null, qr_code || null,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json({ message: 'Branch updated successfully' });
    }
  );
});

// Delete branch
router.delete('/:id', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
  db.run('DELETE FROM branches WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch deleted successfully' });
  });
});

module.exports = router;

