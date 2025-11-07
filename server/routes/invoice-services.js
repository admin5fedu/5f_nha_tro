const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Update invoice service (including meter readings)
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
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const { meter_start, meter_end, price, quantity } = req.body;

  // Get current invoice service
  db.get(
    `SELECT inv_svc.*, i.contract_id, i.invoice_date, c.room_id
     FROM invoice_services inv_svc
     LEFT JOIN invoices i ON inv_svc.invoice_id = i.id
     LEFT JOIN contracts c ON i.contract_id = c.id
     WHERE inv_svc.id = ?`,
    [req.params.id],
    (err, invoiceService) => {
      if (err) {
        console.error('Error fetching invoice service:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!invoiceService) {
        return res.status(404).json({ error: 'Invoice service not found' });
      }

      // Calculate meter_usage and amount if meter readings changed
      let meter_usage = invoiceService.meter_usage;
      let amount = invoiceService.amount;
      const finalMeterStart = meter_start !== undefined ? meter_start : invoiceService.meter_start;
      const finalMeterEnd = meter_end !== undefined ? meter_end : invoiceService.meter_end;

      if (meter_start !== undefined || meter_end !== undefined) {
        if (finalMeterStart !== null && finalMeterEnd !== null) {
          meter_usage = finalMeterEnd - finalMeterStart;
          if (meter_usage < 0) {
            return res.status(400).json({ error: 'meter_end must be greater than or equal to meter_start' });
          }
          // Recalculate amount if price is provided
          const finalPrice = price !== undefined ? price : invoiceService.price;
          amount = finalPrice * meter_usage;
        }
      } else if (price !== undefined || quantity !== undefined) {
        // Recalculate amount for quantity-based services
        const finalPrice = price !== undefined ? price : invoiceService.price;
        const finalQuantity = quantity !== undefined ? quantity : invoiceService.quantity;
        amount = finalPrice * finalQuantity;
      }

      // Update invoice service
      const updates = [];
      const params = [];

      if (meter_start !== undefined) {
        updates.push('meter_start = ?');
        params.push(meter_start !== null ? meter_start : null);
      }
      if (meter_end !== undefined) {
        updates.push('meter_end = ?');
        params.push(meter_end !== null ? meter_end : null);
      }
      if (meter_start !== undefined || meter_end !== undefined) {
        updates.push('meter_usage = ?');
        params.push(meter_usage !== null ? meter_usage : null);
      }
      if (price !== undefined) {
        updates.push('price = ?');
        params.push(price);
      }
      if (quantity !== undefined) {
        updates.push('quantity = ?');
        params.push(quantity);
      }
      if (price !== undefined || quantity !== undefined || meter_start !== undefined || meter_end !== undefined) {
        updates.push('amount = ?');
        params.push(amount);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(req.params.id);

      db.run(
        `UPDATE invoice_services SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) {
            console.error('Error updating invoice service:', err);
            return res.status(500).json({ error: err.message });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Invoice service not found' });
          }

          // If meter readings changed and we have room_id, update/create meter_readings
          if ((meter_start !== undefined || meter_end !== undefined) && 
              invoiceService.room_id && 
              invoiceService.service_id &&
              finalMeterStart !== null && 
              finalMeterEnd !== null) {
            
            // Check if meter reading exists for this invoice and service
            db.get(
              `SELECT id FROM meter_readings 
               WHERE invoice_id = ? AND service_id = ?`,
              [invoiceService.invoice_id, invoiceService.service_id],
              (err, existingReading) => {
                if (err) {
                  console.error('Error checking existing meter reading:', err);
                  return res.json({ message: 'Invoice service updated successfully' });
                }

                if (existingReading) {
                  // Update existing meter reading
                  db.run(
                    `UPDATE meter_readings 
                     SET meter_start = ?, meter_end = ?, meter_usage = ?, reading_date = ?
                     WHERE id = ?`,
                    [finalMeterStart, finalMeterEnd, meter_usage, invoiceService.invoice_date, existingReading.id],
                    (err) => {
                      if (err) {
                        console.error('Error updating meter reading:', err);
                      } else {
                        console.log(`✅ Updated meter reading ${existingReading.id} for invoice service ${req.params.id}`);
                      }
                      res.json({ message: 'Invoice service updated successfully' });
                    }
                  );
                } else {
                  // Create new meter reading
                  db.run(
                    `INSERT INTO meter_readings (
                      room_id, service_id, invoice_id, reading_date,
                      meter_start, meter_end, meter_usage, recorded_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      invoiceService.room_id,
                      invoiceService.service_id,
                      invoiceService.invoice_id,
                      invoiceService.invoice_date,
                      finalMeterStart,
                      finalMeterEnd,
                      meter_usage,
                      req.user?.id || 1
                    ],
                    function(err) {
                      if (err) {
                        console.error('Error creating meter reading:', err);
                      } else {
                        console.log(`✅ Created meter reading ${this.lastID} for invoice service ${req.params.id}`);
                      }
                      res.json({ message: 'Invoice service updated successfully' });
                    }
                  );
                }
              }
            );
          } else {
            res.json({ message: 'Invoice service updated successfully' });
          }

          // Recalculate invoice totals
          db.get(
            `SELECT SUM(amount) as total_service_amount 
             FROM invoice_services 
             WHERE invoice_id = ?`,
            [invoiceService.invoice_id],
            (err, serviceRow) => {
              if (err) {
                console.error('Error calculating service amount:', err);
                return;
              }

              const newServiceAmount = serviceRow?.total_service_amount || 0;

              db.get(
                `SELECT rent_amount, previous_debt FROM invoices WHERE id = ?`,
                [invoiceService.invoice_id],
                (err, invoiceRow) => {
                  if (err) {
                    console.error('Error getting invoice info:', err);
                    return;
                  }

                  const newTotalAmount = (invoiceRow?.rent_amount || 0) + newServiceAmount + (invoiceRow?.previous_debt || 0);

                  db.run(
                    `UPDATE invoices 
                     SET service_amount = ?, total_amount = ?, remaining_amount = total_amount - paid_amount
                     WHERE id = ?`,
                    [newServiceAmount, newTotalAmount, invoiceService.invoice_id],
                    (err) => {
                      if (err) {
                        console.error('Error updating invoice totals:', err);
                      } else {
                        console.log(`✅ Updated invoice ${invoiceService.invoice_id} totals`);
                      }
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;

