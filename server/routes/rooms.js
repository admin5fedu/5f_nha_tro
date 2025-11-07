const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { notifyRoomVacantLong } = require('../utils/notificationEvents');

const router = express.Router();

router.use(authenticateToken);

const VACANT_ROOM_THRESHOLDS = [30, 60, 90];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const triggerVacantRoomNotifications = (db, rooms = []) => {
  if (!Array.isArray(rooms) || rooms.length === 0) return;

  const availableRooms = rooms.filter((room) => room && room.status === 'available');
  if (availableRooms.length === 0) return;

  const now = new Date();

  availableRooms.forEach((room) => {
    db.get(
      `SELECT MAX(
         CASE
           WHEN status = 'ended' AND end_date IS NOT NULL THEN end_date
           WHEN end_date IS NOT NULL THEN end_date
           ELSE start_date
         END
       ) as last_activity
       FROM contracts
       WHERE room_id = ?`,
      [room.id],
      (err, row) => {
        if (err) {
          console.error('Error checking vacant room notifications:', err);
          return;
        }

        const referenceValue = row?.last_activity || room.created_at;
        if (!referenceValue) {
          return;
        }

        const referenceDate = new Date(referenceValue);
        if (Number.isNaN(referenceDate.getTime())) {
          return;
        }

        const diffDays = Math.floor((now.getTime() - referenceDate.getTime()) / MS_PER_DAY);
        if (diffDays < VACANT_ROOM_THRESHOLDS[0]) {
          return;
        }

        const threshold = [...VACANT_ROOM_THRESHOLDS].reverse().find((value) => diffDays >= value);
        if (!threshold) {
          return;
        }

        notifyRoomVacantLong({
          roomId: room.id,
          branchId: room.branch_id,
          roomNumber: room.room_number,
          daysVacant: diffDays,
          threshold
        }).catch((error) => {
          console.error('Error sending vacant room notification:', error);
        });
      }
    );
  });
};

// Get all rooms with branch info
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { branch_id, status } = req.query;

    let query = `
      SELECT r.*, b.name as branch_name, b.address as branch_address,
             (SELECT COUNT(*) FROM contracts c WHERE c.room_id = r.id AND c.status = 'active') as has_contract
      FROM rooms r
      LEFT JOIN branches b ON r.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (branch_id) {
      query += ' AND r.branch_id = ?';
      params.push(branch_id);
    }
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.branch_id, r.room_number';

    console.log('Fetching rooms with query:', query, 'params:', params);
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching rooms:', err);
        console.error('Error details:', err.message, err.stack);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Successfully fetched ${rows?.length || 0} rooms`);
      res.json(rows || []);

      setImmediate(() => triggerVacantRoomNotifications(db, rows));
    });
  } catch (error) {
    console.error('Error in rooms route:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get single room
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(
    `SELECT r.*, b.name as branch_name, b.address as branch_address
     FROM rooms r
     LEFT JOIN branches b ON r.branch_id = b.id
     WHERE r.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Get related images
      db.all(
        `SELECT * FROM images WHERE room_id = ? ORDER BY created_at DESC`,
        [req.params.id],
        (imageErr, images) => {
          if (imageErr) {
            console.error('Error fetching room images:', imageErr);
          }

          // Get related assets
          db.all(
            `SELECT * FROM assets WHERE room_id = ? ORDER BY created_at DESC`,
            [req.params.id],
            (assetErr, assets) => {
              if (assetErr) {
                console.error('Error fetching room assets:', assetErr);
              }

              // Get related contracts with tenants
              db.all(
                `SELECT c.*, 
                        t.id as tenant_id, t.full_name as tenant_name, t.phone as tenant_phone,
                        t.email as tenant_email, t.id_card as tenant_id_card,
                        t.address as tenant_address, t.hometown, t.emergency_contact,
                        t.tenant_type, t.has_temp_residence, t.notes as tenant_notes
                 FROM contracts c
                 LEFT JOIN tenants t ON c.tenant_id = t.id
                 WHERE c.room_id = ?
                 ORDER BY c.created_at DESC`,
                [req.params.id],
                (contractErr, contracts) => {
                  if (contractErr) {
                    console.error('Error fetching room contracts:', contractErr);
                  }
                  res.json({
                    ...row,
                    images: images || [],
                    assets: assets || [],
                    contracts: contracts || []
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Create room
router.post('/', (req, res) => {
  const { branch_id, room_number, floor, area, price, deposit, status, description, amenities } = req.body;
  const db = getDb();

  db.run(
    `INSERT INTO rooms (branch_id, room_number, floor, area, price, deposit, status, description, amenities)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [branch_id, room_number, floor, area, price, deposit || 0, status || 'available', description, amenities],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update room
router.put('/:id', (req, res) => {
  const { branch_id, room_number, floor, area, price, deposit, status, description, amenities } = req.body;
  const db = getDb();

  db.run(
    `UPDATE rooms SET branch_id = ?, room_number = ?, floor = ?, area = ?, price = ?,
     deposit = ?, status = ?, description = ?, amenities = ? WHERE id = ?`,
    [branch_id, room_number, floor, area, price, deposit, status, description, amenities, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json({ message: 'Room updated successfully' });
    }
  );
});

// Delete room
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM rooms WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  });
});

module.exports = router;