const { init, getDb, close } = require('../database/db');

async function migratePermissions() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create permissions table
        db.run(`CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          module_code TEXT NOT NULL,
          module_name TEXT NOT NULL,
          action TEXT NOT NULL,
          action_name TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(module_code, action)
        )`, (err) => {
          if (err) {
            console.error('Error creating permissions table:', err);
            return reject(err);
          }
        });

        // Create role_permissions table (many-to-many)
        db.run(`CREATE TABLE IF NOT EXISTS role_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
          UNIQUE(role_id, permission_id)
        )`, (err) => {
          if (err) {
            console.error('Error creating role_permissions table:', err);
            return reject(err);
          }
        });

        // Insert default permissions
        db.get('SELECT COUNT(*) as count FROM permissions', [], (err, row) => {
          if (err) {
            console.error('Error checking permissions:', err);
            setTimeout(() => {
              console.log('✅ Migration completed (with errors)');
              resolve();
            }, 1000);
            return;
          }

          // Always insert permissions (will skip duplicates due to UNIQUE constraint)
          const shouldInsert = row.count === 0;
          if (!shouldInsert) {
            console.log('⚠️  Permissions already exist. Adding new permissions if any...');
          }

          const defaultPermissions = [
            // Branches
            { module_code: 'branches', module_name: 'Chi nhánh', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết chi nhánh' },
            { module_code: 'branches', module_name: 'Chi nhánh', action: 'create', action_name: 'Tạo mới', description: 'Tạo chi nhánh mới' },
            { module_code: 'branches', module_name: 'Chi nhánh', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin chi nhánh' },
            { module_code: 'branches', module_name: 'Chi nhánh', action: 'delete', action_name: 'Xóa', description: 'Xóa chi nhánh' },
            
            // Rooms
            { module_code: 'rooms', module_name: 'Phòng trọ', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết phòng trọ' },
            { module_code: 'rooms', module_name: 'Phòng trọ', action: 'create', action_name: 'Tạo mới', description: 'Tạo phòng trọ mới' },
            { module_code: 'rooms', module_name: 'Phòng trọ', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin phòng trọ' },
            { module_code: 'rooms', module_name: 'Phòng trọ', action: 'delete', action_name: 'Xóa', description: 'Xóa phòng trọ' },
            
            // Tenants
            { module_code: 'tenants', module_name: 'Khách thuê', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết khách thuê' },
            { module_code: 'tenants', module_name: 'Khách thuê', action: 'create', action_name: 'Tạo mới', description: 'Tạo khách thuê mới' },
            { module_code: 'tenants', module_name: 'Khách thuê', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin khách thuê' },
            { module_code: 'tenants', module_name: 'Khách thuê', action: 'delete', action_name: 'Xóa', description: 'Xóa khách thuê' },
            
            // Contracts
            { module_code: 'contracts', module_name: 'Hợp đồng', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết hợp đồng' },
            { module_code: 'contracts', module_name: 'Hợp đồng', action: 'create', action_name: 'Tạo mới', description: 'Tạo hợp đồng mới' },
            { module_code: 'contracts', module_name: 'Hợp đồng', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin hợp đồng' },
            { module_code: 'contracts', module_name: 'Hợp đồng', action: 'delete', action_name: 'Xóa', description: 'Xóa hợp đồng' },
            { module_code: 'contracts', module_name: 'Hợp đồng', action: 'export', action_name: 'Xuất', description: 'Xuất hợp đồng ra file PDF/DOC' },
            { module_code: 'contracts', module_name: 'Hợp đồng', action: 'print', action_name: 'In', description: 'In hợp đồng' },
            
            // Invoices
            { module_code: 'invoices', module_name: 'Hóa đơn', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết hóa đơn' },
            { module_code: 'invoices', module_name: 'Hóa đơn', action: 'create', action_name: 'Tạo mới', description: 'Tạo hóa đơn mới' },
            { module_code: 'invoices', module_name: 'Hóa đơn', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin hóa đơn' },
            { module_code: 'invoices', module_name: 'Hóa đơn', action: 'delete', action_name: 'Xóa', description: 'Xóa hóa đơn' },
            { module_code: 'invoices', module_name: 'Hóa đơn', action: 'export', action_name: 'Xuất', description: 'Xuất hóa đơn ra file PDF/DOC' },
            { module_code: 'invoices', module_name: 'Hóa đơn', action: 'print', action_name: 'In', description: 'In hóa đơn' },
            
            // Transactions
            { module_code: 'transactions', module_name: 'Sổ thu chi', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết giao dịch' },
            { module_code: 'transactions', module_name: 'Sổ thu chi', action: 'create', action_name: 'Tạo mới', description: 'Tạo giao dịch mới' },
            { module_code: 'transactions', module_name: 'Sổ thu chi', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin giao dịch' },
            { module_code: 'transactions', module_name: 'Sổ thu chi', action: 'delete', action_name: 'Xóa', description: 'Xóa giao dịch' },
            { module_code: 'transactions', module_name: 'Sổ thu chi', action: 'export', action_name: 'Xuất', description: 'Xuất phiếu thu chi ra file PDF/DOC' },
            { module_code: 'transactions', module_name: 'Sổ thu chi', action: 'print', action_name: 'In', description: 'In phiếu thu chi' },
            
            // Financial Categories
            { module_code: 'financial-categories', module_name: 'Danh mục tài chính', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết danh mục tài chính' },
            { module_code: 'financial-categories', module_name: 'Danh mục tài chính', action: 'create', action_name: 'Tạo mới', description: 'Tạo danh mục tài chính mới' },
            { module_code: 'financial-categories', module_name: 'Danh mục tài chính', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin danh mục tài chính' },
            { module_code: 'financial-categories', module_name: 'Danh mục tài chính', action: 'delete', action_name: 'Xóa', description: 'Xóa danh mục tài chính' },
            
            // Accounts
            { module_code: 'accounts', module_name: 'Tài khoản', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết tài khoản' },
            { module_code: 'accounts', module_name: 'Tài khoản', action: 'create', action_name: 'Tạo mới', description: 'Tạo tài khoản mới' },
            { module_code: 'accounts', module_name: 'Tài khoản', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin tài khoản' },
            { module_code: 'accounts', module_name: 'Tài khoản', action: 'delete', action_name: 'Xóa', description: 'Xóa tài khoản' },
            
            // Assets
            { module_code: 'assets', module_name: 'Tài sản', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết tài sản' },
            { module_code: 'assets', module_name: 'Tài sản', action: 'create', action_name: 'Tạo mới', description: 'Tạo tài sản mới' },
            { module_code: 'assets', module_name: 'Tài sản', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin tài sản' },
            { module_code: 'assets', module_name: 'Tài sản', action: 'delete', action_name: 'Xóa', description: 'Xóa tài sản' },
            
            // Images
            { module_code: 'images', module_name: 'Hình ảnh', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết hình ảnh' },
            { module_code: 'images', module_name: 'Hình ảnh', action: 'create', action_name: 'Tạo mới', description: 'Tải hình ảnh mới' },
            { module_code: 'images', module_name: 'Hình ảnh', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin hình ảnh' },
            { module_code: 'images', module_name: 'Hình ảnh', action: 'delete', action_name: 'Xóa', description: 'Xóa hình ảnh' },
            
            // Services
            { module_code: 'services', module_name: 'Dịch vụ', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết dịch vụ' },
            { module_code: 'services', module_name: 'Dịch vụ', action: 'create', action_name: 'Tạo mới', description: 'Tạo dịch vụ mới' },
            { module_code: 'services', module_name: 'Dịch vụ', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin dịch vụ' },
            { module_code: 'services', module_name: 'Dịch vụ', action: 'delete', action_name: 'Xóa', description: 'Xóa dịch vụ' },
            
            // Vehicles
            { module_code: 'vehicles', module_name: 'Phương tiện', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết phương tiện' },
            { module_code: 'vehicles', module_name: 'Phương tiện', action: 'create', action_name: 'Tạo mới', description: 'Tạo phương tiện mới' },
            { module_code: 'vehicles', module_name: 'Phương tiện', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin phương tiện' },
            { module_code: 'vehicles', module_name: 'Phương tiện', action: 'delete', action_name: 'Xóa', description: 'Xóa phương tiện' },
            
            // Users
            { module_code: 'users', module_name: 'Nhân viên', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết nhân viên' },
            { module_code: 'users', module_name: 'Nhân viên', action: 'create', action_name: 'Tạo mới', description: 'Tạo nhân viên mới' },
            { module_code: 'users', module_name: 'Nhân viên', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin nhân viên' },
            { module_code: 'users', module_name: 'Nhân viên', action: 'delete', action_name: 'Xóa', description: 'Xóa nhân viên' },
            
            // Roles
            { module_code: 'roles', module_name: 'Vai trò', action: 'view', action_name: 'Xem', description: 'Xem danh sách và chi tiết vai trò' },
            { module_code: 'roles', module_name: 'Vai trò', action: 'create', action_name: 'Tạo mới', description: 'Tạo vai trò mới' },
            { module_code: 'roles', module_name: 'Vai trò', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin vai trò' },
            { module_code: 'roles', module_name: 'Vai trò', action: 'delete', action_name: 'Xóa', description: 'Xóa vai trò' },
            
            // Settings
            { module_code: 'settings', module_name: 'Thiết lập', action: 'view', action_name: 'Xem', description: 'Xem thông tin thiết lập' },
            { module_code: 'settings', module_name: 'Thiết lập', action: 'update', action_name: 'Cập nhật', description: 'Cập nhật thông tin thiết lập' },
            
            // Dashboard
            { module_code: 'dashboard', module_name: 'Tổng quan', action: 'view', action_name: 'Xem', description: 'Xem dashboard tổng quan' },
          ];

          const stmt = db.prepare(
            `INSERT OR IGNORE INTO permissions (module_code, module_name, action, action_name, description, status) 
             VALUES (?, ?, ?, ?, ?, ?)`
          );

          let completed = 0;
          let inserted = 0;
          defaultPermissions.forEach((perm) => {
            stmt.run(
              perm.module_code,
              perm.module_name,
              perm.action,
              perm.action_name,
              perm.description || null,
              'active',
              function(err) {
                if (err) {
                  console.error(`Error inserting permission ${perm.module_code}.${perm.action}:`, err);
                } else if (this.changes > 0) {
                  console.log(`✅ Inserted permission: ${perm.module_code}.${perm.action}`);
                  inserted++;
                }
                completed++;
                if (completed === defaultPermissions.length) {
                  stmt.finalize((err) => {
                    if (err) {
                      console.error('Error finalizing statement:', err);
                    }
                    console.log(`✅ Processed ${defaultPermissions.length} permissions (${inserted} new)`);
                    setTimeout(() => {
                      console.log('✅ Migration completed successfully');
                      resolve();
                    }, 1000);
                  });
                }
              }
            );
          });
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
  migratePermissions()
    .then(() => {
      console.log('✅ Permissions migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Permissions migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migratePermissions };

