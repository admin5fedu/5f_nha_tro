const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'nhatro.db');
let db;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      }
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // User-Branches relationship table (many-to-many)
      db.run(`CREATE TABLE IF NOT EXISTS user_branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        UNIQUE(user_id, branch_id)
      )`);

      // Branches table
      db.run(`CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        manager_name TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Rooms table
      db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER NOT NULL,
        room_number TEXT NOT NULL,
        floor INTEGER,
        area REAL,
        price REAL NOT NULL,
        deposit REAL DEFAULT 0,
        status TEXT DEFAULT 'available',
        description TEXT,
        amenities TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )`);

      // Tenants table
      db.run(`CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        id_card TEXT,
        address TEXT,
        hometown TEXT,
        emergency_contact TEXT,
        has_temp_residence TEXT DEFAULT 'no',
        notes TEXT,
        tenant_type TEXT DEFAULT 'owner',
        owner_tenant_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
      )`);

      // Contracts table
      db.run(`CREATE TABLE IF NOT EXISTS contracts (
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
      )`);

      // Payments table
      db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_type TEXT DEFAULT 'rent',
        payment_date DATE NOT NULL,
        due_date DATE,
        status TEXT DEFAULT 'paid',
        payment_method TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES contracts(id)
      )`);

      // Accounts table
      db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        account_number TEXT,
        account_holder TEXT,
        bank_name TEXT,
        bank_branch TEXT,
        qr_code TEXT,
        opening_balance REAL DEFAULT 0,
        current_balance REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Assets table
      db.run(`CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        value REAL DEFAULT 0,
        status TEXT DEFAULT 'good',
        purchase_date DATE,
        location_type TEXT NOT NULL,
        room_id INTEGER,
        branch_id INTEGER,
        serial_number TEXT,
        manufacturer TEXT,
        model TEXT,
        warranty_expiry DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
      )`);

      // Images table
      db.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        location_type TEXT NOT NULL,
        room_id INTEGER,
        branch_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
      )`);

      // Services table
      db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        unit TEXT NOT NULL, -- 'meter' (đồng hồ) or 'quantity' (số lượng)
        unit_name TEXT NOT NULL, -- 'kWh', 'm3', 'tháng', etc.
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Contract Services table (many-to-many)
      db.run(`CREATE TABLE IF NOT EXISTS contract_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        price REAL NOT NULL,
        quantity REAL DEFAULT 1,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        UNIQUE(contract_id, service_id)
      )`);

      // Vehicles table
      db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        vehicle_type TEXT NOT NULL, -- 'motorcycle', 'bicycle', 'car', 'other'
        brand TEXT,
        model TEXT,
        license_plate TEXT,
        color TEXT,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )`);

      // Ensure vehicles table has image_url column for existing databases
      db.run(`ALTER TABLE vehicles ADD COLUMN image_url TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding image_url column to vehicles table:', err.message);
        }
      });

      // Invoices table
      db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER NOT NULL,
        invoice_number TEXT UNIQUE NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        period_month INTEGER NOT NULL,
        period_year INTEGER NOT NULL,
        actual_days INTEGER, -- Số ngày thực tế ở (để tính giảm trừ)
        rent_amount REAL NOT NULL,
        service_amount REAL DEFAULT 0,
        previous_debt REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        remaining_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue'
        qr_code TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
      )`);

      // Invoice Services table (many-to-many)
      db.run(`CREATE TABLE IF NOT EXISTS invoice_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        service_name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity REAL DEFAULT 1,
        amount REAL NOT NULL,
        meter_start REAL, -- Số đồng hồ đầu kỳ (cho dịch vụ theo đồng hồ)
        meter_end REAL, -- Số đồng hồ cuối kỳ (cho dịch vụ theo đồng hồ)
        meter_usage REAL, -- Số lượng sử dụng (meter_end - meter_start)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )`);

      // Create indexes
      db.run(`CREATE INDEX IF NOT EXISTS idx_rooms_branch ON rooms(branch_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_room ON contracts(room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_branches_user ON user_branches(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_branches_branch ON user_branches(branch_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_assets_room ON assets(room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_assets_branch ON assets(branch_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_images_room ON images(room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_images_branch ON images(branch_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_tenant_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_branch ON contracts(branch_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_contract_services_contract ON contract_services(contract_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_contract_services_service ON contract_services(service_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(period_year, period_month)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_services_invoice ON invoice_services(invoice_id)`);

      // Financial Categories table
      db.run(`CREATE TABLE IF NOT EXISTS financial_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        type TEXT NOT NULL, -- 'income' or 'expense'
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_financial_categories_status ON financial_categories(status)`);

      // Tasks table
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        assigned_by INTEGER NOT NULL,
        assigned_to INTEGER NOT NULL,
        branch_id INTEGER,
        room_id INTEGER,
        status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
        priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
        due_date DATE,
        progress INTEGER DEFAULT 0, -- 0-100
        result TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_branch ON tasks(branch_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_room ON tasks(room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`);

      // Meter Readings table (Ghi số đồng hồ)
      db.run(`CREATE TABLE IF NOT EXISTS meter_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        invoice_id INTEGER,
        reading_date DATE NOT NULL,
        meter_start REAL NOT NULL,
        meter_end REAL NOT NULL,
        meter_usage REAL NOT NULL, -- meter_end - meter_start
        recorded_by INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
        FOREIGN KEY (recorded_by) REFERENCES users(id)
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_room ON meter_readings(room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_service ON meter_readings(service_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_invoice ON meter_readings(invoice_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON meter_readings(reading_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_recorded_by ON meter_readings(recorded_by)`);

      // Notifications table
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT,
        type TEXT,
        link_type TEXT,
        link_id INTEGER,
        metadata TEXT,
        unique_key TEXT UNIQUE,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS notification_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_read INTEGER DEFAULT 0,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(notification_id, user_id)
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_notification_recipients_user ON notification_recipients(user_id, is_read)`);

      // Insert default admin user
      db.run(`INSERT OR IGNORE INTO users (username, full_name, role) 
        VALUES ('admin', 'Administrator', 'admin')`, (err) => {
        if (err) {
          console.error('Error creating default user:', err);
        } else {
          console.log('Database tables created successfully');
        }
        resolve();
      });
    });
  });
};

const getDb = () => {
  if (!db) {
    console.error('Database not initialized! This should not happen if server started correctly.');
    console.error('Stack trace:', new Error().stack);
    throw new Error('Database not initialized. Please restart the server.');
  }
  return db;
};

const close = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  init,
  getDb,
  close
};

