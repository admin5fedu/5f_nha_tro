const { getDb } = require('../database/db');
const dbModule = require('../database/db');

async function migrateUsers() {
  await dbModule.init();
  const db = dbModule.getDb();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Add new columns to users table if they don't exist
      db.run(`ALTER TABLE users ADD COLUMN email TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN address TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`, () => {});
      
      // Update full_name to NOT NULL if it's NULL
      db.run(`UPDATE users SET full_name = username WHERE full_name IS NULL`, () => {});
      
      // Create user_branches table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS user_branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        UNIQUE(user_id, branch_id)
      )`, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.error('Error creating user_branches table:', err);
        }
      });

      // Create indexes
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_branches_user ON user_branches(user_id)`, () => {});
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_branches_branch ON user_branches(branch_id)`, () => {});

      setTimeout(() => {
        console.log('✅ Migration completed successfully!');
        resolve();
      }, 1000);
    });
  });
}

// Run migration if called directly
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('Users table migration completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error migrating users table:', err);
      process.exit(1);
    });
}

module.exports = { migrateUsers };

