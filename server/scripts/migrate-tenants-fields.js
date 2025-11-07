const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function migrateTenantsFields() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for tenants fields migration.');
  });

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Add hometown column
        db.run(`
          ALTER TABLE tenants ADD COLUMN hometown TEXT;
        `, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column 'hometown':", err.message);
          } else if (!err) {
            console.log("Column 'hometown' added to tenants table.");
          }
        });

        // Add temporary_residence_registration column (has_temp_residence)
        db.run(`
          ALTER TABLE tenants ADD COLUMN has_temp_residence TEXT DEFAULT 'no';
        `, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column 'has_temp_residence':", err.message);
          } else if (!err) {
            console.log("Column 'has_temp_residence' added to tenants table.");
          }
          resolve();
        });
      });
    });
    console.log('✅ Tenants fields migration completed successfully');
  } catch (error) {
    console.error('❌ Tenants fields migration failed:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

if (require.main === module) {
  migrateTenantsFields().then(() => console.log('Migration finished')).catch(console.error);
}

module.exports = migrateTenantsFields;

