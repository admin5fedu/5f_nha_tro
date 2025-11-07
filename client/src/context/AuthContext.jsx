import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import firebaseAuthService from '../services/firebaseAuth';

const AuthContext = createContext();

// Check if we're using Firebase
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          if (USE_FIREBASE) {
            // Verify token is still valid by fetching current user
            const currentUser = await firebaseAuthService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } else {
            setUser(JSON.parse(userData));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Auth init error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      if (USE_FIREBASE) {
        // Use Firebase authentication
        const result = await firebaseAuthService.loginWithCredentials(identifier, password);
        
        if (result.success) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          setUser(result.user);
          return { success: true };
        } else {
          return { 
            success: false, 
            error: result.error 
          };
        }
      } else {
        // Use backend API
        const response = await api.post('/auth/login', { identifier, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Đăng nhập thất bại' 
      };
    }
  };

  const logout = async () => {
    try {
      if (USE_FIREBASE) {
        await firebaseAuthService.logoutUser();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

