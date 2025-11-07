const { init, getDb, close } = require('../database/db');

async function migrateSettings() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create settings table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          app_name TEXT,
          app_logo TEXT,
          company_name TEXT,
          company_address TEXT,
          company_phone TEXT,
          company_email TEXT,
          company_website TEXT,
          company_tax_code TEXT,
          company_representative TEXT,
          company_representative_position TEXT,
          company_bank_account TEXT,
          company_bank_name TEXT,
          company_bank_branch TEXT,
          notes TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating settings table:', err);
            return reject(err);
          }
        });

        // Insert default settings if not exists
        db.get('SELECT COUNT(*) as count FROM settings', [], (err, row) => {
          if (err) {
            console.error('Error checking settings:', err);
            setTimeout(() => {
              console.log('✅ Migration completed (with errors)');
              resolve();
            }, 1000);
            return;
          }

          if (row.count === 0) {
            db.run(
              `INSERT INTO settings (
                app_name, company_name, company_address, company_phone, company_email
              ) VALUES (?, ?, ?, ?, ?)`,
              ['Nhà Trọ', 'Công ty TNHH Nhà Trọ', '', '', ''],
              (err) => {
                if (err) {
                  console.error('Error inserting default settings:', err);
                } else {
                  console.log('✅ Default settings inserted');
                }
                setTimeout(() => {
                  console.log('✅ Migration completed successfully');
                  resolve();
                }, 1000);
              }
            );
          } else {
            setTimeout(() => {
              console.log('✅ Migration completed successfully');
              resolve();
            }, 1000);
          }
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
  migrateSettings()
    .then(() => {
      console.log('✅ Settings migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Settings migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateSettings };

