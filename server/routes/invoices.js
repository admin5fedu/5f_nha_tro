const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken, authorizePermission } = require('../middleware/auth');
const {
  notifyInvoiceCreated,
  notifyInvoiceDueSoon,
  notifyInvoiceOverdue
} = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

// Generate invoice number
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `HD-${year}${month}-${random}`;
}

// Calculate previous debt for a contract
function calculatePreviousDebt(db, contractId, invoiceDate, callback) {
  db.get(
    `SELECT COALESCE(SUM(remaining_amount), 0) as total_debt
     FROM invoices
     WHERE contract_id = ? AND invoice_date < ? AND status != 'paid'`,
    [contractId, invoiceDate],
    (err, row) => {
      if (err) {
        return callback(err, 0);
      }
      callback(null, row?.total_debt || 0);
    }
  );
}

const triggerInvoiceDeadlineNotifications = (invoices = []) => {
  if (!Array.isArray(invoices) || invoices.length === 0) return;

  const soonThresholds = [1, 3, 7, 14];
  const overdueThresholds = [1, 3, 7, 14, 30];
  const now = new Date();

  invoices.forEach((invoice) => {
    if (!invoice.due_date) return;
    const dueDate = new Date(invoice.due_date);
    if (Number.isNaN(dueDate.getTime())) return;

    const diffMs = dueDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      const threshold = soonThresholds.find((value) => diffDays <= value);
      if (threshold !== undefined) {
        notifyInvoiceDueSoon({ invoiceId: invoice.id, daysRemaining: threshold }).catch((error) => {
          console.error('Error notifying invoice due soon:', error);
        });
      }
    } else {
      const overdueDays = Math.abs(diffDays);
      const threshold = [...overdueThresholds].reverse().find((value) => overdueDays >= value);
      if (threshold !== undefined) {
        notifyInvoiceOverdue({ invoiceId: invoice.id, daysOverdue: threshold }).catch((error) => {
          console.error('Error notifying invoice overdue:', error);
        });
      }
    }
  });
};

// Get all invoices
router.get('/', (req, res) => {
  const db = getDb();
  const { contract_id, status, period_month, period_year, search } = req.query;
  
  let query = `
    SELECT i.*,
           c.room_id, c.tenant_id, c.monthly_rent,
           r.room_number, r.branch_id,
           b.name as branch_name,
           t.full_name as tenant_name, t.phone as tenant_phone
    FROM invoices i
    LEFT JOIN contracts c ON i.contract_id = c.id
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN branches b ON c.branch_id = b.id
    LEFT JOIN tenants t ON c.tenant_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (contract_id) {
    query += ' AND i.contract_id = ?';
    params.push(contract_id);
  }
  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }
  if (period_month) {
    query += ' AND i.period_month = ?';
    params.push(period_month);
  }
  if (period_year) {
    query += ' AND i.period_year = ?';
    params.push(period_year);
  }
  if (search) {
    query += ' AND (i.invoice_number LIKE ? OR r.room_number LIKE ? OR t.full_name LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY i.invoice_date DESC, i.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);

    setImmediate(() => triggerInvoiceDeadlineNotifications(rows));
  });
});

// Get single invoice with services
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(
    `SELECT i.*,
            c.room_id, c.tenant_id, c.monthly_rent, c.deposit,
            r.room_number, r.branch_id as room_branch_id,
            b.id as branch_id, b.name as branch_name, b.address as branch_address, 
            b.phone as branch_phone, b.manager_name, b.status as branch_status,
            t.id as tenant_table_id, t.full_name, t.phone, t.email, t.id_card, 
            t.address as tenant_address, t.hometown, t.emergency_contact,
            t.has_temp_residence, t.notes as tenant_notes, t.tenant_type
     FROM invoices i
     LEFT JOIN contracts c ON i.contract_id = c.id
     LEFT JOIN rooms r ON c.room_id = r.id
     LEFT JOIN branches b ON c.branch_id = b.id
     LEFT JOIN tenants t ON c.tenant_id = t.id
     WHERE i.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        console.error('Error fetching invoice:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Get invoice services
      db.all(
        `SELECT inv_svc.*, s.name as service_name, s.unit, s.unit_name
         FROM invoice_services inv_svc
         LEFT JOIN services s ON inv_svc.service_id = s.id
         WHERE inv_svc.invoice_id = ?
         ORDER BY s.name`,
        [req.params.id],
        (err, services) => {
          if (err) {
            console.error('Error fetching invoice services:', err);
            return res.status(500).json({ error: err.message });
          }

          // Get related transactions (payments for this invoice)
          db.all(
            `SELECT t.*,
                    fc.name as category_name, fc.code as category_code,
                    a.name as account_name, a.type as account_type
             FROM transactions t
             LEFT JOIN financial_categories fc ON t.category_id = fc.id
             LEFT JOIN accounts a ON t.account_id = a.id
             WHERE t.invoice_id = ?
             ORDER BY t.transaction_date DESC, t.created_at DESC`,
            [req.params.id],
            (err, transactions) => {
              if (err) {
                console.error('Error fetching invoice transactions:', err);
                // Don't fail, just return empty array
                return res.json({ ...row, services: services || [], transactions: [] });
              }
              res.json({ ...row, services: services || [], transactions: transactions || [] });
            }
          );
        }
      );
    }
  );
});

// Create invoice
router.post('/', (req, res) => {
  const {
    contract_id, invoice_date, due_date, period_month, period_year,
    actual_days, rent_amount, service_amount, previous_debt, notes, services
  } = req.body;
  const db = getDb();

  if (!contract_id || !invoice_date || !due_date || !period_month || !period_year) {
    return res.status(400).json({ error: 'contract_id, invoice_date, due_date, period_month, and period_year are required' });
  }

  // Calculate previous debt from previous invoices
  calculatePreviousDebt(db, contract_id, invoice_date, (err, calculatedDebt) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const finalPreviousDebt = calculatedDebt; // Always use calculated debt
    const totalAmount = (rent_amount || 0) + (service_amount || 0) + finalPreviousDebt;
    const remainingAmount = totalAmount - (req.body.paid_amount || 0);

    // Generate QR code (using account info from contract's branch)
    // Try to get branch info, but handle case where columns might not exist
    db.get(
      `SELECT c.branch_id
       FROM contracts c
       WHERE c.id = ?`,
      [contract_id],
      (err, contractRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Try to get branch info with new columns, fallback if columns don't exist
        db.get(
          `SELECT * FROM branches WHERE id = ?`,
          [contractRow?.branch_id],
          (err, branchInfo) => {
            if (err) {
              console.error('Error getting branch info:', err);
            }

            let qrCode = null;
            // Check if account_number column exists and has value
            if (branchInfo && branchInfo.account_number) {
              const accountNumber = branchInfo.account_number;
              const accountHolder = branchInfo.account_holder || '';
              const qrData = `${accountNumber}|${accountHolder}|${totalAmount}`;
              qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
            } else if (branchInfo && branchInfo.qr_code) {
              qrCode = branchInfo.qr_code;
            }

            const invoiceNumber = generateInvoiceNumber();
            const status = remainingAmount <= 0 ? 'paid' : (req.body.paid_amount > 0 ? 'partial' : 'pending');

            db.run(
              `INSERT INTO invoices (
                contract_id, invoice_number, invoice_date, due_date,
                period_month, period_year, actual_days, rent_amount, service_amount,
                previous_debt, total_amount, paid_amount, remaining_amount,
                status, qr_code, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                contract_id, invoiceNumber, invoice_date, due_date,
                period_month, period_year, actual_days || null, rent_amount || 0, service_amount || 0,
                finalPreviousDebt, totalAmount, req.body.paid_amount || 0, remainingAmount,
                status, qrCode, notes || null
              ],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                const invoiceId = this.lastID;

                // Insert invoice services
                if (services && Array.isArray(services) && services.length > 0) {
                  const stmt = db.prepare(
                    `INSERT INTO invoice_services (invoice_id, service_id, service_name, price, quantity, amount, meter_start, meter_end, meter_usage)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  );

                  const meterReadingsToCreate = [];

                  services.forEach((service) => {
                    let amount = 0;
                    if (service.unit === 'meter' && service.meter_start !== undefined && service.meter_end !== undefined) {
                      // For meter-based services, calculate from meter readings
                      const usage = (service.meter_end || 0) - (service.meter_start || 0);
                      amount = (service.price || 0) * usage;
                      stmt.run([
                        invoiceId,
                        service.service_id,
                        service.service_name || '',
                        service.price || 0,
                        1,
                        amount,
                        service.meter_start || null,
                        service.meter_end || null,
                        usage
                      ]);

                      // Prepare meter reading to create
                      if (contractRow.room_id && service.meter_start !== null && service.meter_end !== null) {
                        meterReadingsToCreate.push({
                          room_id: contractRow.room_id,
                          service_id: service.service_id,
                          invoice_id: invoiceId,
                          reading_date: invoice_date,
                          meter_start: service.meter_start,
                          meter_end: service.meter_end,
                          meter_usage: usage,
                          recorded_by: req.user?.id || 1
                        });
                      }
                    } else {
                      // For quantity-based services
                      amount = (service.price || 0) * (service.quantity || 1);
                      stmt.run([
                        invoiceId,
                        service.service_id,
                        service.service_name || '',
                        service.price || 0,
                        service.quantity || 1,
                        amount,
                        null,
                        null,
                        null
                      ]);
                    }
                  });

                  stmt.finalize((err) => {
                    if (err) {
                      console.error('Error inserting invoice services:', err);
                      return res.status(500).json({ error: err.message });
                    }

                    // Create meter readings for meter-based services
                    if (meterReadingsToCreate.length > 0) {
                      const meterStmt = db.prepare(`
                        INSERT INTO meter_readings (
                          room_id, service_id, invoice_id, reading_date,
                          meter_start, meter_end, meter_usage, recorded_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                      `);

                      let meterInserted = 0;
                      meterReadingsToCreate.forEach((reading) => {
                        meterStmt.run(
                          reading.room_id,
                          reading.service_id,
                          reading.invoice_id,
                          reading.reading_date,
                          reading.meter_start,
                          reading.meter_end,
                          reading.meter_usage,
                          reading.recorded_by,
                          (err) => {
                            if (err) {
                              console.error('Error creating meter reading:', err);
                            }
                            meterInserted++;
                            if (meterInserted === meterReadingsToCreate.length) {
                              meterStmt.finalize();
                              console.log(`✅ Created ${meterInserted} meter readings for invoice ${invoiceId}`);
                            }
                          }
                        );
                      });
                    }

                    res.json({ id: invoiceId, invoice_number: invoiceNumber, ...req.body });

                    notifyInvoiceCreated({ invoiceId: invoiceId }).catch((error) => {
                      console.error('Error sending invoice notification:', error);
                    });

                    triggerInvoiceDeadlineNotifications([{ id: invoiceId, due_date: due_date }]);
                  });
                } else {
                  res.json({ id: invoiceId, invoice_number: invoiceNumber, ...req.body });
                }
              }
            );
          }
        );
      }
    );
  });
});

