const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function migrateInvoices() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for invoices migration.');
  });

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Check if invoices table exists
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'", (err, tables) => {
          if (err) {
            console.error("Error checking tables:", err.message);
            reject(err);
            return;
          }

          if (tables.length === 0) {
            console.log("⚠️  Invoices table does not exist. Please run database initialization first.");
            resolve();
            return;
          }

          // Check existing columns
          db.all("PRAGMA table_info(invoices)", (err, columns) => {
            if (err) {
              console.error("Error checking table info:", err.message);
              reject(err);
              return;
            }

            const hasActualDays = columns.some(col => col.name === 'actual_days');

            if (!hasActualDays) {
              db.run(`ALTER TABLE invoices ADD COLUMN actual_days INTEGER;`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                  console.error("Error adding column 'actual_days':", err.message);
                } else if (!err) {
                  console.log("Column 'actual_days' added to invoices table.");
                }
                
                // Check invoice_services table
                checkInvoiceServices(resolve);
              });
            } else {
              // Check invoice_services table even if actual_days already exists
              checkInvoiceServices(resolve);
            }
          });
        });
      });
    });
    console.log('✅ Invoices migration completed successfully');
  } catch (error) {
    console.error('❌ Invoices migration failed:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }

  function checkInvoiceServices(resolve) {
    db.all("PRAGMA table_info(invoice_services)", (err, serviceColumns) => {
      if (err) {
        console.error("Error checking invoice_services table info:", err.message);
        resolve();
        return;
      }

      const hasMeterStart = serviceColumns.some(col => col.name === 'meter_start');
      const hasMeterEnd = serviceColumns.some(col => col.name === 'meter_end');
      const hasMeterUsage = serviceColumns.some(col => col.name === 'meter_usage');

      let completed = 0;
      const total = (!hasMeterStart ? 1 : 0) + (!hasMeterEnd ? 1 : 0) + (!hasMeterUsage ? 1 : 0);

      if (total === 0) {
        resolve();
        return;
      }

      const checkComplete = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };

      if (!hasMeterStart) {
        db.run(`ALTER TABLE invoice_services ADD COLUMN meter_start REAL;`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column 'meter_start':", err.message);
          } else if (!err) {
            console.log("Column 'meter_start' added to invoice_services table.");
          }
          checkComplete();
        });
      }

      if (!hasMeterEnd) {
        db.run(`ALTER TABLE invoice_services ADD COLUMN meter_end REAL;`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column 'meter_end':", err.message);
          } else if (!err) {
            console.log("Column 'meter_end' added to invoice_services table.");
          }
          checkComplete();
        });
      }

      if (!hasMeterUsage) {
        db.run(`ALTER TABLE invoice_services ADD COLUMN meter_usage REAL;`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column 'meter_usage':", err.message);
          } else if (!err) {
            console.log("Column 'meter_usage' added to invoice_services table.");
          }
          checkComplete();
        });
      }
    });
  }
}

if (require.main === module) {
  migrateInvoices().then(() => console.log('Migration finished')).catch(console.error);
}

module.exports = migrateInvoices;
