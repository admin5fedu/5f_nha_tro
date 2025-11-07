const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function migrateTransactions() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
  });

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if transactions table exists
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'", (err, tables) => {
        if (err) {
          console.error("Error checking tables:", err.message);
          db.close();
          reject(err);
          return;
        }

        if (tables.length > 0) {
          console.log("✅ Transactions table already exists.");
          db.close();
          resolve();
          return;
        }

        // Create transactions table
        db.run(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_number TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL, -- 'income' or 'expense'
            category_id INTEGER,
            account_id INTEGER NOT NULL,
            invoice_id INTEGER,
            contract_id INTEGER,
            amount REAL NOT NULL,
            transaction_date DATE NOT NULL,
            payment_method TEXT DEFAULT 'cash',
            description TEXT,
            notes TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES financial_categories(id),
            FOREIGN KEY (account_id) REFERENCES accounts(id),
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `, (err) => {
          if (err) {
            console.error("Error creating transactions table:", err.message);
            db.close();
            reject(err);
            return;
          }
          console.log("✅ Transactions table created successfully.");

          // Create indexes
          db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`, (err) => {
            if (err) {
              console.error("Error creating index:", err.message);
            }
          });

          db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)`, (err) => {
            if (err) {
              console.error("Error creating index:", err.message);
            }
          });

          db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)`, (err) => {
            if (err) {
              console.error("Error creating index:", err.message);
            }
          });

          db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)`, (err) => {
            if (err) {
              console.error("Error creating index:", err.message);
            } else {
              console.log("✅ Indexes created successfully.");
              db.close();
              resolve();
            }
          });
        });
      });
    });
  });
}

if (require.main === module) {
  migrateTransactions()
    .then(() => {
      console.log('✅ Transactions migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Transactions migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateTransactions };

