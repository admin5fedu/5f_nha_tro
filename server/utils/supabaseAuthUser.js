const crypto = require('crypto');
const { getSupabaseAdmin } = require('./supabaseAdmin');

const DEFAULT_PASSWORD = '123456';

const generatePassword = () => crypto.randomBytes(6).toString('base64').replace(/[+/=]/g, '').slice(0, 10);

const sanitizePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return DEFAULT_PASSWORD;
  }
  const trimmed = password.trim();
  return trimmed.length >= 6 ? trimmed : DEFAULT_PASSWORD;
};

const findUserByEmail = async (client, email) => {
  let page = 1;
  const pageSize = 100;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) {
      throw error;
    }
    const match =
      data?.users?.find((user) => user.email && user.email.toLowerCase() === email.toLowerCase()) || null;
    if (match) {
      return match;
    }
    if (!data || !data.users || data.users.length < pageSize) {
      break;
    }
    page += 1;
  }
  return null;
};

const ensureSupabaseAuthUser = async ({ email, fullName, password }) => {
  const adminClient = getSupabaseAdmin();
  if (!adminClient || !email) {
    return { skipped: true };
  }

  try {
    const existing = await findUserByEmail(adminClient, email);
    const finalPassword = sanitizePassword(password);

    if (existing) {
      await adminClient.auth.admin.updateUserById(existing.id, {
        email,
        email_confirm: true,
        password: password ? finalPassword : undefined,
        user_metadata: {
          fullName
        }
      });
      return { created: false, userId: existing.id };
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        fullName
      }
    });
    if (error) {
      throw error;
    }
    return { created: true, userId: data?.user?.id };
  } catch (error) {
    console.error('[supabase-auth] Failed to sync auth user:', error);
    throw error;
  }
};

module.exports = {
  ensureSupabaseAuthUser
};

