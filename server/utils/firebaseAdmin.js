const admin = require('firebase-admin');

let appInstance = null;

const getCredentialsFromEnv = () => {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[firebase-admin] Missing credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY to enable Firebase Auth user sync.'
    );
    return null;
  }

  return { projectId, clientEmail, privateKey };
};

const initFirebaseAdmin = () => {
  if (appInstance) {
    return appInstance;
  }

  const creds = getCredentialsFromEnv();
  if (!creds) {
    return null;
  }

  try {
    appInstance = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: creds.projectId,
        clientEmail: creds.clientEmail,
        privateKey: creds.privateKey
      })
    });
    console.info('[firebase-admin] Initialized Firebase Admin SDK');
  } catch (error) {
    console.error('[firebase-admin] Failed to initialize Firebase Admin SDK:', error);
    appInstance = null;
  }

  return appInstance;
};

const getFirebaseAuth = () => {
  const app = initFirebaseAdmin();
  if (!app) {
    return null;
  }
  return admin.auth();
};

module.exports = {
  getFirebaseAuth
};

