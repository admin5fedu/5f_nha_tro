import axios from 'axios';
import firebaseApi from './firebaseApi';

// Check if we should use Firebase
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

// Create axios instance for backend API
const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : 'https://f-nha-tro-default-rtdb.asia-southeast1.firebasedatabase.app/users.json',
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

