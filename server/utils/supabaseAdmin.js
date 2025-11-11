const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdminClient = null;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    '[supabase-admin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Supabase auth sync will be skipped.'
  );
} else {
  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const getSupabaseAdmin = () => supabaseAdminClient;

module.exports = {
  getSupabaseAdmin
};

