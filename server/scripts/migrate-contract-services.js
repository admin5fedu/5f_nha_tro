const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function migrateContractServices() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for contract_services migration.');
  });

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Check if quantity column exists
        db.all("PRAGMA table_info(contract_services)", (err, columns) => {
          if (err) {
            console.error("Error checking table info:", err.message);
            reject(err);
            return;
          }

          const hasQuantity = columns.some(col => col.name === 'quantity');

          if (!hasQuantity) {
            // Add quantity column
            db.run(`
              ALTER TABLE contract_services ADD COLUMN quantity REAL DEFAULT 1;
            `, (err) => {
              if (err && !err.message.includes('duplicate column name')) {
                console.error("Error adding column 'quantity':", err.message);
                reject(err);
                return;
              } else if (!err) {
                console.log("Column 'quantity' added to contract_services table.");
              }
              resolve();
            });
          } else {
            console.log("✅ quantity column already exists in contract_services table");
            resolve();
          }
        });
      });
    });
    console.log('✅ Contract services migration completed successfully');
  } catch (error) {
    console.error('❌ Contract services migration failed:', error);
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
  migrateContractServices().then(() => console.log('Migration finished')).catch(console.error);
}

module.exports = migrateContractServices;

