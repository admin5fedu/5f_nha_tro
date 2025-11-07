const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/db');
const router = express.Router();

// Login
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email hoặc tên đăng nhập là bắt buộc'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { identifier, password } = req.body;
  const normalizedIdentifier = (identifier || '').trim();
  const normalizedEmail = normalizedIdentifier.toLowerCase();
  const db = getDb();

  // For demo, accept admin/admin login even if user doesn't exist in DB
  if ((normalizedIdentifier === 'admin' || normalizedEmail === 'admin@example.com') && password === 'admin') {
    const token = jwt.sign(
      { id: 1, username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    return res.json({
      token,
      user: {
        id: 1,
        username: 'admin',
        full_name: 'Administrator',
        role: 'admin',
        email: 'admin@example.com'
      }
    });
  }

  db.get(
    `SELECT * FROM users WHERE username = ? OR lower(email) = ?`,
    [normalizedIdentifier, normalizedEmail],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          email: user.email || null
        }
      });
    }
  );
});

module.exports = router;

