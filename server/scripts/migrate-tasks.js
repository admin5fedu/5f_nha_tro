const { init, getDb, close } = require('../database/db');

async function migrateTasks() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create tasks table
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          assigned_by INTEGER NOT NULL,
          assigned_to INTEGER NOT NULL,
          branch_id INTEGER,
          room_id INTEGER,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          due_date DATE,
          progress INTEGER DEFAULT 0,
          result TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (assigned_by) REFERENCES users(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
        )`, (err) => {
          if (err) {
            console.error('Error creating tasks table:', err);
            reject(err);
            return;
          }
          console.log('✅ Tasks table created successfully');

          // Create indexes
          db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_branch ON tasks(branch_id)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_room ON tasks(room_id)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`, () => {
            console.log('✅ Tasks indexes created successfully');
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
  migrateTasks()
    .then(() => {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateTasks };

