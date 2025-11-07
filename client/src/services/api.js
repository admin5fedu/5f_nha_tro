import axios from 'axios';
import firebaseApi from './firebaseApi';

/**
 * Determine whether we should use Firebase API or the legacy backend API.
 *
 * Rules:
 *  - If VITE_USE_FIREBASE is explicitly set, honour it.
 *  - Otherwise default to Firebase in production builds (so Vercel deploys
 *    automatically use Firebase) and keep the legacy backend for local dev.
 */
const firebaseFlag = import.meta.env.VITE_USE_FIREBASE;
const USE_FIREBASE = (() => {
  if (firebaseFlag === 'true') return true;
  if (firebaseFlag === 'false') return false;
  return !import.meta.env.DEV; // default to Firebase when building for production
})();

/**
 * Resolve backend API base URL with sensible fallbacks. We prefer a relative
 * path so that Vercel/Netlify proxies can be configured without code changes.
 */
const API_BASE_URL = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }
  // Default behaviour:
  //  - Development: proxy to local Express server via /api to avoid CORS.
  //  - Production: keep /api so that hosting platform can forward requests.
  return '/api';
})();

// Create axios instance for backend API
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export the appropriate API based on environment variable
const api = USE_FIREBASE ? firebaseApi : axiosInstance;

// Log which API is being used
if (typeof window !== 'undefined') {
  console.log(`🔥 API Mode: ${USE_FIREBASE ? 'Firebase Realtime Database' : 'Backend API (Axios)'}`);
}

export default api;

