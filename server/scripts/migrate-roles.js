const { init, getDb, close } = require('../database/db');

async function migrateRoles() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create roles table
        db.run(`CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          description TEXT,
          permissions TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating roles table:', err);
            return reject(err);
          }
        });

        // Insert default roles if not exists
        db.get('SELECT COUNT(*) as count FROM roles', [], (err, row) => {
          if (err) {
            console.error('Error checking roles:', err);
            setTimeout(() => {
              console.log('✅ Migration completed (with errors)');
              resolve();
            }, 1000);
            return;
          }

          if (row.count === 0) {
            const defaultRoles = [
              {
                name: 'Quản trị viên',
                code: 'admin',
                description: 'Quyền truy cập đầy đủ hệ thống',
                permissions: JSON.stringify(['*']),
                status: 'active'
              },
              {
                name: 'Quản lý',
                code: 'manager',
                description: 'Quản lý chi nhánh và phòng trọ',
                permissions: JSON.stringify(['branches', 'rooms', 'tenants', 'contracts', 'invoices', 'transactions']),
                status: 'active'
              },
              {
                name: 'Nhân viên',
                code: 'user',
                description: 'Nhân viên cơ bản',
                permissions: JSON.stringify(['tenants', 'contracts', 'invoices']),
                status: 'active'
              }
            ];

            const stmt = db.prepare(
              `INSERT INTO roles (name, code, description, permissions, status) VALUES (?, ?, ?, ?, ?)`
            );

            let completed = 0;
            defaultRoles.forEach((role) => {
              stmt.run(
                role.name,
                role.code,
                role.description,
                role.permissions,
                role.status,
                (err) => {
                  if (err) {
                    console.error(`Error inserting role ${role.code}:`, err);
                  }
                  completed++;
                  if (completed === defaultRoles.length) {
                    stmt.finalize(() => {
                      setTimeout(() => {
                        console.log('✅ Default roles inserted');
                        console.log('✅ Migration completed successfully');
                        resolve();
                      }, 1000);
                    });
                  }
                }
              );
            });
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
  migrateRoles()
    .then(() => {
      console.log('✅ Roles migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Roles migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateRoles };

