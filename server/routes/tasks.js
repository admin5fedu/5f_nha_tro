const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  notifyTaskAssigned,
  notifyTaskStatusChanged,
  notifyTaskDueSoon,
  notifyTaskOverdue
} = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

const TASK_DUE_THRESHOLDS = [1, 3, 7];
const TASK_OVERDUE_THRESHOLDS = [1, 3, 7, 14];
const TASK_MS_PER_DAY = 1000 * 60 * 60 * 24;
const TASK_CLOSED_STATUSES = ['completed', 'cancelled', 'archived'];

const triggerTaskDeadlineNotifications = (tasks = []) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return;

  const now = new Date();

  tasks.forEach((task) => {
    if (!task || !task.due_date) return;
    const status = (task.status || '').toLowerCase();
    if (TASK_CLOSED_STATUSES.includes(status)) return;

    const dueDate = new Date(task.due_date);
    if (Number.isNaN(dueDate.getTime())) return;

    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = diffMs >= 0
      ? Math.ceil(diffMs / TASK_MS_PER_DAY)
      : Math.floor(diffMs / TASK_MS_PER_DAY);

    if (diffDays >= 0) {
      const threshold = TASK_DUE_THRESHOLDS.find((value) => diffDays <= value);
      if (threshold !== undefined) {
        notifyTaskDueSoon({ taskId: task.id, daysRemaining: threshold }).catch((error) => {
          console.error('Error sending task due soon notification:', error);
        });
      }
    } else {
      const overdueDays = Math.abs(diffDays);
      const threshold = [...TASK_OVERDUE_THRESHOLDS].reverse().find((value) => overdueDays >= value);
      if (threshold !== undefined) {
        notifyTaskOverdue({ taskId: task.id, daysOverdue: threshold }).catch((error) => {
          console.error('Error sending task overdue notification:', error);
        });
      }
    }
  });
};

// Get all tasks
router.get('/', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('❌ Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('❌ Error getting database:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  try {
    const { status, priority, assigned_to, assigned_by, branch_id, room_id } = req.query;
    
    let query = `
      SELECT t.*,
             u1.full_name as assigned_by_name,
             u2.full_name as assigned_to_name,
             b.name as branch_name,
             r.room_number
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN branches b ON t.branch_id = b.id
      LEFT JOIN rooms r ON t.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }
    if (assigned_by) {
      query += ' AND t.assigned_by = ?';
      params.push(assigned_by);
    }
    if (branch_id) {
      query += ' AND t.branch_id = ?';
      params.push(branch_id);
    }
    if (room_id) {
      query += ' AND t.room_id = ?';
      params.push(room_id);
    }

    query += ' ORDER BY t.created_at DESC';

    console.log('📋 Fetching tasks with query:', query.substring(0, 100) + '...');
    console.log('📋 Query params:', params);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Error fetching tasks:', err);
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Error SQL:', err.sql);
        if (err.stack) {
          console.error('Error stack:', err.stack);
        }
        return res.status(500).json({ 
          error: err.message || 'Database query error',
          code: err.code,
          sql: err.sql,
          details: 'Check server logs for more information'
        });
      }
      console.log(`✅ Successfully fetched ${rows?.length || 0} tasks`);
      res.json(rows || []);

      setImmediate(() => triggerTaskDeadlineNotifications(rows));
    });
  } catch (error) {
    console.error('❌ Unexpected error in tasks route:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: 'Check server logs for more information'
    });
  }
});

// Get single task
router.get('/:id', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  db.get(
    `SELECT t.*,
            u1.full_name as assigned_by_name, u1.username as assigned_by_username,
            u2.full_name as assigned_to_name, u2.username as assigned_to_username,
            b.name as branch_name, b.address as branch_address,
            r.room_number, r.floor
     FROM tasks t
     LEFT JOIN users u1 ON t.assigned_by = u1.id
     LEFT JOIN users u2 ON t.assigned_to = u2.id
     LEFT JOIN branches b ON t.branch_id = b.id
     LEFT JOIN rooms r ON t.room_id = r.id
     WHERE t.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        console.error('Error fetching task:', err);
        console.error('Error details:', err.message);
        if (err.stack) {
          console.error('Error stack:', err.stack);
        }
        return res.status(500).json({ error: err.message || 'Database query error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(row);
    }
  );
});

// Create task
router.post('/', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const {
    title, description, assigned_by, assigned_to,
    branch_id, room_id, status, priority, due_date, notes
  } = req.body;

  if (!title || !assigned_by || !assigned_to) {
    return res.status(400).json({ error: 'title, assigned_by, and assigned_to are required' });
  }

  // Validate branch_id and room_id relationship
  if (room_id && !branch_id) {
    // Get branch_id from room
    db.get('SELECT branch_id FROM rooms WHERE id = ?', [room_id], (err, room) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      createTask(db, {
        ...req.body,
        branch_id: room.branch_id
      }, res);
    });
  } else {
    createTask(db, req.body, res);
  }
});

