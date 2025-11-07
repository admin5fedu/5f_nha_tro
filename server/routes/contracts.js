const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const {
  notifyContractCreated,
  notifyContractEnded,
  notifyContractExpiring,
  notifyTenantAssignedToRoom
} = require('../utils/notificationEvents');
const router = express.Router();

router.use(authenticateToken);

const triggerExpiryNotifications = (contracts = []) => {
  if (!Array.isArray(contracts) || contracts.length === 0) return;

  const thresholds = [7, 14, 30, 60];
  const now = new Date();

  contracts.forEach((contract) => {
    if (!contract.end_date || contract.status === 'ended') {
      return;
    }

    const endDate = new Date(contract.end_date);
    if (Number.isNaN(endDate.getTime())) {
      return;
    }

    const diffMs = endDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      notifyContractEnded({ contractId: contract.id }).catch((err) => {
        console.error('Error notifying contract ended:', err);
      });
      return;
    }

    const threshold = thresholds.find((value) => diffDays <= value);
    if (threshold !== undefined) {
      notifyContractExpiring({ contractId: contract.id, daysRemaining: threshold }).catch((err) => {
        console.error('Error notifying contract expiring:', err);
      });
    }
  });
};

// Get all contracts
router.get('/', (req, res) => {
  const db = getDb();
  const query = `
    SELECT c.*, 
           r.room_number, r.price, r.branch_id,
           b.name as branch_name,
           t.full_name as tenant_name, t.phone as tenant_phone,
           CASE 
             WHEN c.end_date IS NULL THEN NULL
             WHEN c.end_date < date('now') THEN 'expired'
             WHEN c.end_date <= date('now', '+30 days') THEN 'expiring_30'
             WHEN c.end_date <= date('now', '+60 days') THEN 'expiring_60'
             WHEN c.end_date <= date('now', '+90 days') THEN 'expiring_90'
             ELSE 'active'
           END as expiry_status
    FROM contracts c
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN branches b ON c.branch_id = b.id
    LEFT JOIN tenants t ON c.tenant_id = t.id
    ORDER BY c.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);

    setImmediate(() => triggerExpiryNotifications(rows));
  });
});

// Get single contract with services
router.get('/:id', (req, res) => {
  const db = getDb();
  const query = `
    SELECT c.*, 
           r.room_number, r.price, r.branch_id,
           b.*,
           t.*
    FROM contracts c
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN branches b ON c.branch_id = b.id
    LEFT JOIN tenants t ON c.tenant_id = t.id
    WHERE c.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get contract services
    db.all(
      `SELECT cs.*, s.name as service_name, s.unit, s.unit_name
       FROM contract_services cs
       LEFT JOIN services s ON cs.service_id = s.id
       WHERE cs.contract_id = ?
       ORDER BY s.name`,
      [req.params.id],
      (err, services) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Get related invoices
        db.all(
          `SELECT i.*,
                  r.room_number,
                  b.name as branch_name
           FROM invoices i
           LEFT JOIN contracts c ON i.contract_id = c.id
           LEFT JOIN rooms r ON c.room_id = r.id
           LEFT JOIN branches b ON c.branch_id = b.id
           WHERE i.contract_id = ?
           ORDER BY i.invoice_date DESC, i.period_year DESC, i.period_month DESC`,
          [req.params.id],
          (err, invoices) => {
            if (err) {
              console.error('Error fetching contract invoices:', err);
              return res.json({ ...row, services: services || [], invoices: [] });
            }
            res.json({ ...row, services: services || [], invoices: invoices || [] });
          }
        );
      }
    );
  });
});

