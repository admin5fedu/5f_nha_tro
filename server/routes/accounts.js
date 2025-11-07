const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { notifyAccountLowBalance } = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

// Get all accounts
router.get('/', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM accounts ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get total balance
router.get('/total-balance', (req, res) => {
  const db = getDb();
  db.get(
    'SELECT SUM(current_balance) as total FROM accounts WHERE status = "active"',
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ total: row.total || 0 });
    }
  );
});

// Get single account with calculated balance from transactions
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Calculate current balance from transactions
    db.get(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance_change
       FROM transactions 
       WHERE account_id = ?`,
      [req.params.id],
      (err, balanceRow) => {
        if (err) {
          console.error('Error calculating balance from transactions:', err);
          // Return account without calculated balance if error
          return res.json(row);
        }
        
        // Calculate final balance: opening_balance + balance_change from transactions
        const balanceChange = balanceRow?.balance_change || 0;
        const calculatedBalance = (row.opening_balance || 0) + balanceChange;
        
        // Return account with calculated balance
        res.json({
          ...row,
          calculated_balance: calculatedBalance,
          balance_change: balanceChange
        });
      }
    );
  });
});

// Create account
router.post('/', (req, res) => {
  const {
    name, type, account_number, bank_name, bank_branch,
    account_holder, qr_code, opening_balance, current_balance,
    status, description
  } = req.body;
  const db = getDb();

  const finalBalance = current_balance !== undefined ? current_balance : (opening_balance || 0);

  db.run(
    `INSERT INTO accounts (
      name, type, account_number, bank_name, bank_branch,
      account_holder, qr_code, opening_balance, current_balance,
      status, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, type || 'bank', account_number, bank_name, bank_branch,
      account_holder, qr_code, opening_balance || 0, finalBalance,
      status || 'active', description
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body, current_balance: finalBalance });

      notifyAccountLowBalance({ accountId: this.lastID }).catch((error) => {
        console.error('Error sending account notification:', error);
      });
    }
  );
});

// Update account
router.put('/:id', (req, res) => {
  const {
    name, type, account_number, bank_name, bank_branch,
    account_holder, qr_code, opening_balance, current_balance,
    status, description
  } = req.body;
  const db = getDb();

  db.run(
    `UPDATE accounts SET 
      name = ?, type = ?, account_number = ?, bank_name = ?, bank_branch = ?,
      account_holder = ?, qr_code = ?, opening_balance = ?, current_balance = ?,
      status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      name, type, account_number, bank_name, bank_branch,
      account_holder, qr_code, opening_balance || 0, current_balance || 0,
      status, description, req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.json({ message: 'Account updated successfully' });

      notifyAccountLowBalance({ accountId: req.params.id }).catch((error) => {
        console.error('Error sending account notification:', error);
      });
    }
  );
});

// Delete account
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM accounts WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  });
});

module.exports = router;

