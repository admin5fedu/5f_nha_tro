const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function migrateFinancialCategories() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for financial categories migration.');
  });

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Check if financial_categories table exists
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='financial_categories'", (err, tables) => {
          if (err) {
            console.error("Error checking tables:", err.message);
            reject(err);
            return;
          }

          if (tables.length > 0) {
            console.log("✅ Financial categories table already exists.");
            resolve();
            return;
          }

          // Create financial_categories table
          db.run(`
            CREATE TABLE IF NOT EXISTS financial_categories (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              code TEXT UNIQUE,
              type TEXT NOT NULL,
              description TEXT,
              status TEXT DEFAULT 'active',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error("Error creating financial_categories table:", err.message);
              reject(err);
              return;
            }
            console.log("✅ Financial categories table created successfully.");

            // Create indexes
            db.run(`CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type)`, (err) => {
              if (err) {
                console.error("Error creating index:", err.message);
              }
            });

            db.run(`CREATE INDEX IF NOT EXISTS idx_financial_categories_status ON financial_categories(status)`, (err) => {
              if (err) {
                console.error("Error creating index:", err.message);
              } else {
                console.log("✅ Indexes created successfully.");
                resolve();
              }
            });
          });
        });
      });
    });
    console.log('✅ Financial categories migration completed successfully');
  } catch (error) {
    console.error('❌ Financial categories migration failed:', error);
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
  migrateFinancialCategories().then(() => console.log('Migration finished')).catch(console.error);
}

module.exports = migrateFinancialCategories;

