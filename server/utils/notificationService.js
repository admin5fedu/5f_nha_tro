const { getDb } = require('../database/db');

const findNotificationByUniqueKey = (uniqueKey) => {
  if (!uniqueKey) return Promise.resolve(null);
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM notifications WHERE unique_key = ?`,
      [uniqueKey],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row?.id || null);
      }
    );
  });
};

const insertNotification = async ({ title, body, type, linkType, linkId, metadata, createdBy, uniqueKey }) => {
  const db = getDb();

  if (uniqueKey) {
    const existingId = await findNotificationByUniqueKey(uniqueKey);
    if (existingId) {
      return existingId;
    }
  }

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO notifications (title, body, type, link_type, link_id, metadata, unique_key, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        body || null,
        type || null,
        linkType || null,
        linkId || null,
        metadata ? JSON.stringify(metadata) : null,
        uniqueKey || null,
        createdBy || null
      ],
      function (err) {
        if (err) {
          if (uniqueKey && err.message.includes('UNIQUE constraint failed')) {
            findNotificationByUniqueKey(uniqueKey)
              .then((id) => resolve(id))
              .catch(reject);
          } else {
            reject(err);
          }
          return;
        }
        resolve(this.lastID);
      }
    );
  });
};

const insertRecipients = (notificationId, recipients = []) => {
  if (!notificationId || !Array.isArray(recipients) || recipients.length === 0) {
    return Promise.resolve();
  }

  const uniqueRecipientIds = [...new Set(recipients.filter(Boolean))];
  if (uniqueRecipientIds.length === 0) {
    return Promise.resolve();
  }

  const db = getDb();
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO notification_recipients (notification_id, user_id)
       VALUES (?, ?)`
    );

    uniqueRecipientIds.forEach((userId) => {
      stmt.run([notificationId, userId]);
    });

    stmt.finalize((err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

const createNotification = async ({
  title,
  body,
  type,
  linkType,
  linkId,
  metadata,
  recipients,
  createdBy,
  uniqueKey
}) => {
  if (!title) {
    throw new Error('Notification title is required');
  }

  const notificationId = await insertNotification({
    title,
    body,
    type,
    linkType,
    linkId,
    metadata,
    createdBy,
    uniqueKey
  });

  await insertRecipients(notificationId, recipients);
  return notificationId;
};

const markNotificationRead = (notificationId, userId) => {
  if (!notificationId || !userId) return Promise.resolve();
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notification_recipients
       SET is_read = 1, read_at = CURRENT_TIMESTAMP
       WHERE notification_id = ? AND user_id = ?`,
      [notificationId, userId],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes > 0);
      }
    );
  });
};

const markAllNotificationsRead = (userId) => {
  if (!userId) return Promise.resolve();
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notification_recipients
       SET is_read = 1, read_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND is_read = 0`,
      [userId],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes || 0);
      }
    );
  });
};

const getNotificationsForUser = ({ userId, limit = 20, offset = 0, isRead, type }) => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    let query = `
      SELECT n.*, nr.is_read, nr.read_at
      FROM notification_recipients nr
      JOIN notifications n ON nr.notification_id = n.id
      WHERE nr.user_id = ?
    `;
    const params = [userId];

    if (typeof isRead === 'boolean') {
      query += ' AND nr.is_read = ?';
      params.push(isRead ? 1 : 0);
    }

    if (type) {
      query += ' AND n.type = ?';
      params.push(type);
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        return reject(err);
      }

      const notifications = rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        type: row.type,
        link_type: row.link_type,
        link_id: row.link_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        created_by: row.created_by,
        created_at: row.created_at,
        is_read: Boolean(row.is_read),
        read_at: row.read_at
      }));

      resolve(notifications);
    });
  });
};

const deleteNotificationForUser = ({ notificationId, userId }) => {
  if (!notificationId || !userId) return Promise.resolve();
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM notification_recipients WHERE notification_id = ? AND user_id = ?`,
      [notificationId, userId],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes > 0);
      }
    );
  });
};

const getUnreadCount = (userId) => {
  if (!userId) return Promise.resolve(0);
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM notification_recipients WHERE user_id = ? AND is_read = 0`,
      [userId],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row?.count || 0);
      }
    );
  });
};

module.exports = {
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationsForUser,
  deleteNotificationForUser,
  getUnreadCount
};

