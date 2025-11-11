const express = require('express');
const router = express.Router();
const { ensureSupabaseAuthUser } = require('../utils/supabaseAuthUser');

router.post('/auth-sync', async (req, res) => {
  try {
    const { email, fullName, password } = req.body || {};
    const incomingSecret = req.headers['x-sync-secret'] || req.body?.secret;
    const requiredSecret = process.env.SUPABASE_AUTH_SYNC_SECRET;

    if (requiredSecret && incomingSecret !== requiredSecret) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await ensureSupabaseAuthUser({ email, fullName, password });
    res.json({ success: true, result });
  } catch (error) {
    console.error('[supabase-sync] Failed to ensure auth user:', error);
    res.status(500).json({ error: error.message || 'Sync error' });
  }
});

module.exports = router;
