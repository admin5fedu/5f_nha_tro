const { init, getDb, close } = require('../database/db');

async function seedRoles() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Check if roles already exist
        db.get('SELECT COUNT(*) as count FROM roles', [], (err, row) => {
          if (err) {
            console.error('Error checking roles:', err);
            return reject(err);
          }

          if (row.count > 0) {
            console.log('⚠️  Roles already exist. Skipping seed.');
            seedUsers(db, resolve, reject);
            return;
          }

          // Insert default roles
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
              permissions: JSON.stringify(['branches', 'rooms', 'tenants', 'contracts', 'invoices', 'transactions', 'financial-categories', 'accounts', 'assets', 'images', 'services', 'vehicles']),
              status: 'active'
            },
            {
              name: 'Nhân viên',
              code: 'user',
              description: 'Nhân viên cơ bản',
              permissions: JSON.stringify(['tenants', 'contracts', 'invoices', 'transactions']),
              status: 'active'
            },
            {
              name: 'Kế toán',
              code: 'accountant',
              description: 'Quản lý tài chính và hóa đơn',
              permissions: JSON.stringify(['invoices', 'transactions', 'financial-categories', 'accounts']),
              status: 'active'
            },
            {
              name: 'Nhân viên văn phòng',
              code: 'office_staff',
              description: 'Xử lý hợp đồng và khách thuê',
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
                } else {
                  console.log(`✅ Inserted role: ${role.name}`);
                }
                completed++;
                if (completed === defaultRoles.length) {
                  stmt.finalize(() => {
                    console.log('✅ All roles inserted');
                    seedUsers(db, resolve, reject);
                  });
                }
              }
            );
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

async function seedUsers(db, resolve, reject) {
  // Check if users already exist (excluding admin)
  db.get('SELECT COUNT(*) as count FROM users WHERE username != ?', ['admin'], async (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return reject(err);
    }

    if (row.count > 0) {
      console.log('⚠️  Users already exist. Skipping seed.');
      close();
      resolve();
      return;
    }

    // Get role IDs
    db.all('SELECT id, code FROM roles', [], async (err, roles) => {
      if (err) {
        console.error('Error fetching roles:', err);
        return reject(err);
      }

      const roleMap = {};
      roles.forEach(role => {
        roleMap[role.code] = role.id;
      });

      // Create sample users
      const sampleUsers = [
        {
          username: 'manager1',
          password: '123456',
          full_name: 'Nguyễn Văn Quản Lý',
          email: 'manager1@example.com',
          phone: '0912345678',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          role: 'manager',
          status: 'active'
        },
        {
          username: 'accountant1',
          password: '123456',
          full_name: 'Trần Thị Kế Toán',
          email: 'accountant1@example.com',
          phone: '0912345679',
          address: '456 Đường XYZ, Quận 2, TP.HCM',
          role: 'accountant',
          status: 'active'
        },
        {
          username: 'staff1',
          password: '123456',
          full_name: 'Lê Văn Nhân Viên',
          email: 'staff1@example.com',
          phone: '0912345680',
          address: '789 Đường DEF, Quận 3, TP.HCM',
          role: 'user',
          status: 'active'
        },
        {
          username: 'office1',
          password: '123456',
          full_name: 'Phạm Thị Văn Phòng',
          email: 'office1@example.com',
          phone: '0912345681',
          address: '321 Đường GHI, Quận 4, TP.HCM',
          role: 'office_staff',
          status: 'active'
        },
        {
          username: 'manager2',
          password: '123456',
          full_name: 'Hoàng Văn Quản Lý 2',
          email: 'manager2@example.com',
          phone: '0912345682',
          address: '654 Đường JKL, Quận 5, TP.HCM',
          role: 'manager',
          status: 'active'
        }
      ];

      const stmt = db.prepare(
        `INSERT INTO users (username, full_name, email, phone, address, role, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      let completed = 0;
      for (const user of sampleUsers) {
        stmt.run(
          user.username,
          user.full_name,
          user.email,
          user.phone,
          user.address,
          user.role,
          user.status,
          (err) => {
            if (err) {
              console.error(`Error inserting user ${user.username}:`, err);
            } else {
              console.log(`✅ Inserted user: ${user.full_name} (${user.role})`);
            }
            completed++;
            if (completed === sampleUsers.length) {
              stmt.finalize(() => {
                console.log('✅ All users inserted');
                close();
                resolve();
              });
            }
          }
        );
      }
    });
  });
}

if (require.main === module) {
  seedRoles()
    .then(() => {
      console.log('✅ Roles and users seed completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Roles and users seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seedRoles };