function createTask(db, data, res) {
  const {
    title, description, assigned_by, assigned_to,
    branch_id, room_id, status = 'pending', priority = 'medium',
    due_date, notes
  } = data;

  db.run(
    `INSERT INTO tasks (
      title, description, assigned_by, assigned_to, branch_id, room_id,
      status, priority, due_date, progress, result, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)` ,
    [title, description, assigned_by, assigned_to, branch_id, room_id, status || 'pending', priority || 'medium', due_date || null, 0, null, notes || null],
    function(err) {
      if (err) {
        console.error('Error inserting task:', err);
        return res.status(500).json({ error: err.message });
      }

      const taskId = this.lastID;

      res.json({ id: taskId, ...data, assigned_by: assigned_by });

      notifyTaskAssigned({ taskId }).catch((error) => {
        console.error('Error sending task notification:', error);
      });
    }
  );
}

// Update task
router.put('/:id', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const {
    title, description, assigned_to, branch_id, room_id,
    status, priority, due_date, progress, result, notes
  } = req.body;

  // Get current task
  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If room_id is provided, ensure branch_id is set
    let finalBranchId = branch_id;
    if (room_id && !branch_id) {
      db.get('SELECT branch_id FROM rooms WHERE id = ?', [room_id], (err, room) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (room) {
          finalBranchId = room.branch_id;
        }
        updateTask(db, req.params.id, {
          ...req.body,
          branch_id: finalBranchId
        }, res);
      });
    } else {
      updateTask(db, req.params.id, req.body, res);
    }
  });
});

function updateTask(db, taskId, data, res) {
  const {
    title, description, assigned_to, branch_id, room_id,
    status, priority, due_date, progress, result, notes
  } = data;

  // Build update query dynamically
  const updates = [];
  const params = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    params.push(assigned_to);
  }
  if (branch_id !== undefined) {
    updates.push('branch_id = ?');
    params.push(branch_id);
  }
  if (room_id !== undefined) {
    updates.push('room_id = ?');
    params.push(room_id);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (priority !== undefined) {
    updates.push('priority = ?');
    params.push(priority);
  }
  if (due_date !== undefined) {
    updates.push('due_date = ?');
    params.push(due_date);
  }
  if (progress !== undefined) {
    updates.push('progress = ?');
    params.push(progress);
  }
  if (result !== undefined) {
    updates.push('result = ?');
    params.push(result);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(taskId);

  db.run(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        console.error('Error updating task:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task updated successfully' });

      if (status) {
        notifyTaskStatusChanged({ taskId: taskId, status }).catch((error) => {
          console.error('Error sending task update notification:', error);
        });
      }
    }
  );
}

// Update task progress (for assigned user)
router.patch('/:id/progress', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }

  const { progress, result } = req.body;

  if (progress === undefined && !result) {
    return res.status(400).json({ error: 'progress or result is required' });
  }

  const updates = [];
  const params = [];

  if (progress !== undefined) {
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'progress must be between 0 and 100' });
    }
    updates.push('progress = ?');
    params.push(progress);
    
    // Auto-update status based on progress
    if (progress === 0) {
      updates.push('status = ?');
      params.push('pending');
    } else if (progress > 0 && progress < 100) {
      updates.push('status = ?');
      params.push('in_progress');
    } else if (progress === 100) {
      updates.push('status = ?');
      params.push('completed');
    }
  }

  if (result !== undefined) {
    updates.push('result = ?');
    params.push(result);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.run(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        console.error('Error updating task progress:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task progress updated successfully' });
    }
  );
});

// Delete task
router.delete('/:id', (req, res) => {
  let db;
  try {
    db = getDb();
    if (!db) {
      console.error('Database is null!');
      return res.status(500).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error getting database:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

module.exports = router;