// Create contract
router.post('/', (req, res) => {
  const { branch_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, notes, services } = req.body;
  const db = getDb();

  if (!branch_id) {
    return res.status(400).json({ error: 'branch_id is required' });
  }

  db.run(
    `INSERT INTO contracts (branch_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [branch_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit || 0, status || 'active', notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const contractId = this.lastID;
      
      // Update room status to occupied
      db.run('UPDATE rooms SET status = ? WHERE id = ?', ['occupied', room_id]);
      
      // Insert contract services if provided
      if (services && Array.isArray(services) && services.length > 0) {
        const stmt = db.prepare(
          `INSERT INTO contract_services (contract_id, service_id, price, quantity, notes)
           VALUES (?, ?, ?, ?, ?)`
        );
        
        services.forEach((service) => {
          stmt.run([
            contractId, 
            service.service_id, 
            service.price, 
            service.quantity || 1,
            service.notes || null
          ]);
        });
        
        stmt.finalize((err) => {
          if (err) {
            console.error('Error inserting contract services:', err);
          }
        });
      }
      
      res.json({ id: contractId, ...req.body });

      notifyContractCreated({ contractId }).catch((error) => {
        console.error('Error sending contract created notification:', error);
      });

      if (tenant_id && room_id) {
        notifyTenantAssignedToRoom({ tenantId: tenant_id, roomId: room_id }).catch((error) => {
          console.error('Error sending tenant assignment notification:', error);
        });
      }

      if (end_date) {
        triggerExpiryNotifications([{ id: contractId, end_date, status: status || 'active' }]);
      }
    }
  );
});

// Update contract
router.put('/:id', (req, res) => {
  const { branch_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, notes, services } = req.body;
  const db = getDb();

  db.get('SELECT id, branch_id, room_id, tenant_id, status FROM contracts WHERE id = ?', [req.params.id], (err, existingContract) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!existingContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    db.run(
      `UPDATE contracts SET branch_id = ?, room_id = ?, tenant_id = ?, start_date = ?, end_date = ?, 
       monthly_rent = ?, deposit = ?, status = ?, notes = ? WHERE id = ?`,
      [branch_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, notes, req.params.id],
      function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Contract not found' });
        }

        // Update contract services if provided
        if (services && Array.isArray(services)) {
          db.run('DELETE FROM contract_services WHERE contract_id = ?', [req.params.id], (deleteErr) => {
            if (deleteErr) {
              console.error('Error deleting contract services:', deleteErr);
            } else if (services.length > 0) {
              const stmt = db.prepare(
                `INSERT INTO contract_services (contract_id, service_id, price, quantity, notes)
                 VALUES (?, ?, ?, ?, ?)`
              );

              services.forEach((service) => {
                stmt.run([
                  req.params.id,
                  service.service_id,
                  service.price,
                  service.quantity || 1,
                  service.notes || null
                ]);
              });

              stmt.finalize((finalizeErr) => {
                if (finalizeErr) {
                  console.error('Error inserting contract services:', finalizeErr);
                }
              });
            }
          });
        }

        res.json({ message: 'Contract updated successfully' });

        const newTenantId = tenant_id || existingContract.tenant_id;
        const newRoomId = room_id || existingContract.room_id;

        if (status === 'ended') {
          notifyContractEnded({ contractId: req.params.id }).catch((error) => {
            console.error('Error sending contract ended notification:', error);
          });
        } else {
          if (
            (tenant_id && tenant_id !== existingContract.tenant_id) ||
            (room_id && room_id !== existingContract.room_id)
          ) {
            notifyTenantAssignedToRoom({ tenantId: newTenantId, roomId: newRoomId }).catch((error) => {
              console.error('Error sending tenant assignment notification:', error);
            });
          }

          if (end_date) {
            triggerExpiryNotifications([{ id: req.params.id, end_date, status }]);
          }
        }
      }
    );
  });
});

// Delete contract
router.delete('/:id', (req, res) => {
  const db = getDb();
  
  // Get contract info before deleting
  db.get('SELECT room_id FROM contracts WHERE id = ?', [req.params.id], (err, contract) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    db.run('DELETE FROM contracts WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Update room status to available
      db.run('UPDATE rooms SET status = ? WHERE id = ?', ['available', contract.room_id]);
      
      res.json({ message: 'Contract deleted successfully' });
    });
  });
});

// Export contract to DOC
router.get('/:id/export', (req, res) => {
  const db = getDb();
  const query = `
    SELECT c.*,
           r.room_number, r.price, r.branch_id,
           b.*,
           t.*
    FROM contracts c
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN branches b ON c.branch_id = b.id
    LEFT JOIN tenants t ON c.tenant_id = t.id
    WHERE c.id = ?
  `;

  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get contract services
    db.all(
      `SELECT cs.*, s.name as service_name, s.unit, s.unit_name
       FROM contract_services cs
       LEFT JOIN services s ON cs.service_id = s.id
       WHERE cs.contract_id = ?
       ORDER BY s.name`,
      [req.params.id],
      (err, services) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const contract = { ...row, services: services || [] };
        
        // Generate DOC content (RTF format for Word compatibility)
        const docContent = generateContractDOC(contract);
        
        res.setHeader('Content-Type', 'application/msword');
        res.setHeader('Content-Disposition', `attachment; filename="HopDong_${contract.room_number}_${contract.id}.doc"`);
        res.send(docContent);
      }
    );
  });
});

// Helper function to generate DOC content
function generateContractDOC(contract) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const servicesText = contract.services && contract.services.length > 0
    ? contract.services.map(s => {
        const total = s.unit === 'quantity' && s.quantity > 1 
          ? s.price * s.quantity 
          : s.price;
        const quantityText = s.unit === 'quantity' && s.quantity > 1 
          ? ` (Số lượng: ${s.quantity})` 
          : '';
        return `  - ${s.service_name}${quantityText}: ${formatCurrency(s.price)} đ${s.unit === 'quantity' && s.quantity > 1 ? ` (Tổng: ${formatCurrency(total)} đ)` : ''}`;
      }).join('\n')
    : '  Không có';

  const doc = `HỢP ĐỒNG THUÊ PHÒNG TRỌ

Số hợp đồng: ${contract.id}

BÊN CHO THUÊ (Bên A):
- Tên chi nhánh: ${contract.name || '-'}
- Địa chỉ: ${contract.address || '-'}
- Người đại diện: ${contract.representative_name || '-'}
- Chức vụ: ${contract.representative_position || '-'}
- CMND/CCCD: ${contract.representative_id_card || '-'}
- Địa chỉ: ${contract.representative_address || '-'}
- Số điện thoại: ${contract.representative_phone || '-'}

BÊN THUÊ (Bên B):
- Họ và tên: ${contract.full_name || '-'}
- Số điện thoại: ${contract.phone || '-'}
- Email: ${contract.email || '-'}
- CMND/CCCD: ${contract.id_card || '-'}
- Địa chỉ: ${contract.address || '-'}
- Quê quán: ${contract.hometown || '-'}

THÔNG TIN PHÒNG:
- Phòng số: ${contract.room_number || '-'}
- Chi nhánh: ${contract.name || '-'}
- Địa chỉ chi nhánh: ${contract.address || '-'}

ĐIỀU KHOẢN HỢP ĐỒNG:

1. Thời hạn hợp đồng:
   - Ngày bắt đầu: ${formatDate(contract.start_date)}
   ${contract.end_date ? `   - Ngày kết thúc: ${formatDate(contract.end_date)}` : '   - Ngày kết thúc: Không xác định'}

2. Giá thuê và tiền cọc:
   - Giá thuê/tháng: ${formatCurrency(contract.monthly_rent)} đ
   - Tiền cọc: ${formatCurrency(contract.deposit || 0)} đ

3. Dịch vụ kèm theo:
${servicesText}

4. Ghi chú:
   ${contract.notes || 'Không có'}

Cam kết của hai bên:
- Bên A cam kết cung cấp phòng trọ và các dịch vụ theo đúng thỏa thuận.
- Bên B cam kết thanh toán đầy đủ và đúng hạn theo hợp đồng.

Hợp đồng này có hiệu lực kể từ ngày ${formatDate(contract.start_date)}.

Ngày lập: ${formatDate(contract.created_at)}

BÊN CHO THUÊ (Bên A)                    BÊN THUÊ (Bên B)

${contract.representative_name || '________________'}                    ${contract.full_name || '________________'}

(Ký và ghi rõ họ tên)                    (Ký và ghi rõ họ tên)
`;

  return doc;
}

module.exports = router;

