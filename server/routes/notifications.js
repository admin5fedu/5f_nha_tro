const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const {
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationsForUser,
  deleteNotificationForUser,
  getUnreadCount
} = require('../utils/notificationService');

const router = express.Router();

router.use(authenticateToken);

const ensureSampleNotifications = async () => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM notifications', [], async (err, row) => {
      if (err) {
        return reject(err);
      }
      if (row?.count > 0) {
        return resolve();
      }

      try {
        const recipients = await new Promise((recipientResolve, recipientReject) => {
          db.all(
            `SELECT id FROM users WHERE status IS NULL OR status = 'active' ORDER BY id LIMIT 10`,
            [],
            (recipientErr, recipientRows) => {
              if (recipientErr) {
                return recipientReject(recipientErr);
              }
              recipientResolve((recipientRows || []).map((item) => item.id));
            }
          );
        });

        if (!recipients || recipients.length === 0) {
          console.warn('Skipping sample notification seeding: no active users found.');
          return resolve();
        }

        const samples = [
          {
            title: 'Chào mừng bạn đến Nhà Trọ An Bình',
            body: 'Bắt đầu theo dõi thông tin hệ thống và cập nhật dữ liệu mới nhất.',
            type: 'system.welcome',
            uniqueKey: 'seed:welcome'
          },
          {
            title: 'Mẹo sử dụng',
            body: 'Bạn có thể xem nhanh các hợp đồng sắp hết hạn trong phần Tổng quan.',
            type: 'system.tip',
            uniqueKey: 'seed:tip'
          },
          {
            title: 'Cập nhật mới',
            body: 'Tính năng thông báo đã sẵn sàng. Hãy theo dõi các thông báo quan trọng tại đây.',
            type: 'system.update',
            uniqueKey: 'seed:update'
          }
        ];

        for (const sample of samples) {
          await createNotification({
            ...sample,
            linkType: null,
            linkId: null,
            metadata: null,
            recipients,
            createdBy: null
          });
        }
        resolve();
      } catch (seedErr) {
        reject(seedErr);
      }
    });
  });
};

router.get('/', async (req, res) => {
  try {
    await ensureSampleNotifications();
    const { page = 1, pageSize = 20, type, is_read } = req.query;
    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const offset = ((parseInt(page, 10) || 1) - 1) * limit;
    const filters = {
      userId: req.user.id,
      limit,
      offset
    };

    if (typeof is_read !== 'undefined') {
      filters.isRead = is_read === 'true' || is_read === '1';
    }

    if (type) {
      filters.type = type;
    }

    const [notifications, unreadCount] = await Promise.all([
      getNotificationsForUser(filters),
      getUnreadCount(req.user.id)
    ]);

    res.json({
      notifications,
      unread_count: unreadCount,
      page: parseInt(page, 10) || 1,
      page_size: limit
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Không thể tải thông báo' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ unread_count: count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ error: 'Không thể lấy số lượng thông báo chưa đọc' });
  }
});

router.post('/', async (req, res) => {
  const { title, body, type, linkType, linkId, metadata, recipients, uniqueKey } = req.body;
  try {
    const notificationId = await createNotification({
      title,
      body,
      type,
      linkType,
      linkId,
      metadata,
      recipients,
      createdBy: req.user?.id,
      uniqueKey
    });

    res.status(201).json({ id: notificationId });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Không thể tạo thông báo' });
  }
});

router.patch('/:id/read', async (req, res) => {
  const notificationId = parseInt(req.params.id, 10);
  if (!notificationId) {
    return res.status(400).json({ error: 'notification_id không hợp lệ' });
  }

  try {
    await markNotificationRead(notificationId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái thông báo' });
  }
});

router.patch('/mark-all-read', async (req, res) => {
  try {
    const updated = await markAllNotificationsRead(req.user.id);
    res.json({ success: true, updated });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ error: 'Không thể đánh dấu đã đọc' });
  }
});

router.delete('/:id', async (req, res) => {
  const notificationId = parseInt(req.params.id, 10);
  if (!notificationId) {
    return res.status(400).json({ error: 'notification_id không hợp lệ' });
  }

  try {
    await deleteNotificationForUser({ notificationId, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Không thể xoá thông báo' });
  }
});

module.exports = router;

