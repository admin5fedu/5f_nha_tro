const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const {
  notifyMeterReadingMissing,
  notifyMeterReadingAnomaly
} = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

const triggerMissingMeterReadings = (db) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
  const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  db.all(
    `SELECT b.id AS branch_id
     FROM branches b
     JOIN rooms r ON r.branch_id = b.id
     GROUP BY b.id
     HAVING NOT EXISTS (
       SELECT 1 FROM meter_readings mr
       JOIN rooms rr ON mr.room_id = rr.id
       WHERE rr.branch_id = b.id AND mr.reading_date >= ? AND mr.reading_date < ?
     )`,
    [startOfMonth, startOfNextMonth],
    (err, rows) => {
      if (err) {
        console.error('Error checking missing meter readings:', err);
        return;
      }

      rows.forEach((row) => {
        notifyMeterReadingMissing({ branchId: row.branch_id, periodKey }).catch((error) => {
          console.error('Error sending meter reading missing notification:', error);
        });
      });
    }
  );
};

// Get all meter readings
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

  const { room_id, service_id, invoice_id, start_date, end_date } = req.query;
  
  let query = `
    SELECT mr.*,
           r.room_number, r.branch_id as room_branch_id,
           b.name as branch_name,
           s.name as service_name, s.unit, s.unit_name,
           u.full_name as recorded_by_name,
           inv.invoice_number
    FROM meter_readings mr
    LEFT JOIN rooms r ON mr.room_id = r.id
    LEFT JOIN branches b ON r.branch_id = b.id
    LEFT JOIN services s ON mr.service_id = s.id
    LEFT JOIN users u ON mr.recorded_by = u.id
    LEFT JOIN invoices inv ON mr.invoice_id = inv.id
    WHERE 1=1
  `;
  const params = [];

  if (room_id) {
    query += ' AND mr.room_id = ?';
    params.push(room_id);
  }
  if (service_id) {
    query += ' AND mr.service_id = ?';
    params.push(service_id);
  }
  if (invoice_id) {
    query += ' AND mr.invoice_id = ?';
    params.push(invoice_id);
  }
  if (start_date) {
    query += ' AND mr.reading_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND mr.reading_date <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY mr.reading_date DESC, mr.created_at DESC';

  console.log('Fetching meter readings with query:', query.substring(0, 100) + '...');
  console.log('Query params:', params);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching meter readings:', err);
      console.error('Error details:', err.message);
      if (err.stack) {
        console.error('Error stack:', err.stack);
      }
      return res.status(500).json({ error: err.message || 'Database query error' });
    }
    console.log(`Successfully fetched ${rows?.length || 0} meter readings`);
    res.json(rows || []);

    setImmediate(() => triggerMissingMeterReadings(db));
  });
});

