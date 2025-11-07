const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

// Generate transaction number
function generateTransactionNumber(type, date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const prefix = type === 'income' ? 'PT' : 'PC'; // PT = Phiếu Thu, PC = Phiếu Chi
  return `${prefix}-${year}${month}${day}-${random}`;
}

async function seedTransactions() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for transactions seeding.');
  });

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Clear existing transactions to prevent duplicates on re-run
      db.run('DELETE FROM transactions', (err) => {
        if (err) {
          console.error('Error clearing existing transactions:', err.message);
        } else {
          console.log('✅ Cleared existing transactions');
        }
      });

      // Get data for creating transactions
      db.all(`
        SELECT 
          i.id as invoice_id, i.contract_id, i.total_amount, i.remaining_amount, i.invoice_number,
          c.branch_id,
          fc_income.id as income_category_id,
          fc_expense.id as expense_category_id,
          a.id as account_id
        FROM invoices i
        LEFT JOIN contracts c ON i.contract_id = c.id
        LEFT JOIN financial_categories fc_income ON fc_income.type = 'income' AND fc_income.code = 'THU001'
        LEFT JOIN financial_categories fc_expense ON fc_expense.type = 'expense' AND fc_expense.code = 'CHI001'
        LEFT JOIN accounts a ON a.status = 'active'
        WHERE i.status IN ('paid', 'partial')
        LIMIT 20
      `, (err, invoices) => {
        if (err) {
          console.error('Error getting invoices:', err);
          db.close();
          return reject(err);
        }

        db.all('SELECT id FROM accounts WHERE status = ?', ['active'], (err, accounts) => {
          if (err) {
            console.error('Error getting accounts:', err);
            db.close();
            return reject(err);
          }

          if (!accounts || accounts.length === 0) {
            console.log('⚠️  No active accounts found. Please create accounts first.');
            db.close();
            return resolve();
          }

          db.all(`
            SELECT id FROM financial_categories 
            WHERE type = 'income' AND status = 'active'
            LIMIT 1
          `, (err, incomeCategories) => {
            if (err) {
              console.error('Error getting income categories:', err);
              db.close();
              return reject(err);
            }

            db.all(`
              SELECT id FROM financial_categories 
              WHERE type = 'expense' AND status = 'active'
            `, (err, expenseCategories) => {
              if (err) {
                console.error('Error getting expense categories:', err);
                db.close();
                return reject(err);
              }

              if (!incomeCategories || incomeCategories.length === 0 || !expenseCategories || expenseCategories.length === 0) {
                console.log('⚠️  No financial categories found. Please seed financial categories first.');
                db.close();
                return resolve();
              }

              const transactionStmt = db.prepare(`
                INSERT INTO transactions (
                  transaction_number, type, category_id, account_id, invoice_id, contract_id,
                  amount, transaction_date, payment_method, description, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              let transactionCount = 0;
              const now = new Date();
              const accountIds = accounts.map(a => a.id);
              const incomeCategoryId = incomeCategories[0].id;

              // Create income transactions from invoices
              if (invoices && invoices.length > 0) {
                invoices.forEach((invoice, index) => {
                  const daysAgo = Math.floor(Math.random() * 90); // Within last 3 months
                  const transactionDate = new Date(now);
                  transactionDate.setDate(transactionDate.getDate() - daysAgo);

                  // Create partial or full payment transactions
                  let amount = 0;
                  if (invoice.remaining_amount > 0) {
                    // Partial payment
                    amount = Math.floor(invoice.remaining_amount * (0.3 + Math.random() * 0.7));
                  } else {
                    // Full payment
                    amount = invoice.total_amount;
                  }

                  const accountId = accountIds[Math.floor(Math.random() * accountIds.length)];
                  const paymentMethods = ['cash', 'bank_transfer', 'momo', 'zalo_pay'];
                  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

                  const transactionNumber = generateTransactionNumber('income', transactionDate);
                  const description = `Thanh toán hóa đơn ${invoice.invoice_number || ''}`;

                  transactionStmt.run(
                    transactionNumber,
                    'income',
                    incomeCategoryId,
                    accountId,
                    invoice.invoice_id || null,
                    invoice.contract_id || null,
                    amount,
                    transactionDate.toISOString().split('T')[0],
                    paymentMethod,
                    description,
                    `Phiếu thu từ hóa đơn ${invoice.invoice_number || ''}`,
                    null, // created_by
                    function(err) {
                      if (err) {
                        console.error(`Error inserting income transaction ${transactionNumber}:`, err);
                      } else {
                        transactionCount++;
                        // Update account balance
                        db.run('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, accountId]);
                      }
                    }
                  );
                });
              }

              // Create expense transactions
              const expenseDescriptions = [
                { category: 'CHI001', desc: 'Tiền điện tháng', amount: 2000000 },
                { category: 'CHI002', desc: 'Tiền nước tháng', amount: 500000 },
                { category: 'CHI003', desc: 'Phí internet', amount: 300000 },
                { category: 'CHI004', desc: 'Tiền lương nhân viên', amount: 5000000 },
                { category: 'CHI005', desc: 'Bảo trì, sửa chữa', amount: 1500000 },
                { category: 'CHI007', desc: 'Phí vệ sinh môi trường', amount: 200000 },
                { category: 'CHI010', desc: 'Chi phí marketing', amount: 1000000 },
              ];

              db.all(`
                SELECT id, code FROM financial_categories 
                WHERE type = 'expense' AND status = 'active'
              `, (err, allExpenseCategories) => {
                if (err) {
                  console.error('Error getting expense categories:', err);
                } else {
                  // Create 15-20 expense transactions
                  for (let i = 0; i < 18; i++) {
                    const daysAgo = Math.floor(Math.random() * 90);
                    const transactionDate = new Date(now);
                    transactionDate.setDate(transactionDate.getDate() - daysAgo);

                    const expenseDesc = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
                    const category = allExpenseCategories.find(c => c.code === expenseDesc.category) || allExpenseCategories[0];
                    const amount = expenseDesc.amount + Math.floor(Math.random() * expenseDesc.amount * 0.3);

                    const accountId = accountIds[Math.floor(Math.random() * accountIds.length)];
                    const paymentMethods = ['cash', 'bank_transfer'];
                    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

                    const transactionNumber = generateTransactionNumber('expense', transactionDate);
                    const description = `${expenseDesc.desc} ${transactionDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`;

                    transactionStmt.run(
                      transactionNumber,
                      'expense',
                      category.id,
                      accountId,
                      null, // invoice_id
                      null, // contract_id
                      amount,
                      transactionDate.toISOString().split('T')[0],
                      paymentMethod,
                      description,
                      null, // notes
                      null, // created_by
                      function(err) {
                        if (err) {
                          console.error(`Error inserting expense transaction ${transactionNumber}:`, err);
                        } else {
                          transactionCount++;
                          // Update account balance
                          db.run('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [amount, accountId]);
                        }
                      }
                    );
                  }
                }

                // Wait a bit for all transactions to be inserted
                setTimeout(() => {
                  transactionStmt.finalize((err) => {
                    if (err) {
                      console.error('Error finalizing transaction statement:', err);
                      db.close();
                      reject(err);
                    } else {
                      console.log(`✅ Seeded ${transactionCount} transactions successfully!`);
                      console.log(`   - Income transactions from invoices`);
                      console.log(`   - Expense transactions for various costs`);
                      db.close();
                      resolve();
                    }
                  });
                }, 2000);
              });
            });
          });
        });
      });
    });
  });
}

if (require.main === module) {
  seedTransactions()
    .then(() => {
      console.log('✅ Transactions seeding completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Transactions seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedTransactions };

