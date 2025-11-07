const { init, getDb, close } = require('../database/db');

async function migrateAccounts() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create accounts table
        db.run(`CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'bank',
          account_number TEXT,
          bank_name TEXT,
          bank_branch TEXT,
          account_holder TEXT,
          qr_code TEXT,
          opening_balance REAL DEFAULT 0,
          current_balance REAL DEFAULT 0,
          status TEXT DEFAULT 'active',
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating accounts table:', err);
            reject(err);
            return;
          }
          console.log('✅ Accounts table created successfully');
          resolve();
        });
      });
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    close();
  }
}

if (require.main === module) {
  migrateAccounts()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}

module.exports = migrateAccounts;

