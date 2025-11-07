const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all images with location info
router.get('/', (req, res) => {
  const db = getDb();
  const { room_id, branch_id, location_type } = req.query;
  
  let query = `
    SELECT i.*, 
           r.room_number, r.branch_id as room_branch_id,
           b.name as branch_name,
           br.name as room_branch_name
    FROM images i
    LEFT JOIN rooms r ON i.room_id = r.id
    LEFT JOIN branches b ON i.branch_id = b.id
    LEFT JOIN branches br ON r.branch_id = br.id
    WHERE 1=1
  `;
  const params = [];

  if (room_id) {
    query += ' AND i.room_id = ?';
    params.push(room_id);
  }
  if (branch_id) {
    query += ' AND i.branch_id = ?';
    params.push(branch_id);
  }
  if (location_type) {
    query += ' AND i.location_type = ?';
    params.push(location_type);
  }

  query += ' ORDER BY i.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single image
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(
    `SELECT i.*, 
            r.room_number, r.branch_id as room_branch_id,
            b.name as branch_name,
            br.name as room_branch_name
     FROM images i
     LEFT JOIN rooms r ON i.room_id = r.id
     LEFT JOIN branches b ON i.branch_id = b.id
     LEFT JOIN branches br ON r.branch_id = br.id
     WHERE i.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Image not found' });
      }
      res.json(row);
    }
  );
});

// Create image
router.post('/', (req, res) => {
  const {
    name, description, image_url, location_type, room_id, branch_id
  } = req.body;
  const db = getDb();

  // Validate location_type
  if (location_type === 'room' && !room_id) {
    return res.status(400).json({ error: 'room_id is required when location_type is room' });
  }
  if (location_type === 'branch' && !branch_id) {
    return res.status(400).json({ error: 'branch_id is required when location_type is branch' });
  }
  if (!image_url) {
    return res.status(400).json({ error: 'image_url is required' });
  }

  db.run(
    `INSERT INTO images (
      name, description, image_url, location_type, room_id, branch_id
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name, description || null, image_url, location_type,
      room_id || null, branch_id || null
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update image
router.put('/:id', (req, res) => {
  const {
    name, description, image_url, location_type, room_id, branch_id
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
    `UPDATE images SET
      name = ?, description = ?, image_url = ?, location_type = ?, room_id = ?, branch_id = ?
    WHERE id = ?`,
    [
      name, description || null, image_url, location_type,
      room_id || null, branch_id || null,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }
      res.json({ message: 'Image updated successfully' });
    }
  );
});

// Delete image
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM images WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ message: 'Image deleted successfully' });
  });
});

module.exports = router;

