const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all financial categories
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, status, search } = req.query;
    
    let query = 'SELECT * FROM financial_categories WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY type, name';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching financial categories:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  } catch (error) {
    console.error('Error in financial categories route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single financial category
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM financial_categories WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Financial category not found' });
    }
    res.json(row);
  });
});

// Create financial category
router.post('/', (req, res) => {
  const { name, code, type, description, status } = req.body;
  const db = getDb();

  if (!name || !type) {
    return res.status(400).json({ error: 'name and type are required' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'type must be either "income" or "expense"' });
  }

  db.run(
    `INSERT INTO financial_categories (name, code, type, description, status)
     VALUES (?, ?, ?, ?, ?)`,
    [name, code || null, type, description || null, status || 'active'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update financial category
router.put('/:id', (req, res) => {
  const { name, code, type, description, status } = req.body;
  const db = getDb();

  if (type && type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'type must be either "income" or "expense"' });
  }

  db.run(
    `UPDATE financial_categories SET name = ?, code = ?, type = ?, description = ?, status = ?
     WHERE id = ?`,
    [name, code || null, type, description || null, status, req.params.id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Financial category not found' });
      }
      res.json({ message: 'Financial category updated successfully' });
    }
  );
});

// Delete financial category
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM financial_categories WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Financial category not found' });
    }
    res.json({ message: 'Financial category deleted successfully' });
  });
});

module.exports = router;

