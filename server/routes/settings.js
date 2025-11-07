const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

const ensureSampleSettings = (db) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM settings', [], (err, row) => {
      if (err) {
        return reject(err);
      }

      if (row?.count > 0) {
        return resolve();
      }

      db.run(
        `INSERT INTO settings (
          app_name, app_logo,
          company_name, company_address, company_phone, company_email,
          company_website, company_tax_code,
          company_representative, company_representative_position,
          company_bank_account, company_bank_name, company_bank_branch,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Nhà Trọ An Bình',
          null,
          'Công ty TNHH Dịch Vụ Nhà Trọ An Bình',
          '123 Đường Hoa Cúc, Phường 7, Quận Phú Nhuận, TP. Hồ Chí Minh',
          '028 6262 8888',
          'support@nhatroanbinh.vn',
          'https://nhatroanbinh.vn',
          '0312345678',
          'Nguyễn Thị An',
          'Giám đốc',
          '123456789012',
          'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
          'Chi nhánh Phú Nhuận',
          'Thông tin mẫu để khởi tạo nhanh cấu hình công ty.'
        ],
        (insertErr) => {
          if (insertErr) {
            return reject(insertErr);
          }
          resolve();
        }
      );
    });
  });
};

// Get settings (only one record)
router.get('/', async (req, res) => {
  const db = getDb();
  try {
    await ensureSampleSettings(db);
  } catch (seedErr) {
    return res.status(500).json({ error: seedErr.message });
  }

  db.get('SELECT * FROM settings ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // If no settings exist, return default
    if (!row) {
      return res.json({
        id: null,
        app_name: 'Nhà Trọ',
        app_logo: null,
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_website: '',
        company_tax_code: '',
        company_representative: '',
        company_representative_position: '',
        company_bank_account: '',
        company_bank_name: '',
        company_bank_branch: '',
        notes: ''
      });
    }
    res.json(row);
  });
});

// Get settings by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM settings WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json(row);
  });
});

// Create or update settings (only one record allowed)
router.post('/', (req, res) => {
  const {
    app_name,
    app_logo,
    company_name,
    company_address,
    company_phone,
    company_email,
    company_website,
    company_tax_code,
    company_representative,
    company_representative_position,
    company_bank_account,
    company_bank_name,
    company_bank_branch,
    notes
  } = req.body;
  const db = getDb();

  // Check if settings already exist
  db.get('SELECT id FROM settings ORDER BY id DESC LIMIT 1', [], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (existing) {
      // Update existing settings
      db.run(
        `UPDATE settings SET
          app_name = ?, app_logo = ?,
          company_name = ?, company_address = ?, company_phone = ?, company_email = ?,
          company_website = ?, company_tax_code = ?,
          company_representative = ?, company_representative_position = ?,
          company_bank_account = ?, company_bank_name = ?, company_bank_branch = ?,
          notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          app_name, app_logo,
          company_name, company_address, company_phone, company_email,
          company_website, company_tax_code,
          company_representative, company_representative_position,
          company_bank_account, company_bank_name, company_bank_branch,
          notes,
          existing.id
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ id: existing.id, ...req.body, message: 'Settings updated successfully' });
        }
      );
    } else {
      // Create new settings
      db.run(
        `INSERT INTO settings (
          app_name, app_logo,
          company_name, company_address, company_phone, company_email,
          company_website, company_tax_code,
          company_representative, company_representative_position,
          company_bank_account, company_bank_name, company_bank_branch,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          app_name, app_logo,
          company_name, company_address, company_phone, company_email,
          company_website, company_tax_code,
          company_representative, company_representative_position,
          company_bank_account, company_bank_name, company_bank_branch,
          notes
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ id: this.lastID, ...req.body, message: 'Settings created successfully' });
        }
      );
    }
  });
});

// Update settings
router.put('/:id', (req, res) => {
  const {
    app_name,
    app_logo,
    company_name,
    company_address,
    company_phone,
    company_email,
    company_website,
    company_tax_code,
    company_representative,
    company_representative_position,
    company_bank_account,
    company_bank_name,
    company_bank_branch,
    notes
  } = req.body;
  const db = getDb();

  db.run(
    `UPDATE settings SET
      app_name = ?, app_logo = ?,
      company_name = ?, company_address = ?, company_phone = ?, company_email = ?,
      company_website = ?, company_tax_code = ?,
      company_representative = ?, company_representative_position = ?,
      company_bank_account = ?, company_bank_name = ?, company_bank_branch = ?,
      notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      app_name, app_logo,
      company_name, company_address, company_phone, company_email,
      company_website, company_tax_code,
      company_representative, company_representative_position,
      company_bank_account, company_bank_name, company_bank_branch,
      notes,
      req.params.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      res.json({ message: 'Settings updated successfully' });
    }
  );
});

module.exports = router;