// Create invoices in bulk
router.post('/bulk', (req, res) => {
  const { branch_id, room_ids, contract_ids, invoice_date, due_date, period_month, period_year, actual_days } = req.body;
  const db = getDb();

  if (!invoice_date || !due_date || !period_month || !period_year) {
    return res.status(400).json({ error: 'invoice_date, due_date, period_month, and period_year are required' });
  }

  // If contract_ids is provided, use it directly
  // Otherwise, use branch_id and room_ids to find contracts
  let contract_ids_to_process = [];
  
  if (contract_ids && Array.isArray(contract_ids) && contract_ids.length > 0) {
    // Use provided contract_ids
    contract_ids_to_process = contract_ids;
  } else if (branch_id) {
    // Get contracts for selected branch and rooms
    let contractQuery = `
      SELECT c.id
      FROM contracts c
      WHERE c.branch_id = ? AND c.status = 'active'
    `;
    const contractParams = [branch_id];

    if (room_ids && Array.isArray(room_ids) && room_ids.length > 0) {
      contractQuery += ' AND c.room_id IN (' + room_ids.map(() => '?').join(',') + ')';
      contractParams.push(...room_ids);
    }

    db.all(contractQuery, contractParams, (err, contracts) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!contracts || contracts.length === 0) {
        return res.status(400).json({ error: 'No active contracts found for selected criteria' });
      }

      contract_ids_to_process = contracts.map(c => c.id);
      processBulkInvoices(db, contract_ids_to_process, req.body, res);
    });
    return;
  } else {
    return res.status(400).json({ error: 'Either contract_ids or branch_id is required' });
  }

  if (contract_ids_to_process.length === 0) {
    return res.status(400).json({ error: 'No contracts selected' });
  }

  processBulkInvoices(db, contract_ids_to_process, req.body, res);
});

function processBulkInvoices(db, contract_ids, body, res) {
  const { invoice_date, due_date, period_month, period_year, actual_days } = body;

  const results = [];
  let completed = 0;
  let errors = [];

  if (!contract_ids || contract_ids.length === 0) {
    return res.status(400).json({ error: 'No contracts selected' });
  }

  contract_ids.forEach((contractId) => {
    // Get contract info
    db.get(
      `SELECT c.*, r.room_number
       FROM contracts c
       LEFT JOIN rooms r ON c.room_id = r.id
       WHERE c.id = ? AND c.status = 'active'`,
      [contractId],
      (err, contract) => {
        if (err || !contract) {
          errors.push({ contract_id: contractId, error: 'Contract not found or inactive' });
          completed++;
          if (completed === contract_ids.length) {
            return res.json({ created: results.length, errors, results });
          }
          return;
        }

        // Get branch info separately to handle missing columns
        db.get(
          `SELECT * FROM branches WHERE id = ?`,
          [contract.branch_id],
          (err, branchInfo) => {
            if (err) {
              console.error('Error getting branch info:', err);
            }

            // Check if invoice already exists for this period
            db.get(
              `SELECT id FROM invoices WHERE contract_id = ? AND period_month = ? AND period_year = ?`,
              [contractId, period_month, period_year],
              (err, existing) => {
                if (err) {
                  errors.push({ contract_id: contractId, error: err.message });
                  completed++;
                  if (completed === contract_ids.length) {
                    return res.json({ created: results.length, errors, results });
                  }
                  return;
                }

                if (existing) {
                  errors.push({ contract_id: contractId, error: 'Invoice already exists for this period' });
                  completed++;
                  if (completed === contract_ids.length) {
                    return res.json({ created: results.length, errors, results });
                  }
                  return;
                }

                // Get contract services
                db.all(
                  `SELECT cs.*, s.name as service_name, s.unit, s.unit_name
                   FROM contract_services cs
                   LEFT JOIN services s ON cs.service_id = s.id
                   WHERE cs.contract_id = ?`,
                  [contractId],
                  (err, contractServices) => {
                    if (err) {
                      errors.push({ contract_id: contractId, error: err.message });
                      completed++;
                      if (completed === contract_ids.length) {
                        return res.json({ created: results.length, errors, results });
                      }
                      return;
                    }

                    // Calculate service amount
                    const serviceAmount = contractServices.reduce((sum, s) => {
                      return sum + ((s.price || 0) * (s.quantity || 1));
                    }, 0);

                    // Calculate previous debt
                    calculatePreviousDebt(db, contractId, invoice_date, (err, previousDebt) => {
                      if (err) {
                        errors.push({ contract_id: contractId, error: err.message });
                        completed++;
                        if (completed === contract_ids.length) {
                          return res.json({ created: results.length, errors, results });
                        }
                        return;
                      }

                      const rentAmount = contract.monthly_rent || 0;
                      const totalAmount = rentAmount + serviceAmount + previousDebt;

                      // Generate QR code
                      let qrCode = null;
                      if (branchInfo && branchInfo.account_number) {
                        const accountNumber = branchInfo.account_number;
                        const accountHolder = branchInfo.account_holder || '';
                        const qrData = `${accountNumber}|${accountHolder}|${totalAmount}`;
                        qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
                      } else if (branchInfo && branchInfo.qr_code) {
                        qrCode = branchInfo.qr_code;
                      }

                      const invoiceNumber = generateInvoiceNumber();

                      // Calculate rent with actual_days adjustment
                      let adjustedRentAmount = rentAmount;
                      if (actual_days && actual_days > 0) {
                        const daysInMonth = new Date(period_year, period_month, 0).getDate();
                        adjustedRentAmount = Math.round((rentAmount * actual_days) / daysInMonth);
                      }

                      // Calculate service amount with actual_days adjustment
                      let adjustedServiceAmount = serviceAmount;
                      if (actual_days && actual_days > 0) {
                        const daysInMonth = new Date(period_year, period_month, 0).getDate();
                        adjustedServiceAmount = Math.round((serviceAmount * actual_days) / daysInMonth);
                      }

                      const adjustedTotalAmount = adjustedRentAmount + adjustedServiceAmount + previousDebt;

                      db.run(
                        `INSERT INTO invoices (
                          contract_id, invoice_number, invoice_date, due_date,
                          period_month, period_year, actual_days, rent_amount, service_amount,
                          previous_debt, total_amount, paid_amount, remaining_amount,
                          status, qr_code
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                          contractId, invoiceNumber, invoice_date, due_date,
                          period_month, period_year, actual_days || null, adjustedRentAmount, adjustedServiceAmount,
                          previousDebt, adjustedTotalAmount, 0, adjustedTotalAmount,
                          'pending', qrCode
                        ],
                        function(err) {
                          if (err) {
                            errors.push({ contract_id: contractId, error: err.message });
                            completed++;
                            if (completed === contract_ids.length) {
                              return res.json({ created: results.length, errors, results });
                            }
                            return;
                          }

                          const invoiceId = this.lastID;

                          // Insert invoice services
                          if (contractServices.length > 0) {
                            const stmt = db.prepare(
                              `INSERT INTO invoice_services (invoice_id, service_id, service_name, price, quantity, amount, meter_start, meter_end, meter_usage)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                            );

                            const daysInMonth = new Date(period_year, period_month, 0).getDate();
                            contractServices.forEach((service) => {
                              let amount = (service.price || 0) * (service.quantity || 1);
                              // Adjust by actual_days for quantity-based services
                              if (actual_days && actual_days > 0 && service.unit === 'quantity') {
                                amount = Math.round((amount * actual_days) / daysInMonth);
                              }
                              stmt.run([
                                invoiceId,
                                service.service_id,
                                service.service_name || '',
                                service.price || 0,
                                service.quantity || 1,
                                amount,
                                null, // meter_start - to be filled manually
                                null, // meter_end - to be filled manually
                                null  // meter_usage - to be calculated
                              ]);
                            });

                            stmt.finalize();
                          }

                          results.push({ contract_id: contractId, invoice_id: invoiceId, invoice_number: invoiceNumber });

                          notifyInvoiceCreated({ invoiceId }).catch((error) => {
                            console.error('Error sending invoice notification:', error);
                          });
                          triggerInvoiceDeadlineNotifications([{ id: invoiceId, due_date }]);

                          completed++;

                          if (completed === contract_ids.length) {
                            return res.json({ created: results.length, errors, results });
                          }
                        }
                      );
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

// Update invoice
router.put('/:id', (req, res) => {
  const {
    paid_amount, status, notes
  } = req.body;
  const db = getDb();

  // Get current invoice
  db.get('SELECT total_amount, paid_amount FROM invoices WHERE id = ?', [req.params.id], (err, invoice) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const newPaidAmount = paid_amount !== undefined ? paid_amount : invoice.paid_amount;
    const remainingAmount = invoice.total_amount - newPaidAmount;
    const newStatus = status || (
      remainingAmount <= 0 ? 'paid' : 
      newPaidAmount > 0 ? 'partial' : 
      'pending'
    );

    db.run(
      `UPDATE invoices SET paid_amount = ?, remaining_amount = ?, status = ?, notes = ?
       WHERE id = ?`,
      [newPaidAmount, remainingAmount, newStatus, notes || null, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json({ message: 'Invoice updated successfully' });
      }
    );
  });
});

// Delete invoice
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM invoices WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  });
});

module.exports = router;


