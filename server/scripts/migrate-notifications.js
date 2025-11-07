const dbModule = require('../database/db');

async function migrateNotifications() {
  await dbModule.init();
  const db = dbModule.getDb();

  return new Promise((resolve) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT,
        type TEXT,
        link_type TEXT,
        link_id INTEGER,
        metadata TEXT,
        unique_key TEXT UNIQUE,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`);

      db.run(`ALTER TABLE notifications ADD COLUMN unique_key TEXT`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS notification_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_read INTEGER DEFAULT 0,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(notification_id, user_id)
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_notification_recipients_user ON notification_recipients(user_id, is_read)`);

      console.log('✅ Notifications tables migrated successfully');
      resolve();
    });
  });
}

migrateNotifications()
  .catch((err) => {
    console.error('❌ Error migrating notifications tables:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbModule.close();
    process.exit();
  });

