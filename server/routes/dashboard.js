const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', (req, res) => {
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
  
  const stats = {};
  
  // Total branches
  db.get('SELECT COUNT(*) as count FROM branches', (err, row) => {
    if (err) {
      console.error('Error fetching total branches:', err);
      console.error('Error details:', err.message);
      return res.status(500).json({ error: err.message || 'Database query error' });
    }
    stats.totalBranches = row.count;
    
    // Total rooms
    db.get('SELECT COUNT(*) as count FROM rooms', (err, row) => {
      if (err) {
        console.error('Error fetching total rooms:', err);
        console.error('Error details:', err.message);
        return res.status(500).json({ error: err.message || 'Database query error' });
      }
      stats.totalRooms = row.count;
      
      // Available rooms
      db.get("SELECT COUNT(*) as count FROM rooms WHERE status = 'available'", (err, row) => {
        if (err) {
          console.error('Error fetching available rooms:', err);
          console.error('Error details:', err.message);
          return res.status(500).json({ error: err.message || 'Database query error' });
        }
        stats.availableRooms = row.count;
        
        // Occupied rooms
        db.get("SELECT COUNT(*) as count FROM rooms WHERE status = 'occupied'", (err, row) => {
          if (err) {
            console.error('Error fetching occupied rooms:', err);
            console.error('Error details:', err.message);
            return res.status(500).json({ error: err.message || 'Database query error' });
          }
          stats.occupiedRooms = row.count;
          
          // Total tenants
          db.get('SELECT COUNT(*) as count FROM tenants', (err, row) => {
            if (err) {
              console.error('Error fetching total tenants:', err);
              console.error('Error details:', err.message);
              return res.status(500).json({ error: err.message || 'Database query error' });
            }
            stats.totalTenants = row.count;
            
            // Active contracts
            db.get("SELECT COUNT(*) as count FROM contracts WHERE status = 'active'", (err, row) => {
              if (err) {
                console.error('Error fetching active contracts:', err);
                console.error('Error details:', err.message);
                return res.status(500).json({ error: err.message || 'Database query error' });
              }
              stats.activeContracts = row.count;
              
              // Monthly revenue (current month)
              const currentMonth = new Date().toISOString().slice(0, 7);
              db.get(
                `SELECT SUM(amount) as total FROM payments 
                 WHERE status = 'paid' AND payment_date LIKE ?`,
                [`${currentMonth}%`],
                (err, row) => {
                  if (err) {
                    console.error('Error fetching monthly revenue:', err);
                    console.error('Error details:', err.message);
                    return res.status(500).json({ error: err.message || 'Database query error' });
                  }
                  stats.monthlyRevenue = row.total || 0;
                  
                  // Total revenue
                  db.get(
                    "SELECT SUM(amount) as total FROM payments WHERE status = 'paid'",
                    (err, row) => {
                      if (err) {
                        console.error('Error fetching total revenue:', err);
                        console.error('Error details:', err.message);
                        return res.status(500).json({ error: err.message || 'Database query error' });
                      }
                      stats.totalRevenue = row.total || 0;
                      
                      console.log('Successfully fetched dashboard stats');
                      res.json(stats);
                    }
                  );
                }
              );
            });
          });
        });
      });
    });
  });
});

// Get recent activities
router.get('/recent', (req, res) => {
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
  
  // Recent contracts
  db.all(
    `SELECT c.*, r.room_number, b.name as branch_name, t.full_name as tenant_name
     FROM contracts c
     LEFT JOIN rooms r ON c.room_id = r.id
     LEFT JOIN branches b ON r.branch_id = b.id
     LEFT JOIN tenants t ON c.tenant_id = t.id
     ORDER BY c.created_at DESC LIMIT 5`,
    (err, contracts) => {
      if (err) {
        console.error('Error fetching recent contracts:', err);
        console.error('Error details:', err.message);
        return res.status(500).json({ error: err.message || 'Database query error' });
      }
      
      // Recent payments
      db.all(
        `SELECT p.*, r.room_number, t.full_name as tenant_name
         FROM payments p
         LEFT JOIN contracts c ON p.contract_id = c.id
         LEFT JOIN rooms r ON c.room_id = r.id
         LEFT JOIN tenants t ON c.tenant_id = t.id
         ORDER BY p.created_at DESC LIMIT 5`,
        (err, payments) => {
          if (err) {
            console.error('Error fetching recent payments:', err);
            console.error('Error details:', err.message);
            return res.status(500).json({ error: err.message || 'Database query error' });
          }
          
          console.log('Successfully fetched recent activities');
          res.json({ contracts: contracts || [], payments: payments || [] });
        }
      );
    }
  );
});

module.exports = router;

