const DEFAULT_ENDPOINT = typeof window !== 'undefined' ? `${window.location.origin}/api/supabase/auth-sync` : '/api/supabase/auth-sync';
const SYNC_ENDPOINT = import.meta.env.VITE_SUPABASE_AUTH_SYNC_URL || DEFAULT_ENDPOINT;
const SYNC_SECRET = import.meta.env.VITE_SUPABASE_AUTH_SYNC_SECRET || '';

export const syncSupabaseAuthUser = async ({ email, fullName, password }) => {
  if (!email) {
    return { skipped: true, reason: 'missing-email' };
  }

  try {
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SYNC_SECRET ? { 'x-sync-secret': SYNC_SECRET } : {})
      },
      body: JSON.stringify({ email, fullName, password })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Auth sync failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[supabase-auth-sync] Sync request failed:', error);
    throw error;
  }
};

export default {
  syncSupabaseAuthUser
};