// Get single meter reading
router.get('/:id', (req, res) => {
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

  db.get(
    `SELECT mr.*,
            r.room_number, r.branch_id as room_branch_id,
            b.name as branch_name, b.address as branch_address,
            s.name as service_name, s.unit, s.unit_name, s.description as service_description,
            u.full_name as recorded_by_name, u.username as recorded_by_username,
            inv.invoice_number, inv.invoice_date, inv.period_month, inv.period_year
     FROM meter_readings mr
     LEFT JOIN rooms r ON mr.room_id = r.id
     LEFT JOIN branches b ON r.branch_id = b.id
     LEFT JOIN services s ON mr.service_id = s.id
     LEFT JOIN users u ON mr.recorded_by = u.id
     LEFT JOIN invoices inv ON mr.invoice_id = inv.id
     WHERE mr.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        console.error('Error fetching meter reading:', err);
        console.error('Error details:', err.message);
        if (err.stack) {
          console.error('Error stack:', err.stack);
        }
        return res.status(500).json({ error: err.message || 'Database query error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Meter reading not found' });
      }
      res.json(row);
    }
  );
});

// Create meter reading
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
    room_id, service_id, invoice_id, reading_date,
    meter_start, meter_end, recorded_by, notes
  } = req.body;

  if (!room_id || !service_id || !reading_date || meter_start === undefined || meter_end === undefined) {
    return res.status(400).json({ error: 'room_id, service_id, reading_date, meter_start, and meter_end are required' });
  }

  const meter_usage = (meter_end || 0) - (meter_start || 0);
  if (meter_usage < 0) {
    return res.status(400).json({ error: 'meter_end must be greater than or equal to meter_start' });
  }

  // Get current user if recorded_by not provided
  const finalRecordedBy = recorded_by || req.user?.id;
  if (!finalRecordedBy) {
    return res.status(400).json({ error: 'recorded_by is required' });
  }

  db.run(
    `INSERT INTO meter_readings (
      room_id, service_id, invoice_id, reading_date,
      meter_start, meter_end, meter_usage, recorded_by, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      room_id, service_id, invoice_id || null, reading_date,
      meter_start, meter_end, meter_usage, finalRecordedBy, notes || null
    ],
    function(err) {
      if (err) {
        console.error('Error creating meter reading:', err);
        console.error('Error details:', err.message);
        return res.status(500).json({ error: err.message || 'Database error' });
      }
      
      const meterReadingId = this.lastID;
      
      // If invoice_id is provided, update invoice_services with meter_end
      if (invoice_id) {
        db.run(
          `UPDATE invoice_services 
           SET meter_end = ?, meter_usage = ?, amount = price * ?
           WHERE invoice_id = ? AND service_id = ?`,
          [meter_end, meter_usage, meter_usage, invoice_id, service_id],
          (err) => {
            if (err) {
              console.error('Error updating invoice_services:', err);
              // Don't fail the request, just log the error
            } else {
              console.log(`Updated invoice_services for invoice ${invoice_id}, service ${service_id}`);
              
              // Recalculate invoice service_amount and total_amount
              db.get(
                `SELECT SUM(amount) as total_service_amount 
                 FROM invoice_services 
                 WHERE invoice_id = ?`,
                [invoice_id],
                (err, serviceRow) => {
                  if (err) {
                    console.error('Error calculating service amount:', err);
                    return res.json({ id: meterReadingId, ...req.body, meter_usage });
                  }
                  
                  const newServiceAmount = serviceRow?.total_service_amount || 0;
                  
                  // Get invoice info
                  db.get(
                    `SELECT rent_amount, previous_debt FROM invoices WHERE id = ?`,
                    [invoice_id],
                    (err, invoiceRow) => {
                      if (err) {
                        console.error('Error getting invoice info:', err);
                        return res.json({ id: meterReadingId, ...req.body, meter_usage });
                      }
                      
                      const newTotalAmount = (invoiceRow?.rent_amount || 0) + newServiceAmount + (invoiceRow?.previous_debt || 0);
                      
                      // Update invoice
                      db.run(
                        `UPDATE invoices 
                         SET service_amount = ?, total_amount = ?, remaining_amount = total_amount - paid_amount
                         WHERE id = ?`,
                        [newServiceAmount, newTotalAmount, invoice_id],
                        (err) => {
                          if (err) {
                            console.error('Error updating invoice:', err);
                          } else {
                            console.log(`Updated invoice ${invoice_id} with new service amount: ${newServiceAmount}`);
                          }
                          res.json({ id: meterReadingId, ...req.body, meter_usage });
                        }
                      );
                    }
                  );
                }
              );
            }
          }
        );
      } else {
        res.json({ id: meterReadingId, ...req.body, meter_usage });
      }

      triggerMissingMeterReadings(db);

      db.get(
        `SELECT meter_usage
         FROM meter_readings
         WHERE room_id = ? AND service_id = ? AND id <> ?
         ORDER BY reading_date DESC, id DESC
         LIMIT 1`,
        [room_id, service_id, meterReadingId],
        (err, prev) => {
          if (err) {
            console.error('Error fetching previous meter reading:', err);
            return;
          }
          const previousUsage = prev?.meter_usage ?? 0;
          if (previousUsage > 0 && meter_usage >= previousUsage * 2) {
            notifyMeterReadingAnomaly({
              readingId: meterReadingId,
              usage: meter_usage,
              previousUsage
            }).catch((error) => {
              console.error('Error sending meter reading anomaly notification:', error);
            });
          }
        }
      );
    }
  );
});

// Update meter reading
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
    room_id, service_id, invoice_id, reading_date,
    meter_start, meter_end, notes
  } = req.body;

  // Get current meter reading
  db.get('SELECT * FROM meter_readings WHERE id = ?', [req.params.id], (err, reading) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!reading) {
      return res.status(404).json({ error: 'Meter reading not found' });
    }

    // Calculate meter_usage if meter_start or meter_end changed
    let meter_usage = reading.meter_usage;
    const finalMeterStart = meter_start !== undefined ? meter_start : reading.meter_start;
    const finalMeterEnd = meter_end !== undefined ? meter_end : reading.meter_end;
    
    if (meter_start !== undefined || meter_end !== undefined) {
      meter_usage = finalMeterEnd - finalMeterStart;
      if (meter_usage < 0) {
        return res.status(400).json({ error: 'meter_end must be greater than or equal to meter_start' });
      }
    }

    const updates = [];
    const params = [];

    if (room_id !== undefined) {
      updates.push('room_id = ?');
      params.push(room_id);
    }
    if (service_id !== undefined) {
      updates.push('service_id = ?');
      params.push(service_id);
    }
    if (invoice_id !== undefined) {
      updates.push('invoice_id = ?');
      params.push(invoice_id || null);
    }
    if (reading_date !== undefined) {
      updates.push('reading_date = ?');
      params.push(reading_date);
    }
    if (meter_start !== undefined) {
      updates.push('meter_start = ?');
      params.push(meter_start);
    }
    if (meter_end !== undefined) {
      updates.push('meter_end = ?');
      params.push(meter_end);
    }
    if (meter_start !== undefined || meter_end !== undefined) {
      updates.push('meter_usage = ?');
      params.push(meter_usage);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    db.run(
      `UPDATE meter_readings SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          console.error('Error updating meter reading:', err);
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Meter reading not found' });
        }
        res.json({ message: 'Meter reading updated successfully' });
      }
    );
  });
});

// Delete meter reading
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

  db.run('DELETE FROM meter_readings WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Meter reading not found' });
    }
    res.json({ message: 'Meter reading deleted successfully' });
  });
});

// Get latest meter reading for a room and service
router.get('/latest/:room_id/:service_id', (req, res) => {
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

  db.get(
    `SELECT * FROM meter_readings 
     WHERE room_id = ? AND service_id = ?
     ORDER BY reading_date DESC, created_at DESC
     LIMIT 1`,
    [req.params.room_id, req.params.service_id],
    (err, row) => {
      if (err) {
        console.error('Error fetching latest meter reading:', err);
        return res.status(500).json({ error: err.message || 'Database query error' });
      }
      res.json(row || null);
    }
  );
});

module.exports = router;

