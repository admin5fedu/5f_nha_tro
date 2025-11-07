import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications', {
        params: {
          pageSize: 20
        }
      });

      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unread_count || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data?.unread_count || 0);
    } catch (err) {
      console.error('Error refreshing unread count:', err);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    if (!notificationId) return;
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    fetchNotifications();
    refreshUnreadCount();

    pollingRef.current = setInterval(() => {
      refreshUnreadCount();
    }, 60 * 1000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user, fetchNotifications, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      removeNotification,
      refreshUnreadCount
    }),
    [notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllAsRead, removeNotification, refreshUnreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;

