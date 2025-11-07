const { init, getDb, close } = require('../database/db');

async function migrateBranches() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Add representative information columns
        db.run(`ALTER TABLE branches ADD COLUMN representative_name TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding representative_name:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN representative_position TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding representative_position:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN representative_id_card TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding representative_id_card:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN representative_address TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding representative_address:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN representative_phone TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding representative_phone:', err);
          }
        });

        // Add bank account information columns
        db.run(`ALTER TABLE branches ADD COLUMN account_number TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding account_number:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN account_holder TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding account_holder:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN bank_name TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding bank_name:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN bank_branch TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding bank_branch:', err);
          }
        });

        db.run(`ALTER TABLE branches ADD COLUMN qr_code TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding qr_code:', err);
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
  migrateBranches()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}

module.exports = migrateBranches;

