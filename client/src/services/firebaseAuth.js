// Firebase Authentication Helper
import { auth, database } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import bcrypt from 'bcryptjs';

/**
 * Find user by username or email
 */
const findUserByIdentifier = async (identifier) => {
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
    
    // Create a mock token (in real app, you'd use Firebase Custom Tokens)
    const token = btoa(JSON.stringify({ 
      userId: user.id, 
      username: user.username,
      timestamp: Date.now() 
    }));
    
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

