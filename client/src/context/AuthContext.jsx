import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabaseAuth from '../services/supabaseAuth';
import { fetchUserByEmail } from '../services/supabaseUsers';
import { isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext();

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

  const hydrateUser = useCallback(
    async (authUser) => {
      if (!authUser?.email) {
        localStorage.removeItem('user');
        setUser(null);
        return false;
      }

      try {
        const profile = await fetchUserByEmail(authUser.email);
        localStorage.setItem('user', JSON.stringify(profile));
        setUser(profile);
        return true;
      } catch (error) {
        console.error('Không tìm thấy hồ sơ người dùng tương ứng email:', error);
        localStorage.removeItem('user');
        setUser(null);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase chưa được cấu hình. AuthContext sẽ hoạt động ở chế độ ngoại tuyến.');
      setLoading(false);
      return;
    }

    let subscription;

    const initAuth = async () => {
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }

        const { data: sessionData, error } = await supabaseAuth.getSession();
        if (error) {
          console.error('Supabase getSession error:', error);
        }
        const session = sessionData?.session;
        if (session?.user?.email) {
          await hydrateUser(session.user);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }

      const { data } = supabaseAuth.onAuthStateChange(async (_event, session) => {
        if (session?.user?.email) {
          await hydrateUser(session.user);
        } else {
          localStorage.removeItem('user');
          setUser(null);
        }
      });
      subscription = data.subscription;
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [hydrateUser]);

  const login = async (identifier, password) => {
    const email = identifier?.trim().toLowerCase();
    if (!email) {
      return {
        success: false,
        error: 'Vui lòng nhập email'
      };
    }

    try {
      const { data, error } = await supabaseAuth.signInWithEmail(email, password);
      if (error) {
        let message = error.message || 'Đăng nhập thất bại';
        if (error.status === 400 || message.toLowerCase().includes('invalid login credentials')) {
          message = 'Email hoặc mật khẩu không chính xác';
        }
        return { success: false, error: message };
      }

      const sessionUser = data?.user || data?.session?.user;
      if (!sessionUser?.email) {
        return { success: false, error: 'Không thể xác thực người dùng. Vui lòng thử lại.' };
      }

      const hydrated = await hydrateUser(sessionUser);
      if (!hydrated) {
        await supabaseAuth.signOut();
        return {
          success: false,
          error: 'Tài khoản chưa được cấu hình trong hệ thống. Vui lòng liên hệ quản trị viên.'
        };
      }

      return { success: true };
    } catch (err) {
      console.error('Supabase login error:', err);
      return {
        success: false,
        error: err.message || 'Đăng nhập thất bại'
      };
    }
  };

  const logout = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (error) {
      console.error('Supabase sign out error:', error);
    } finally {
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

