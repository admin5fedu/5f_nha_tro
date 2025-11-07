const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function migrateTenants() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for tenants migration.');
  });

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Add tenant_type column
        db.run(`
          ALTER TABLE tenants ADD COLUMN tenant_type TEXT DEFAULT 'owner';
        `, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column 'tenant_type':", err.message);
          } else if (!err) {
            console.log("Column 'tenant_type' added to tenants table.");
          }
        });

        // Add owner_tenant_id column
        db.run(`
          ALTER TABLE tenants ADD COLUMN owner_tenant_id INTEGER;
        `, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column 'owner_tenant_id':", err.message);
          } else if (!err) {
            console.log("Column 'owner_tenant_id' added to tenants table.");
          }
        });

        // Add foreign key constraint (SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we'll note it)
        // The foreign key will be enforced at application level
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_tenant_id);
        `, (err) => {
          if (err) {
            console.error("Error creating index:", err.message);
          } else {
            console.log("Index 'idx_tenants_owner' created.");
          }
          resolve();
        });
      });
    });
    console.log('✅ Tenants migration completed successfully');
  } catch (error) {
    console.error('❌ Tenants migration failed:', error);
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
  migrateTenants().then(() => console.log('Migration finished')).catch(console.error);
}

module.exports = migrateTenants;

