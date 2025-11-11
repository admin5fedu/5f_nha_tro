const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!projectId || !clientEmail || !privateKey || !databaseURL) {
  console.error('❌ Missing Firebase Admin credentials. Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, and FIREBASE_DATABASE_URL.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    }),
    databaseURL
  });
}

const db = admin.database();

const removePasswords = async () => {
  console.log('🔄 Scanning users for password fields...');
  const snapshot = await db.ref('users').once('value');
  const updates = {};

  snapshot.forEach((childSnap) => {
    if (childSnap.child('password').exists()) {
      updates[`${childSnap.key}/password`] = null;
    }
  });

  const totalRemovals = Object.keys(updates).length;
  if (totalRemovals === 0) {
    console.log('✅ No password fields found. Nothing to do.');
    process.exit(0);
  }

  await db.ref('users').update(updates);
  console.log(`✅ Removed password field from ${totalRemovals} user(s).`);
  process.exit(0);
};

removePasswords().catch((err) => {
  console.error('❌ Failed to remove password fields:', err);
  process.exit(1);
});

