const express = require('express');
const router = express.Router();

router.post('/login', (_req, res) => {
  return res.status(410).json({
    error: 'Endpoint đăng nhập API đã ngừng sử dụng. Vui lòng đăng nhập thông qua Firebase Authentication.'
  });
});

module.exports = router;

