const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/nhatro.db');

async function seedFinancialCategories() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
  });

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if financial categories already exist
      db.get('SELECT COUNT(*) as count FROM financial_categories', [], (err, row) => {
        if (err) {
          console.error('Error checking financial categories:', err);
          db.close();
          reject(err);
          return;
        }

        if (row.count > 0) {
          console.log('⚠️  Financial categories already exist. Clearing existing data...');
          // Clear existing data
          db.run('DELETE FROM financial_categories', (err) => {
            if (err) {
              console.error('Error clearing financial categories:', err);
              db.close();
              reject(err);
              return;
            }
            console.log('✅ Cleared existing financial categories');
            insertCategories();
          });
        } else {
          insertCategories();
        }
      });

      function insertCategories() {
        // Financial categories for income (Thu nhập)
        const incomeCategories = [
          { name: 'Tiền thuê phòng', code: 'THU001', type: 'income', description: 'Tiền thuê phòng hàng tháng từ khách thuê' },
          { name: 'Tiền cọc', code: 'THU002', type: 'income', description: 'Tiền đặt cọc khi ký hợp đồng' },
          { name: 'Tiền phạt', code: 'THU003', type: 'income', description: 'Tiền phạt vi phạm hợp đồng, quy định' },
          { name: 'Tiền dịch vụ', code: 'THU004', type: 'income', description: 'Tiền dịch vụ điện, nước, internet' },
          { name: 'Tiền đặt cọc dịch vụ', code: 'THU005', type: 'income', description: 'Tiền đặt cọc cho các dịch vụ' },
          { name: 'Tiền hoàn trả', code: 'THU006', type: 'income', description: 'Tiền hoàn trả từ nhà cung cấp dịch vụ' },
          { name: 'Thu nhập khác', code: 'THU007', type: 'income', description: 'Các khoản thu nhập khác' }
        ];

        // Financial categories for expense (Chi phí)
        const expenseCategories = [
          { name: 'Tiền điện', code: 'CHI001', type: 'expense', description: 'Tiền điện hàng tháng cho các khu vực chung' },
          { name: 'Tiền nước', code: 'CHI002', type: 'expense', description: 'Tiền nước hàng tháng cho các khu vực chung' },
          { name: 'Tiền internet', code: 'CHI003', type: 'expense', description: 'Phí internet hàng tháng' },
          { name: 'Tiền lương nhân viên', code: 'CHI004', type: 'expense', description: 'Tiền lương cho nhân viên quản lý, bảo vệ' },
          { name: 'Tiền bảo trì, sửa chữa', code: 'CHI005', type: 'expense', description: 'Chi phí bảo trì, sửa chữa tài sản, phòng trọ' },
          { name: 'Tiền mua sắm tài sản', code: 'CHI006', type: 'expense', description: 'Chi phí mua sắm đồ dùng, tài sản mới' },
          { name: 'Tiền vệ sinh môi trường', code: 'CHI007', type: 'expense', description: 'Phí vệ sinh, đổ rác' },
          { name: 'Tiền thuế', code: 'CHI008', type: 'expense', description: 'Các loại thuế phải nộp' },
          { name: 'Tiền bảo hiểm', code: 'CHI009', type: 'expense', description: 'Phí bảo hiểm tài sản, con người' },
          { name: 'Tiền marketing, quảng cáo', code: 'CHI010', type: 'expense', description: 'Chi phí quảng cáo, marketing' },
          { name: 'Tiền pháp lý', code: 'CHI011', type: 'expense', description: 'Chi phí pháp lý, tư vấn' },
          { name: 'Tiền vận hành', code: 'CHI012', type: 'expense', description: 'Chi phí vận hành hàng ngày' },
          { name: 'Tiền khấu hao', code: 'CHI013', type: 'expense', description: 'Chi phí khấu hao tài sản' },
          { name: 'Chi phí khác', code: 'CHI014', type: 'expense', description: 'Các khoản chi phí khác' }
        ];

        const allCategories = [...incomeCategories, ...expenseCategories];

        const categoryStmt = db.prepare(
          'INSERT INTO financial_categories (name, code, type, description, status) VALUES (?, ?, ?, ?, ?)'
        );

        let categoryCount = 0;
        allCategories.forEach((category) => {
          categoryStmt.run(
            category.name,
            category.code,
            category.type,
            category.description,
            'active'
          );
          categoryCount++;
        });

        categoryStmt.finalize((err) => {
          if (err) {
            console.error('Error seeding financial categories:', err);
            db.close();
            reject(err);
          } else {
            console.log(`✅ Seeded ${categoryCount} financial categories successfully!`);
            console.log(`   - ${incomeCategories.length} income categories`);
            console.log(`   - ${expenseCategories.length} expense categories`);
            db.close();
            resolve();
          }
        });
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  seedFinancialCategories()
    .then(() => {
      console.log('✅ Financial categories seeding completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error seeding financial categories:', err);
      process.exit(1);
    });
}

module.exports = { seedFinancialCategories };

