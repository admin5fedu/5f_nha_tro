const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { notifyAssetStatusChanged } = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

// Get all assets with location info
router.get('/', (req, res) => {
  const db = getDb();
  const { room_id, branch_id, status, type, location_type } = req.query;
  
  let query = `
    SELECT a.*, 
           r.room_number, r.branch_id as room_branch_id,
           b.name as branch_name,
           br.name as room_branch_name
    FROM assets a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN branches b ON a.branch_id = b.id
    LEFT JOIN branches br ON r.branch_id = br.id
    WHERE 1=1
  `;
  const params = [];

  if (room_id) {
    query += ' AND a.room_id = ?';
    params.push(room_id);
  }
  if (branch_id) {
    query += ' AND a.branch_id = ?';
    params.push(branch_id);
  }
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }
  if (location_type) {
    query += ' AND a.location_type = ?';
    params.push(location_type);
  }

  query += ' ORDER BY a.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single asset
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(
    `SELECT a.*, 
            r.room_number, r.branch_id as room_branch_id,
            b.name as branch_name,
            br.name as room_branch_name
     FROM assets a
     LEFT JOIN rooms r ON a.room_id = r.id
     LEFT JOIN branches b ON a.branch_id = b.id
     LEFT JOIN branches br ON r.branch_id = br.id
     WHERE a.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      res.json(row);
    }
  );
});

// Create asset
router.post('/', (req, res) => {
  const {
    name, type, description, value, status, purchase_date,
    location_type, room_id, branch_id,
    serial_number, manufacturer, model, warranty_expiry, notes
  } = req.body;
  const db = getDb();

  // Validate location_type
  if (location_type === 'room' && !room_id) {
    return res.status(400).json({ error: 'room_id is required when location_type is room' });
  }
  if (location_type === 'branch' && !branch_id) {
    return res.status(400).json({ error: 'branch_id is required when location_type is branch' });
  }

  db.run(
    `INSERT INTO assets (
      name, type, description, value, status, purchase_date,
      location_type, room_id, branch_id,
      serial_number, manufacturer, model, warranty_expiry, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, type, description || null, value || 0, status || 'good', purchase_date || null,
      location_type, room_id || null, branch_id || null,
      serial_number || null, manufacturer || null, model || null, warranty_expiry || null, notes || null
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });

      if (status && status !== 'good') {
        notifyAssetStatusChanged({ assetId: this.lastID, status }).catch((error) => {
          console.error('Error sending asset notification:', error);
        });
      }
    }
  );
});

// Update asset
router.put('/:id', (req, res) => {
  const {
    name, type, description, value, status, purchase_date,
    location_type, room_id, branch_id,
    serial_number, manufacturer, model, warranty_expiry, notes
  } = req.body;
  const db = getDb();

  // Validate location_type
  if (location_type === 'room' && !room_id) {
    return res.status(400).json({ error: 'room_id is required when location_type is room' });
  }
  if (location_type === 'branch' && !branch_id) {
    return res.status(400).json({ error: 'branch_id is required when location_type is branch' });
  }

  db.run(
    `UPDATE assets SET
      name = ?, type = ?, description = ?, value = ?, status = ?, purchase_date = ?,
      location_type = ?, room_id = ?, branch_id = ?,
      serial_number = ?, manufacturer = ?, model = ?, warranty_expiry = ?, notes = ?
    WHERE id = ?`,
    [
      name, type, description || null, value || 0, status, purchase_date || null,
      location_type, room_id || null, branch_id || null,
      serial_number || null, manufacturer || null, model || null, warranty_expiry || null, notes || null,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      res.json({ message: 'Asset updated successfully' });

      if (status) {
        notifyAssetStatusChanged({ assetId: req.params.id, status }).catch((error) => {
          console.error('Error sending asset notification:', error);
        });
      }
    }
  );
});

// Delete asset
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM assets WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  });
});

module.exports = router;

