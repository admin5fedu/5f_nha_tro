const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all services
router.get('/', (req, res) => {
  const db = getDb();
  const { status, unit, search } = req.query;
  let query = 'SELECT * FROM services WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (unit) {
    query += ' AND unit = ?';
    params.push(unit);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single service
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM services WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(row);
  });
});

// Create service
router.post('/', (req, res) => {
  const { name, unit, unit_name, description, status } = req.body;
  const db = getDb();

  if (!name || !unit || !unit_name) {
    return res.status(400).json({ error: 'name, unit, and unit_name are required' });
  }

  if (unit !== 'meter' && unit !== 'quantity') {
    return res.status(400).json({ error: 'unit must be "meter" or "quantity"' });
  }

  db.run(
    `INSERT INTO services (name, unit, unit_name, description, status)
     VALUES (?, ?, ?, ?, ?)`,
    [name, unit, unit_name, description || null, status || 'active'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update service
router.put('/:id', (req, res) => {
  const { name, unit, unit_name, description, status } = req.body;
  const db = getDb();

  if (unit && unit !== 'meter' && unit !== 'quantity') {
    return res.status(400).json({ error: 'unit must be "meter" or "quantity"' });
  }

  db.run(
    `UPDATE services SET name = ?, unit = ?, unit_name = ?, description = ?, status = ?
     WHERE id = ?`,
    [name, unit, unit_name, description || null, status || 'active', req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json({ message: 'Service updated successfully' });
    }
  );
});

// Delete service
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM services WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  });
});

module.exports = router;

