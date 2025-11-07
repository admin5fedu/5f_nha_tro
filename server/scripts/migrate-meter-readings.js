const { init, getDb, close } = require('../database/db');

async function migrateMeterReadings() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create meter_readings table
        db.run(`CREATE TABLE IF NOT EXISTS meter_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_id INTEGER NOT NULL,
          service_id INTEGER NOT NULL,
          invoice_id INTEGER,
          reading_date DATE NOT NULL,
          meter_start REAL NOT NULL,
          meter_end REAL NOT NULL,
          meter_usage REAL NOT NULL,
          recorded_by INTEGER NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
          FOREIGN KEY (recorded_by) REFERENCES users(id)
        )`, (err) => {
          if (err) {
            console.error('Error creating meter_readings table:', err);
            reject(err);
            return;
          }
          console.log('✅ Meter readings table created successfully');

          // Create indexes
          db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_room ON meter_readings(room_id)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_service ON meter_readings(service_id)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_invoice ON meter_readings(invoice_id)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON meter_readings(reading_date)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_meter_readings_recorded_by ON meter_readings(recorded_by)`, () => {
            console.log('✅ Meter readings indexes created successfully');
            resolve();
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
  migrateMeterReadings()
    .then(() => {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateMeterReadings };

