const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  notifyTransactionCreated,
  notifyTransactionUpdated,
  notifyAccountLowBalance
} = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

// Helper function to update invoice based on related transactions
function updateInvoiceFromTransactions(db, invoiceId, callback) {
  // Get all income transactions for this invoice
  db.all(
    `SELECT SUM(amount) as total_paid FROM transactions 
     WHERE invoice_id = ? AND type = 'income'`,
    [invoiceId],
    (err, rows) => {
      if (err) {
        return callback(err);
      }

      const totalPaid = rows[0]?.total_paid || 0;

      // Get invoice total amount
      db.get(
        'SELECT total_amount FROM invoices WHERE id = ?',
        [invoiceId],
        (err, invoice) => {
          if (err) {
            return callback(err);
          }
          if (!invoice) {
            return callback(new Error('Invoice not found'));
          }

          const totalAmount = invoice.total_amount || 0;
          const remainingAmount = totalAmount - totalPaid; // Cho phép số âm khi đã thanh toán quá

          // Determine status
          let status = 'pending';
          if (totalPaid >= totalAmount) {
            status = 'paid';
          } else if (totalPaid > 0) {
            status = 'partial';
          }

          // Update invoice
          db.run(
            `UPDATE invoices 
             SET paid_amount = ?, remaining_amount = ?, status = ?
             WHERE id = ?`,
            [totalPaid, remainingAmount, status, invoiceId],
            (err) => {
              if (err) {
                return callback(err);
              }
              callback(null);
            }
          );
        }
      );
    }
  );
}

// Generate transaction number
function generateTransactionNumber(type) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const prefix = type === 'income' ? 'PT' : 'PC'; // PT = Phiếu Thu, PC = Phiếu Chi
  return `${prefix}-${year}${month}${day}-${random}`;
}

const ensureSampleTransactions = (db) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM transactions', [], (err, row) => {
      if (err) return reject(err);
      if (row.count > 0) return resolve();

      const getOrCreateAccount = () => {
        return new Promise((resolveAccount, rejectAccount) => {
          db.get('SELECT id FROM accounts ORDER BY id LIMIT 1', [], (err, account) => {
            if (err) return rejectAccount(err);
            if (account) return resolveAccount(account.id);

            db.run(
              `INSERT INTO accounts (name, type, opening_balance, current_balance, status)
               VALUES (?, ?, ?, ?, ?)`,
              ['Tiền mặt', 'cash', 10000000, 10000000, 'active'],
              function(err) {
                if (err) return rejectAccount(err);
                resolveAccount(this.lastID);
              }
            );
          });
        });
      };

      const getOrCreateCategory = (type, name, code) => {
        return new Promise((resolveCategory, rejectCategory) => {
          db.get('SELECT id FROM financial_categories WHERE type = ? ORDER BY id LIMIT 1', [type], (err, category) => {
            if (err) return rejectCategory(err);
            if (category) return resolveCategory(category.id);

            db.run(
              `INSERT INTO financial_categories (name, code, type, status)
               VALUES (?, ?, ?, 'active')`,
              [name, code, type],
              function(err) {
                if (err) return rejectCategory(err);
                resolveCategory(this.lastID);
              }
            );
          });
        });
      };

      Promise.all([
        getOrCreateAccount(),
        getOrCreateCategory('income', 'Thu tiền phòng', 'THU_PHONG'),
        getOrCreateCategory('expense', 'Chi thanh toán dịch vụ', 'CHI_DICH_VU')
      ])
        .then(([accountId, incomeCategoryId, expenseCategoryId]) => {
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);

          const samples = [
            {
              type: 'income',
              category_id: incomeCategoryId,
              account_id: accountId,
              amount: 3500000,
              transaction_date: today.toISOString().split('T')[0],
              payment_method: 'cash',
              description: 'Thu tiền phòng tháng hiện tại',
              notes: 'Khách thanh toán đầy đủ',
            },
            {
              type: 'expense',
              category_id: expenseCategoryId,
              account_id: accountId,
              amount: 1250000,
              transaction_date: yesterday.toISOString().split('T')[0],
              payment_method: 'bank_transfer',
              description: 'Chi phí điện nước kỳ trước',
              notes: 'Thanh toán cho nhà cung cấp',
            },
          ];

          let inserted = 0;
          const userId = null;
          const stmt = db.prepare(
            `INSERT INTO transactions (
              transaction_number, type, category_id, account_id, invoice_id, contract_id,
              amount, transaction_date, payment_method, description, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          );

          samples.forEach((sample) => {
            const transactionNumber = generateTransactionNumber(sample.type);
            stmt.run(
              transactionNumber,
              sample.type,
              sample.category_id,
              sample.account_id,
              null,
              null,
              sample.amount,
              sample.transaction_date,
              sample.payment_method,
              sample.description,
              sample.notes,
              userId,
              (err) => {
                if (err) {
                  console.error('Error seeding sample transaction:', err);
                }
                inserted += 1;
                if (inserted === samples.length) {
                  stmt.finalize((finalErr) => {
                    if (finalErr) {
                      console.error('Error finalizing transaction seed statement:', finalErr);
                    }
                    resolve();
                  });
                }
              }
            );
          });
        })
        .catch(reject);
    });
  });
};

// Get all transactions
router.get('/', async (req, res) => {
  const db = getDb();
  try {
    await ensureSampleTransactions(db);
  } catch (error) {
    console.error('Error ensuring sample transactions:', error);
    return res.status(500).json({ error: 'Không thể chuẩn hóa dữ liệu sổ thu chi' });
  }
  const { type, category_id, account_id, invoice_id, date_from, date_to, search } = req.query;
  
  let query = `
    SELECT t.*,
           fc.name as category_name, fc.code as category_code,
           a.name as account_name, a.type as account_type,
           i.invoice_number,
           c.id as contract_id,
           r.room_number,
           b.name as branch_name,
           tn.full_name as tenant_name
    FROM transactions t
    LEFT JOIN financial_categories fc ON t.category_id = fc.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN invoices i ON t.invoice_id = i.id
    LEFT JOIN contracts c ON t.contract_id = c.id
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN branches b ON r.branch_id = b.id
    LEFT JOIN tenants tn ON c.tenant_id = tn.id
    WHERE 1=1
  `;
  const params = [];

  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  if (category_id) {
    query += ' AND t.category_id = ?';
    params.push(category_id);
  }
  if (account_id) {
    query += ' AND t.account_id = ?';
    params.push(account_id);
  }
  if (invoice_id) {
    query += ' AND t.invoice_id = ?';
    params.push(invoice_id);
  }
  if (date_from) {
    query += ' AND t.transaction_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND t.transaction_date <= ?';
    params.push(date_to);
  }
  if (search) {
    query += ' AND (t.transaction_number LIKE ? OR t.description LIKE ? OR t.notes LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching transactions:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Get single transaction
router.get('/:id', async (req, res) => {
  const db = getDb();
  try {
    await ensureSampleTransactions(db);
  } catch (error) {
    console.error('Error ensuring sample transactions:', error);
    return res.status(500).json({ error: 'Không thể chuẩn hóa dữ liệu sổ thu chi' });
  }
  const query = `
    SELECT t.*,
           fc.name as category_name, fc.code as category_code, fc.type as category_type,
           a.name as account_name, a.type as account_type, a.account_number, a.bank_name,
           i.invoice_number, i.total_amount as invoice_amount,
           c.id as contract_id,
           r.room_number,
           b.name as branch_name,
           tn.full_name as tenant_name, tn.phone as tenant_phone
    FROM transactions t
    LEFT JOIN financial_categories fc ON t.category_id = fc.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN invoices i ON t.invoice_id = i.id
    LEFT JOIN contracts c ON t.contract_id = c.id
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN branches b ON r.branch_id = b.id
    LEFT JOIN tenants tn ON c.tenant_id = tn.id
    WHERE t.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      console.error('Error fetching transaction:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  });
});

// Create transaction
router.post('/', (req, res) => {
  const {
    type, category_id, account_id, invoice_id, contract_id,
    amount, transaction_date, payment_method, description, notes
  } = req.body;
  const db = getDb();

  if (!type || !account_id || !amount || !transaction_date) {
    return res.status(400).json({ error: 'type, account_id, amount, and transaction_date are required' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'type must be either "income" or "expense"' });
  }

  // Generate transaction number
  let transactionNumber = generateTransactionNumber(type);
  
  // Check if transaction number exists, regenerate if needed
  db.get('SELECT id FROM transactions WHERE transaction_number = ?', [transactionNumber], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      transactionNumber = generateTransactionNumber(type);
    }

    // Get user from token (simplified - you may need to extract from JWT)
    const userId = req.user?.id || null;

    db.run(
      `INSERT INTO transactions (
        transaction_number, type, category_id, account_id, invoice_id, contract_id,
        amount, transaction_date, payment_method, description, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionNumber, type, category_id, account_id, invoice_id || null, contract_id || null, amount, transaction_date, payment_method, description, notes, req.user.id],
      function(err) {
        if (err) {
          console.error('Error inserting transaction:', err);
          return res.status(500).json({ error: err.message });
        }

        const transactionId = this.lastID;

        // Update account balance
        db.run(
          `UPDATE accounts 
           SET current_balance = current_balance ${type === 'income' ? '+' : '-'} ?
           WHERE id = ?`,
          [amount, account_id],
          (balanceErr) => {
            if (balanceErr) {
              console.error('Error updating account balance:', balanceErr);
            }

            notifyAccountLowBalance({ accountId: account_id }).catch((error) => {
              if (error) {
                console.error('Error sending account notification:', error);
              }
            });
          }
        );

        // Update invoice if transaction is linked to an invoice
        if (invoice_id && type === 'income') {
          updateInvoiceFromTransactions(db, invoice_id, (err) => {
            if (err) {
              console.error('Error updating invoice from transaction:', err);
            }
          });
        }

        res.json({ id: transactionId, transaction_number: transactionNumber, ...req.body, created_by: req.user.id });

        notifyTransactionCreated({ transactionId }).catch((error) => {
          console.error('Error sending transaction notification:', error);
        });
      }
    );
  });
});

// Update transaction
router.put('/:id', (req, res) => {
  const {
    category_id, account_id, amount, transaction_date, payment_method, description, notes
  } = req.body;
  const db = getDb();

  // Get old transaction to update account balance
  db.get('SELECT type, account_id, amount, invoice_id FROM transactions WHERE id = ?', [req.params.id], (err, oldTransaction) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!oldTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction
    db.run(
      `UPDATE transactions SET 
        category_id = ?, account_id = ?, amount = ?, transaction_date = ?,
        payment_method = ?, description = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        category_id || null, account_id || oldTransaction.account_id,
        amount || oldTransaction.amount, transaction_date || oldTransaction.transaction_date,
        payment_method || oldTransaction.payment_method, description || null, notes || null,
        req.params.id
      ],
      function(err) {
        if (err) {
          console.error('Error updating transaction:', err);
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        // Update account balances
        const oldAmount = oldTransaction.amount;
        const newAmount = amount || oldAmount;
        const oldAccountId = oldTransaction.account_id;
        const newAccountId = account_id || oldAccountId;

        // Revert old transaction
        if (oldTransaction.type === 'income') {
          db.run('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [oldAmount, oldAccountId]);
        } else {
          db.run('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [oldAmount, oldAccountId]);
        }

        // Apply new transaction
        if (oldTransaction.type === 'income') {
          db.run('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [newAmount, newAccountId]);
        } else {
          db.run('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [newAmount, newAccountId]);
        }

        notifyAccountLowBalance({ accountId: newAccountId }).catch((error) => {
          console.error('Error sending account notification:', error);
        });

        // Update invoice if transaction is linked to an invoice
        const invoiceId = req.body.invoice_id || oldTransaction.invoice_id;
        if (invoiceId && oldTransaction.type === 'income') {
          updateInvoiceFromTransactions(db, invoiceId, (err) => {
            if (err) {
              console.error('Error updating invoice from transaction:', err);
            }
          });
        }

        res.json({ message: 'Transaction updated successfully' });

        notifyTransactionUpdated({ transactionId: req.params.id }).catch((error) => {
          console.error('Error sending transaction update notification:', error);
        });
      }
    );
  });
});

// Delete transaction
router.delete('/:id', (req, res) => {
  const db = getDb();
  
  // Get transaction to update account balance
  db.get('SELECT type, account_id, amount, invoice_id FROM transactions WHERE id = ?', [req.params.id], (err, transaction) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Delete transaction
    db.run('DELETE FROM transactions WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        console.error('Error deleting transaction:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Revert account balance
      if (transaction.type === 'income') {
        db.run('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [transaction.amount, transaction.account_id]);
      } else {
        db.run('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [transaction.amount, transaction.account_id]);
      }

      // Update invoice if transaction was linked to an invoice
      if (transaction.invoice_id && transaction.type === 'income') {
        updateInvoiceFromTransactions(db, transaction.invoice_id, (err) => {
          if (err) {
            console.error('Error updating invoice from transaction:', err);
          }
        });
      }

      res.json({ message: 'Transaction deleted successfully' });
    });
  });
});

module.exports = router;

