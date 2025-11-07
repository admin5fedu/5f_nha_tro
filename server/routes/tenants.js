const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { notifyTenantCreated } = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

// Get all tenants with owner/cotenant info
router.get('/', (req, res) => {
  const db = getDb();
  const { tenant_type, owner_id } = req.query;
  
  let query = `
    SELECT t.*, 
           o.full_name as owner_name,
           o.phone as owner_phone,
           (SELECT COUNT(*) FROM tenants WHERE owner_tenant_id = t.id) as cotenant_count
    FROM tenants t
    LEFT JOIN tenants o ON t.owner_tenant_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (tenant_type) {
    query += ' AND t.tenant_type = ?';
    params.push(tenant_type);
  }
  if (owner_id) {
    query += ' AND t.owner_tenant_id = ?';
    params.push(owner_id);
  }

  query += ' ORDER BY t.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single tenant with owner and cotenants
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(
    `SELECT t.*, 
            o.full_name as owner_name,
            o.phone as owner_phone,
            o.email as owner_email
     FROM tenants t
     LEFT JOIN tenants o ON t.owner_tenant_id = o.id
     WHERE t.id = ?`,
    [req.params.id],
    async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Get cotenants if this is an owner
      const getCotenants = (callback) => {
        if (row.tenant_type === 'owner') {
          db.all(
            'SELECT * FROM tenants WHERE owner_tenant_id = ? ORDER BY full_name',
            [req.params.id],
            (err, cotenants) => {
              if (err) {
                return callback(err, []);
              }
              callback(null, cotenants || []);
            }
          );
        } else {
          callback(null, []);
        }
      };

      // Get vehicles for this tenant
      const getVehicles = (callback) => {
        db.all(
          `SELECT * FROM vehicles WHERE tenant_id = ? ORDER BY created_at DESC`,
          [req.params.id],
          (err, vehicles) => {
            if (err) {
              return callback(err, []);
            }
            callback(null, vehicles || []);
          }
        );
      };

      getVehicles((vehicleErr, vehicles) => {
        if (vehicleErr) {
          return res.status(500).json({ error: vehicleErr.message });
        }

        const respondWithData = (cotenants, contracts = [], invoices = []) => {
          res.json({
            ...row,
            cotenants: cotenants || [],
            contracts: contracts || [],
            invoices: invoices || [],
            vehicles: vehicles || []
          });
        };

        // Get related contracts
        db.all(
          `SELECT c.*,
                  r.room_number,
                  b.name as branch_name
           FROM contracts c
           LEFT JOIN rooms r ON c.room_id = r.id
           LEFT JOIN branches b ON c.branch_id = b.id
           WHERE c.tenant_id = ?
           ORDER BY c.start_date DESC`,
          [req.params.id],
          (err, contracts) => {
            if (err) {
              console.error('Error fetching tenant contracts:', err);
              contracts = [];
            }

            // Get related invoices from all contracts
            const contractIds = contracts.map(c => c.id);
            if (contractIds.length === 0) {
              getCotenants((err, cotenants) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                respondWithData(cotenants, [], []);
              });
              return;
            }

            const placeholders = contractIds.map(() => '?').join(',');
            db.all(
              `SELECT i.*,
                      r.room_number,
                      b.name as branch_name,
                      c.id as contract_id
               FROM invoices i
               LEFT JOIN contracts c ON i.contract_id = c.id
               LEFT JOIN rooms r ON c.room_id = r.id
               LEFT JOIN branches b ON c.branch_id = b.id
               WHERE i.contract_id IN (${placeholders})
               ORDER BY i.invoice_date DESC, i.period_year DESC, i.period_month DESC`,
              contractIds,
              (err, invoices) => {
                if (err) {
                  console.error('Error fetching tenant invoices:', err);
                  invoices = [];
                }

                getCotenants((err, cotenants) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  respondWithData(cotenants, contracts, invoices);
                });
              }
            );
          }
        );
      });
    }
  );
});

// Create tenant
router.post('/', (req, res) => {
  const { 
    full_name, phone, email, id_card, address, hometown, emergency_contact, 
    has_temp_residence, notes, tenant_type, owner_tenant_id
  } = req.body;
  const db = getDb();

  // Validate: if tenant_type is cotenant, owner_tenant_id is required
  if (tenant_type === 'cotenant' && !owner_tenant_id) {
    return res.status(400).json({ error: 'owner_tenant_id is required when tenant_type is cotenant' });
  }

  // Validate: if tenant_type is owner, owner_tenant_id should be null
  const finalOwnerId = tenant_type === 'owner' ? null : owner_tenant_id;

  db.run(
    `INSERT INTO tenants (full_name, phone, email, id_card, address, hometown, emergency_contact, has_temp_residence, notes, tenant_type, owner_tenant_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [full_name, phone, email, id_card, address, hometown || null, emergency_contact, has_temp_residence || 'no', notes, tenant_type || 'owner', finalOwnerId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });

      notifyTenantCreated({ tenantId: this.lastID }).catch((error) => {
        console.error('Error sending tenant notification:', error);
      });
    }
  );
});

// Update tenant
router.put('/:id', (req, res) => {
  const { 
    full_name, phone, email, id_card, address, hometown, emergency_contact, 
    has_temp_residence, notes, tenant_type, owner_tenant_id
  } = req.body;
  const db = getDb();

  // Validate: if tenant_type is cotenant, owner_tenant_id is required
  if (tenant_type === 'cotenant' && !owner_tenant_id) {
    return res.status(400).json({ error: 'owner_tenant_id is required when tenant_type is cotenant' });
  }

  // Validate: cannot set owner_tenant_id to self
  if (owner_tenant_id && parseInt(owner_tenant_id) === parseInt(req.params.id)) {
    return res.status(400).json({ error: 'Cannot set owner to self' });
  }

  // Validate: if tenant_type is owner, owner_tenant_id should be null
  const finalOwnerId = tenant_type === 'owner' ? null : owner_tenant_id;

  db.run(
    `UPDATE tenants SET full_name = ?, phone = ?, email = ?, id_card = ?, 
     address = ?, hometown = ?, emergency_contact = ?, has_temp_residence = ?, notes = ?, tenant_type = ?, owner_tenant_id = ? 
     WHERE id = ?`,
    [full_name, phone, email, id_card, address, hometown || null, emergency_contact, has_temp_residence || 'no', notes, tenant_type || 'owner', finalOwnerId, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      res.json({ message: 'Tenant updated successfully' });
    }
  );
});

// Delete tenant
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM tenants WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json({ message: 'Tenant deleted successfully' });
  });
});

module.exports = router;

