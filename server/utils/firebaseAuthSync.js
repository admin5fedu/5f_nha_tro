const { getFirebaseAuth } = require('./firebaseAdmin');

const DEFAULT_PASSWORD = 'Nh@tro123';
const MIN_PASSWORD_LENGTH = 6;

const sanitizePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return null;
  }
  const trimmed = password.trim();
  if (trimmed.length < MIN_PASSWORD_LENGTH) {
    return null;
  }
  return trimmed;
};

const tryGetUserByEmail = async (auth, email) => {
  if (!email) return null;
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
};

const syncFirebaseAuthUser = async ({
  userId,
  fullName,
  email,
  role,
  status,
  password,
  existingEmail
}) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return;
  }

  if (!email && !existingEmail) {
    // No email information to sync
    return;
  }

  try {
    const cleanedPassword = sanitizePassword(password);
    const displayName = fullName || email || existingEmail || `User ${userId}`;

    let userRecord = null;

    // Prefer existing email when editing to avoid duplicate accounts
    userRecord = await tryGetUserByEmail(auth, existingEmail);
    if (!userRecord) {
      userRecord = await tryGetUserByEmail(auth, email);
    }

    if (!userRecord) {
      if (!email) {
        return; // nothing to create
      }
      userRecord = await auth.createUser({
        email,
        password: cleanedPassword || DEFAULT_PASSWORD,
        displayName,
        disabled: status !== 'active'
      });
    } else {
      const updatePayload = {
        displayName,
        disabled: status !== 'active'
      };

      if (email && userRecord.email !== email) {
        updatePayload.email = email;
      }

      if (cleanedPassword) {
        updatePayload.password = cleanedPassword;
      }

      await auth.updateUser(userRecord.uid, updatePayload);
    }

    if (userRecord) {
      await auth.setCustomUserClaims(userRecord.uid, {
        role,
        user_id: Number(userId)
      });
      console.info(`[firebase-auth] Synced auth user ${userRecord.uid} for DB user ${userId}`);
    }
  } catch (error) {
    console.error('[firebase-auth] Failed to sync Firebase Auth user:', error);
  }
};

module.exports = {
  syncFirebaseAuthUser
};

