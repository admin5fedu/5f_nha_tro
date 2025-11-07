const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all vehicles
router.get('/', (req, res) => {
  const db = getDb();
  const { tenant_id, vehicle_type, search } = req.query;
  
  let query = `
    SELECT v.*, t.full_name as tenant_name, t.phone as tenant_phone
    FROM vehicles v
    LEFT JOIN tenants t ON v.tenant_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (tenant_id) {
    query += ' AND v.tenant_id = ?';
    params.push(tenant_id);
  }
  if (vehicle_type) {
    query += ' AND v.vehicle_type = ?';
    params.push(vehicle_type);
  }
  if (search) {
    query += ' AND (v.license_plate LIKE ? OR v.brand LIKE ? OR v.model LIKE ? OR t.full_name LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY v.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single vehicle
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(
    `SELECT v.*, t.full_name as tenant_name, t.phone as tenant_phone, t.email as tenant_email, t.id_card as tenant_id_card
     FROM vehicles v
     LEFT JOIN tenants t ON v.tenant_id = t.id
     WHERE v.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      res.json(row);
    }
  );
});

// Create vehicle
router.post('/', (req, res) => {
  const {
    tenant_id,
    vehicle_type,
    brand,
    model,
    license_plate,
    color,
    description,
    image_url
  } = req.body;
  const db = getDb();

  if (!tenant_id || !vehicle_type) {
    return res.status(400).json({ error: 'tenant_id and vehicle_type are required' });
  }

  db.run(
    `INSERT INTO vehicles (tenant_id, vehicle_type, brand, model, license_plate, color, description, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    , [
      tenant_id,
      vehicle_type,
      brand || null,
      model || null,
      license_plate || null,
      color || null,
      description || null,
      image_url || null
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update vehicle
router.put('/:id', (req, res) => {
  const {
    tenant_id,
    vehicle_type,
    brand,
    model,
    license_plate,
    color,
    description,
    image_url
  } = req.body;
  const db = getDb();

  if (!tenant_id || !vehicle_type) {
    return res.status(400).json({ error: 'tenant_id and vehicle_type are required' });
  }

  db.run(
    `UPDATE vehicles SET tenant_id = ?, vehicle_type = ?, brand = ?, model = ?, license_plate = ?, color = ?, description = ?, image_url = ?
     WHERE id = ?`
    , [
      tenant_id,
      vehicle_type,
      brand || null,
      model || null,
      license_plate || null,
      color || null,
      description || null,
      image_url || null,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      res.json({ message: 'Vehicle updated successfully' });
    }
  );
});

// Delete vehicle
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  });
});

module.exports = router;

