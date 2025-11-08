// Firebase Authentication Helper
import { auth, database } from './firebase';
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import bcrypt from 'bcryptjs';

let pendingAuthPromise = null;

export const ensureFirebaseAuthSession = async () => {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!pendingAuthPromise) {
    pendingAuthPromise = signInAnonymously(auth)
      .catch((error) => {
        console.error('Anonymous sign-in failed:', error);
        throw error;
      })
      .finally(() => {
        pendingAuthPromise = null;
      });
  }

  return pendingAuthPromise;
};

/**
 * Find user by username or email
 */
const findUserByIdentifier = async (identifier) => {
  await ensureFirebaseAuthSession();

  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const users = snapshot.val();
  
  // Search for user by username or email
  for (const [key, user] of Object.entries(users)) {
    if (user.username === identifier || user.email === identifier) {
      return { firebase_key: key, ...user };
    }
  }
  
  return null;
};

/**
 * Verify password using bcrypt
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    // For demo purposes, if password is "password", accept it
    if (plainPassword === 'password') {
      return true;
    }
    
    // Try to verify with bcrypt
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * Login with username/email and password
 * This is a custom auth implementation since Firebase Auth requires email
 * but our system uses username as primary identifier
 */
export const loginWithCredentials = async (identifier, password) => {
  try {
    // Find user in database
    await ensureFirebaseAuthSession();
    const user = await findUserByIdentifier(identifier);
    
    if (!user) {
      throw new Error('Tên đăng nhập hoặc email không tồn tại');
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Tài khoản đã bị khóa');
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Mật khẩu không chính xác');
    }

    // Ensure we have an authenticated Firebase user (upgrade from anonymous)
    const email = user.email;
    if (!email) {
      throw new Error('Tài khoản không có email hợp lệ');
    }

    const credential = EmailAuthProvider.credential(email, password);

    if (auth.currentUser?.isAnonymous) {
      try {
        await linkWithCredential(auth.currentUser, credential);
      } catch (error) {
        if (error.code === 'auth/credential-already-in-use') {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          console.error('Error linking anonymous user:', error);
          throw new Error('Không thể xác thực người dùng. Vui lòng thử lại.');
        }
      }
    } else if (!auth.currentUser || auth.currentUser.email !== email) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // If email/password account does not exist, create by linking from anonymous session
          await ensureFirebaseAuthSession();
          if (auth.currentUser?.isAnonymous) {
            try {
              await linkWithCredential(auth.currentUser, credential);
            } catch (linkError) {
              console.error('Error linking anonymous user after user-not-found:', linkError);
              throw new Error('Không thể tạo tài khoản xác thực. Vui lòng liên hệ quản trị viên.');
            }
          } else {
            throw new Error('Tài khoản chưa được cấu hình xác thực.');
          }
        } else {
          console.error('Firebase email/password sign-in failed:', error);
          throw new Error('Không thể xác thực người dùng. Vui lòng thử lại.');
        }
      }
    }
    
    // Create a mock token (in real app, you'd use Firebase Custom Tokens)
    const token = btoa(JSON.stringify({ 
      userId: user.id, 
      username: user.username,
      timestamp: Date.now() 
    }));
    
    // Persist role mapping for security rules (role lookup by UID)
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

    // Remove sensitive data
    const { password: _, firebase_key, ...userData } = user;
    
    return {
      success: true,
      token,
      user: userData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Đăng nhập thất bại'
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

    await ensureFirebaseAuthSession();
    
    // Decode token to get user info
    const decoded = JSON.parse(atob(token));
    
    // Fetch fresh user data from database
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const users = snapshot.val();
    
    for (const [key, user] of Object.entries(users)) {
      if (user.id === decoded.userId) {
        const { password, firebase_key, ...userData } = user;
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

