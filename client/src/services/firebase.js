// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAjdijx-vhCJkDAtkeH6IG6GYf8wVXadSQ",
  authDomain: "f-nha-tro.firebaseapp.com",
  databaseURL: "https://f-nha-tro-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "f-nha-tro",
  storageBucket: "f-nha-tro.firebasestorage.app",
  messagingSenderId: "1088690700023",
  appId: "1:1088690700023:web:b7cd7f3aa795d629959df2",
  measurementId: "G-MEPVEWVF01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const database = getDatabase(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

