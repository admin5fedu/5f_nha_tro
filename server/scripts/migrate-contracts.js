const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function migrateContracts() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for contracts migration.');
  });

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Check if branch_id column exists
        db.all("PRAGMA table_info(contracts)", (err, columns) => {
          if (err) {
            console.error("Error checking table info:", err.message);
            reject(err);
            return;
          }

          const hasBranchId = columns.some(col => col.name === 'branch_id');

          if (!hasBranchId) {
            // SQLite doesn't support ALTER TABLE ADD COLUMN with FOREIGN KEY directly
            // We need to recreate the table
            console.log("Adding branch_id column to contracts table...");
            
            db.run(`
              CREATE TABLE IF NOT EXISTS contracts_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                branch_id INTEGER NOT NULL,
                room_id INTEGER NOT NULL,
                tenant_id INTEGER NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE,
                monthly_rent REAL NOT NULL,
                deposit REAL DEFAULT 0,
                status TEXT DEFAULT 'active',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches(id),
                FOREIGN KEY (room_id) REFERENCES rooms(id),
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
              )
            `, (err) => {
              if (err) {
                console.error("Error creating new contracts table:", err.message);
                reject(err);
                return;
              }

              // Copy data from old table to new table
              db.run(`
                INSERT INTO contracts_new (id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, notes, created_at)
                SELECT id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, notes, created_at
                FROM contracts
              `, (err) => {
                if (err) {
                  console.error("Error copying data:", err.message);
                  reject(err);
                  return;
                }

                // Drop old table
                db.run(`DROP TABLE contracts`, (err) => {
                  if (err) {
                    console.error("Error dropping old table:", err.message);
                    reject(err);
                    return;
                  }

                  // Rename new table
                  db.run(`ALTER TABLE contracts_new RENAME TO contracts`, (err) => {
                    if (err) {
                      console.error("Error renaming table:", err.message);
                      reject(err);
                      return;
                    }

                    console.log("✅ Contracts migration completed successfully");
                    resolve();
                  });
                });
              });
            });
          } else {
            console.log("✅ branch_id column already exists in contracts table");
            resolve();
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Contracts migration failed:', error);
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
  migrateContracts().then(() => console.log('Migration finished')).catch(console.error);
}

module.exports = migrateContracts;

