const { init, getDb, close } = require('../database/db');

async function migrateBranchesAccount() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Add account_id column to branches table
        db.run(`ALTER TABLE branches ADD COLUMN account_id INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding account_id:', err);
          }
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_branches_account ON branches(account_id)`, (err) => {
          if (err) {
            console.error('Error creating index:', err);
          }
        });

        setTimeout(() => {
          console.log('✅ Migration completed successfully');
          resolve();
        }, 1000);
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
  migrateBranchesAccount()
    .then(() => {
      console.log('✅ Branches account migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Branches account migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateBranchesAccount };

