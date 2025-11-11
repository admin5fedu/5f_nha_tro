const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/nhatro.db');
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });

const migrate = async () => {
  console.log('🔄 Removing password column from users table...');
  await run('BEGIN TRANSACTION');
  try {
    await run('ALTER TABLE users RENAME TO users_backup');

    await run(
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await run(
      `INSERT INTO users (id, username, full_name, email, phone, address, role, status, created_at)
       SELECT id, username, full_name, email, phone, address, role, status, created_at
       FROM users_backup`
    );

    await run('DROP TABLE users_backup');
    await run('COMMIT');
    console.log('✅ Password column removed successfully.');
  } catch (error) {
    console.error('❌ Migration failed, rolling back.', error);
    await run('ROLLBACK');
  } finally {
    db.close();
  }
};

migrate();

