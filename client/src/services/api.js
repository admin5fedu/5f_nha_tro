import axios from 'axios';
import firebaseApi from './firebaseApi';

// Determine Firebase usage.
// Default behaviour:
// - Development: opt-in via VITE_USE_FIREBASE
// - Production: use Firebase unless explicitly disabled
const firebaseFlag = import.meta.env.VITE_USE_FIREBASE;
const USE_FIREBASE = (() => {
  if (firebaseFlag === 'true') return true;
  if (firebaseFlag === 'false') return false;
  return !import.meta.env.DEV; // default to Firebase in production builds
})();

// Resolve backend API base URL with sensible fallbacks
const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  // In production, default to relative /api to allow proxying through hosting provider
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

