// Firebase Authentication Helper
import { auth, database } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';

const findUserByEmail = async (email) => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return null;
  }

  const users = snapshot.val();

  for (const [key, user] of Object.entries(users)) {
    if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
      return { firebase_key: key, ...user };
    }
  }

  return null;
};

export const loginWithCredentials = async (identifier, password) => {
  const toError = (message) => ({
    success: false,
    error: message
  });

  try {
    const email = identifier?.trim().toLowerCase();
    if (!email) {
      return toError('Vui lòng nhập email');
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return toError('Tài khoản không tồn tại');
      }
      if (error.code === 'auth/wrong-password') {
        return toError('Mật khẩu không chính xác');
      }
      if (error.code === 'auth/invalid-email') {
        return toError('Email không hợp lệ');
      }
      console.error('Firebase sign-in failed:', error);
      return toError('Không thể xác thực người dùng. Vui lòng thử lại.');
    }

    const user = await findUserByEmail(email);

    if (!user) {
      await signOut(auth);
      return toError('Tài khoản chưa được cấu hình trong hệ thống');
    }

    if (user.status !== 'active') {
      await signOut(auth);
      return toError('Tài khoản đã bị khóa');
    }

    try {
      if (auth.currentUser?.uid) {
        await set(ref(database, `user_roles/${auth.currentUser.uid}`), {
          role: user.role,
          user_id: user.id,
          username: user.username,
          email: user.email,
          synced_at: new Date().toISOString()
        });
      }
    } catch (syncError) {
      console.warn('Không thể đồng bộ quyền người dùng:', syncError);
    }

    const token = btoa(JSON.stringify({
      userId: user.id,
      username: user.username,
      timestamp: Date.now()
    }));

    const { firebase_key, ...userData } = user;

    return {
      success: true,
      token,
      user: userData
    };
  } catch (error) {
    console.error('Đăng nhập thất bại:', error);
    return {
      success: false,
      error: 'Đăng nhập thất bại'
    };
  }
};

/**
 * Logout
 */
export const logoutUser = async () => {
  try {
    // If using Firebase Auth, sign out
    if (auth.currentUser) {
      await signOut(auth);
    }
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get current user from token
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    // Decode token to get user info
    const decoded = JSON.parse(atob(token));
    
    // Fetch fresh user data from database
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    const users = snapshot.val();

    for (const [, user] of Object.entries(users)) {
      if (user.id === decoded.userId) {
        const { firebase_key, ...userData } = user;
        return userData;
      }
    }

    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export default {
  loginWithCredentials,
  logoutUser,
  getCurrentUser,
  isAuthenticated
};

