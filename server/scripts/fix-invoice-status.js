const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

// Helper function to update invoice based on related transactions
function updateInvoiceFromTransactions(db, invoiceId, callback) {
  // Get all income transactions for this invoice
  db.all(
    `SELECT SUM(amount) as total_paid FROM transactions 
     WHERE invoice_id = ? AND type = 'income'`,
    [invoiceId],
    (err, rows) => {
      if (err) {
        return callback(err);
      }

      const totalPaid = rows[0]?.total_paid || 0;

      // Get invoice total amount
      db.get(
        'SELECT total_amount FROM invoices WHERE id = ?',
        [invoiceId],
        (err, invoice) => {
          if (err) {
            return callback(err);
          }
          if (!invoice) {
            return callback(new Error('Invoice not found'));
          }

          const totalAmount = invoice.total_amount || 0;
          const remainingAmount = Math.max(0, totalAmount - totalPaid);

          // Determine status
          let status = 'pending';
          if (totalPaid >= totalAmount) {
            status = 'paid';
          } else if (totalPaid > 0) {
            status = 'partial';
          }

          // Update invoice
          db.run(
            `UPDATE invoices 
             SET paid_amount = ?, remaining_amount = ?, status = ?
             WHERE id = ?`,
            [totalPaid, remainingAmount, status, invoiceId],
            (err) => {
              if (err) {
                return callback(err);
              }
              callback(null);
            }
          );
        }
      );
    }
  );
}

async function fixInvoiceStatus() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for fixing invoice status.');
  });

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Get all invoices
      db.all('SELECT id FROM invoices', [], (err, invoices) => {
        if (err) {
          console.error('Error getting invoices:', err);
          db.close();
          return reject(err);
        }

        if (!invoices || invoices.length === 0) {
          console.log('⚠️  No invoices found.');
          db.close();
          return resolve();
        }

        console.log(`📋 Found ${invoices.length} invoices. Updating status...`);

        let completed = 0;
        let errors = 0;

        invoices.forEach((invoice) => {
          updateInvoiceFromTransactions(db, invoice.id, (err) => {
            if (err) {
              console.error(`Error updating invoice ${invoice.id}:`, err);
              errors++;
            } else {
              completed++;
            }

            if (completed + errors === invoices.length) {
              console.log(`✅ Fixed ${completed} invoices successfully!`);
              if (errors > 0) {
                console.log(`⚠️  ${errors} invoices had errors.`);
              }
              db.close();
              resolve();
            }
          });
        });
      });
    });
  });
}

if (require.main === module) {
  fixInvoiceStatus()
    .then(() => {
      console.log('✅ Invoice status fix completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Invoice status fix failed:', err);
      process.exit(1);
    });
}

module.exports = { fixInvoiceStatus };

