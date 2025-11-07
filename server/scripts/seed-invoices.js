const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

// Generate invoice number
function generateInvoiceNumber(year, month, contractId, index) {
  const monthStr = String(month).padStart(2, '0');
  const contractStr = String(contractId).padStart(4, '0');
  const indexStr = String(index).padStart(2, '0');
  return `HD-${year}${monthStr}-${contractStr}${indexStr}`;
}

async function seedInvoices() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
  });

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if invoices already exist
      db.get('SELECT COUNT(*) as count FROM invoices', [], (err, row) => {
        if (err) {
          console.error('Error checking invoices:', err);
          db.close();
          reject(err);
          return;
        }

        if (row.count > 0) {
          console.log('⚠️  Invoices already exist. Clearing existing data...');
          // Clear existing data
          db.run('DELETE FROM invoice_services', (err) => {
            if (err) {
              console.error('Error clearing invoice services:', err);
              db.close();
              reject(err);
              return;
            }
            db.run('DELETE FROM invoices', (err) => {
              if (err) {
                console.error('Error clearing invoices:', err);
                db.close();
                reject(err);
                return;
              }
              console.log('✅ Cleared existing invoices');
              createInvoices();
            });
          });
        } else {
          createInvoices();
        }
      });

      function createInvoices() {
        // Get all active contracts
        db.all(
          `SELECT c.id, c.branch_id, c.room_id, c.tenant_id, c.monthly_rent, c.start_date
           FROM contracts c
           WHERE c.status = 'active'
           ORDER BY c.id
           LIMIT 10`,
          [],
          (err, contracts) => {
            if (err) {
              console.error('Error getting contracts:', err);
              db.close();
              reject(err);
              return;
            }

            if (!contracts || contracts.length === 0) {
              console.log('⚠️  No active contracts found. Please seed contracts first.');
              db.close();
              resolve();
              return;
            }

            console.log(`📋 Found ${contracts.length} active contracts`);

            // Get all services
            db.all('SELECT id, name, unit, unit_name FROM services WHERE status = ?', ['active'], (err, services) => {
              if (err) {
                console.error('Error getting services:', err);
                db.close();
                reject(err);
                return;
              }

              const currentDate = new Date();
              const currentMonth = currentDate.getMonth() + 1;
              const currentYear = currentDate.getFullYear();

              const invoiceStmt = db.prepare(
                `INSERT INTO invoices (
                  contract_id, invoice_number, invoice_date, due_date,
                  period_month, period_year, actual_days, rent_amount, service_amount,
                  previous_debt, total_amount, paid_amount, remaining_amount,
                  status, qr_code, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              );

              const invoiceServiceStmt = db.prepare(
                `INSERT INTO invoice_services (
                  invoice_id, service_id, service_name, price, quantity, amount,
                  meter_start, meter_end, meter_usage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
              );

              let invoiceCount = 0;
              let totalInvoices = contracts.length * 3; // 3 months per contract
              let processedInvoices = 0;

              function processInvoice(contract, contractIndex, monthOffset) {
                const invoiceMonth = currentMonth - monthOffset;
                let invoiceYear = currentYear;
                let adjustedMonth = invoiceMonth;

                // Handle year rollover
                if (invoiceMonth <= 0) {
                  adjustedMonth = invoiceMonth + 12;
                  invoiceYear = currentYear - 1;
                }

                // Get contract services
                db.all(
                  `SELECT cs.*, s.name as service_name, s.unit, s.unit_name
                   FROM contract_services cs
                   LEFT JOIN services s ON cs.service_id = s.id
                   WHERE cs.contract_id = ?`,
                  [contract.id],
                  (err, contractServices) => {
                    if (err) {
                      console.error(`Error getting contract services for contract ${contract.id}:`, err);
                      processedInvoices++;
                      checkComplete();
                      return;
                    }

                    // Calculate service amount
                    const serviceAmount = contractServices.reduce((sum, s) => {
                      return sum + ((s.price || 0) * (s.quantity || 1));
                    }, 0);

                    const rentAmount = contract.monthly_rent || 0;
                    const previousDebt = monthOffset === 0 ? 0 : (monthOffset === 1 ? 500000 : 0); // Sample previous debt
                    const totalAmount = rentAmount + serviceAmount + previousDebt;

                    // Determine status and paid amount
                    let status = 'pending';
                    let paidAmount = 0;
                    if (monthOffset === 2) {
                      // Oldest month - fully paid
                      status = 'paid';
                      paidAmount = totalAmount;
                    } else if (monthOffset === 1) {
                      // Middle month - partially paid
                      status = 'partial';
                      paidAmount = Math.floor(totalAmount * 0.5);
                    } else {
                      // Current month - pending
                      status = 'pending';
                      paidAmount = 0;
                    }

                    const remainingAmount = totalAmount - paidAmount;

                    // Generate dates
                    const invoiceDate = new Date(invoiceYear, adjustedMonth - 1, 1);
                    const dueDate = new Date(invoiceYear, adjustedMonth - 1, 15);

                    // Generate invoice number
                    const invoiceNumber = generateInvoiceNumber(invoiceYear, adjustedMonth, contract.id, monthOffset + 1);

                    // Generate QR code (placeholder)
                    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invoiceNumber)}`;

                    // Insert invoice
                    invoiceStmt.run(
                      contract.id,
                      invoiceNumber,
                      invoiceDate.toISOString().split('T')[0],
                      dueDate.toISOString().split('T')[0],
                      adjustedMonth,
                      invoiceYear,
                      null, // actual_days
                      rentAmount,
                      serviceAmount,
                      previousDebt,
                      totalAmount,
                      paidAmount,
                      remainingAmount,
                      status,
                      qrCode,
                      `Hóa đơn tháng ${adjustedMonth}/${invoiceYear}`,
                      function(err) {
                        if (err) {
                          console.error(`Error inserting invoice ${invoiceNumber}:`, err);
                          processedInvoices++;
                          checkComplete();
                          return;
                        }

                        const invoiceId = this.lastID;
                        invoiceCount++;

                        // Insert invoice services
                        if (contractServices && contractServices.length > 0) {
                          contractServices.forEach((service) => {
                            let amount = 0;
                            let meterStart = null;
                            let meterEnd = null;
                            let meterUsage = null;

                            if (service.unit === 'meter') {
                              // For meter-based services, generate meter readings
                              const baseMeter = 1000 + (contractIndex * 100) + (monthOffset * 50);
                              meterStart = baseMeter;
                              meterEnd = baseMeter + 20 + Math.floor(Math.random() * 30);
                              meterUsage = meterEnd - meterStart;
                              amount = (service.price || 0) * meterUsage;
                            } else {
                              // For quantity-based services
                              amount = (service.price || 0) * (service.quantity || 1);
                            }

                            invoiceServiceStmt.run(
                              invoiceId,
                              service.service_id,
                              service.service_name || service.name || '',
                              service.price || 0,
                              service.quantity || 1,
                              amount,
                              meterStart,
                              meterEnd,
                              meterUsage
                            );
                          });
                        }

                        processedInvoices++;
                        checkComplete();
                      }
                    );
                  }
                );
              }

              function checkComplete() {
                if (processedInvoices === totalInvoices) {
                  invoiceStmt.finalize();
                  invoiceServiceStmt.finalize((err) => {
                    if (err) {
                      console.error('Error finalizing statements:', err);
                      db.close();
                      reject(err);
                    } else {
                      console.log(`✅ Seeded ${invoiceCount} invoices successfully!`);
                      console.log(`   - Created invoices for ${contracts.length} contracts`);
                      console.log(`   - Each contract has 3 months of invoices`);
                      db.close();
                      resolve();
                    }
                  });
                }
              }

              // Process all invoices
              contracts.forEach((contract, contractIndex) => {
                // Create invoices for last 3 months for each contract
                for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                  processInvoice(contract, contractIndex, monthOffset);
                }
              });
            });
          }
        );
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  seedInvoices()
    .then(() => {
      console.log('✅ Invoice seeding completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error seeding invoices:', err);
      process.exit(1);
    });
}

module.exports = { seedInvoices };

