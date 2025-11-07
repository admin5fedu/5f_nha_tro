const { getDb } = require('../database/db');
const sqlite3 = require('sqlite3').verbose();

// Initialize database first
const dbModule = require('../database/db');

async function seed() {
  await dbModule.init();
  const db = dbModule.getDb();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if branches already exist
      db.get('SELECT COUNT(*) as count FROM branches', [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count > 0) {
          console.log('⚠️  Database already has data. Skipping seed.');
          resolve();
          return;
        }

        // Create 10 branches
        const branches = [];
        for (let i = 1; i <= 10; i++) {
          branches.push({
            name: `Chi nhánh ${i}`,
            address: `${100 + i} Đường Nguyễn Văn A, Phường ${i}, Quận ${i}, TP.HCM`,
            phone: `0${912345678 + i}`,
            manager_name: `Quản lý ${i}`,
            status: 'active'
          });
        }

        const stmt = db.prepare('INSERT INTO branches (name, address, phone, manager_name, status) VALUES (?, ?, ?, ?, ?)');
        
        branches.forEach((branch) => {
          stmt.run(branch.name, branch.address, branch.phone, branch.manager_name, branch.status);
        });
        stmt.finalize();

        // Create 200 rooms (20 rooms per branch)
        db.get('SELECT MAX(id) as maxId FROM branches', [], (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          const maxBranchId = row.maxId;
          const rooms = [];
          let roomNumber = 1;

          for (let branchId = 1; branchId <= maxBranchId; branchId++) {
            for (let floor = 1; floor <= 5; floor++) {
              for (let room = 1; room <= 4; room++) {
                const roomNum = `${floor}${String(room).padStart(2, '0')}`;
                rooms.push({
                  branch_id: branchId,
                  room_number: roomNum,
                  floor: floor,
                  area: 20 + Math.floor(Math.random() * 15), // 20-35 m²
                  price: 2000000 + Math.floor(Math.random() * 3000000), // 2-5 triệu
                  deposit: Math.floor((2000000 + Math.floor(Math.random() * 3000000)) * 0.5),
                  status: Math.random() > 0.3 ? 'available' : 'occupied',
                  description: `Phòng rộng rãi, thoáng mát, có ban công`,
                  amenities: 'Điều hòa, Wifi, Tủ lạnh, Nóng lạnh'
                });
                roomNumber++;
              }
            }
          }

          const roomStmt = db.prepare(
            'INSERT INTO rooms (branch_id, room_number, floor, area, price, deposit, status, description, amenities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          );

          rooms.forEach((room) => {
            roomStmt.run(
              room.branch_id,
              room.room_number,
              room.floor,
              room.area,
              room.price,
              room.deposit,
              room.status,
              room.description,
              room.amenities
            );
          });

          roomStmt.finalize((err) => {
            if (err) {
              reject(err);
              return;
            }
            console.log('✅ Seeded 10 branches and 200 rooms successfully!');

            // Seed services
            const services = [
              { name: 'Điện', unit: 'meter', unit_name: 'kWh', description: 'Tiền điện theo đồng hồ' },
              { name: 'Nước', unit: 'meter', unit_name: 'm³', description: 'Tiền nước theo đồng hồ' },
              { name: 'Internet', unit: 'quantity', unit_name: 'tháng', description: 'Phí internet hàng tháng' },
              { name: 'Đổ rác', unit: 'quantity', unit_name: 'tháng', description: 'Phí vệ sinh môi trường' },
              { name: 'Bảo vệ', unit: 'quantity', unit_name: 'tháng', description: 'Phí bảo vệ hàng tháng' },
              { name: 'Dịch vụ khác', unit: 'quantity', unit_name: 'tháng', description: 'Các dịch vụ khác' }
            ];

            const serviceStmt = db.prepare(
              'INSERT INTO services (name, unit, unit_name, description, status) VALUES (?, ?, ?, ?, ?)'
            );

            services.forEach((service) => {
              serviceStmt.run(service.name, service.unit, service.unit_name, service.description, 'active');
            });

            serviceStmt.finalize((err) => {
              if (err) {
                console.error('Error seeding services:', err);
              } else {
                console.log('✅ Seeded services successfully!');
              }

              // Seed tenants (sample)
              const tenants = [
                { full_name: 'Nguyễn Văn A', phone: '0912345678', email: 'nguyenvana@example.com', id_card: '001234567890', address: '123 Đường ABC, Quận 1, TP.HCM', hometown: 'Hà Nội', has_temp_residence: 'yes', tenant_type: 'owner' },
                { full_name: 'Trần Thị B', phone: '0923456789', email: 'tranthib@example.com', id_card: '002345678901', address: '456 Đường XYZ, Quận 2, TP.HCM', hometown: 'Đà Nẵng', has_temp_residence: 'yes', tenant_type: 'owner' },
                { full_name: 'Lê Văn C', phone: '0934567890', email: 'levanc@example.com', id_card: '003456789012', address: '789 Đường DEF, Quận 3, TP.HCM', hometown: 'Hải Phòng', has_temp_residence: 'no', tenant_type: 'owner' },
                { full_name: 'Phạm Thị D', phone: '0945678901', email: 'phamthid@example.com', id_card: '004567890123', address: '321 Đường GHI, Quận 4, TP.HCM', hometown: 'Cần Thơ', has_temp_residence: 'yes', tenant_type: 'owner' },
                { full_name: 'Hoàng Văn E', phone: '0956789012', email: 'hoangvane@example.com', id_card: '005678901234', address: '654 Đường JKL, Quận 5, TP.HCM', hometown: 'An Giang', has_temp_residence: 'no', tenant_type: 'owner' }
              ];

              const tenantStmt = db.prepare(
                'INSERT INTO tenants (full_name, phone, email, id_card, address, hometown, has_temp_residence, tenant_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
              );

              tenants.forEach((tenant) => {
                tenantStmt.run(
                  tenant.full_name, tenant.phone, tenant.email, tenant.id_card,
                  tenant.address, tenant.hometown, tenant.has_temp_residence, tenant.tenant_type
                );
              });

              tenantStmt.finalize((err) => {
                if (err) {
                  console.error('Error seeding tenants:', err);
                } else {
                  console.log('✅ Seeded tenants successfully!');
                }

                // Seed accounts (sample)
                const accounts = [
                  { name: 'Tiền mặt', type: 'cash', opening_balance: 50000000, current_balance: 50000000, status: 'active' },
                  { name: 'Tài khoản ngân hàng Vietcombank', type: 'bank', account_number: '1234567890', account_holder: 'Công ty TNHH Nhà trọ', bank_name: 'Vietcombank', bank_branch: 'Chi nhánh TP.HCM', opening_balance: 200000000, current_balance: 200000000, status: 'active' },
                  { name: 'Tài khoản ngân hàng BIDV', type: 'bank', account_number: '0987654321', account_holder: 'Công ty TNHH Nhà trọ', bank_name: 'BIDV', bank_branch: 'Chi nhánh TP.HCM', opening_balance: 100000000, current_balance: 100000000, status: 'active' }
                ];

                const accountStmt = db.prepare(
                  'INSERT INTO accounts (name, type, account_number, account_holder, bank_name, bank_branch, opening_balance, current_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );

                accounts.forEach((account) => {
                  accountStmt.run(
                    account.name, account.type, account.account_number || null, account.account_holder || null,
                    account.bank_name || null, account.bank_branch || null,
                    account.opening_balance, account.current_balance, account.status
                  );
                });

                accountStmt.finalize((err) => {
                  if (err) {
                    console.error('Error seeding accounts:', err);
                    seedRemaining(resolve);
                    return;
                  }
                  console.log('✅ Seeded accounts successfully!');

                  // Seed contracts (sample)
                  // Get some rooms and tenants for contracts
                  db.all('SELECT id, branch_id FROM rooms WHERE status = ? LIMIT 10', ['available'], (err, availableRooms) => {
                    if (err || !availableRooms || availableRooms.length === 0) {
                      console.log('⚠️  No available rooms for contracts');
                      seedRemaining(resolve);
                      return;
                    }

                    db.all('SELECT id FROM tenants WHERE tenant_type = ? LIMIT 5', ['owner'], (err, ownerTenants) => {
                      if (err || !ownerTenants || ownerTenants.length === 0) {
                        console.log('⚠️  No owner tenants for contracts');
                        seedRemaining(resolve);
                        return;
                      }

                      const contracts = [];
                      const today = new Date();
                      
                      availableRooms.slice(0, Math.min(5, ownerTenants.length)).forEach((room, index) => {
                        const tenant = ownerTenants[index];
                        const startDate = new Date(today);
                        startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6)); // 0-6 months ago
                        const endDate = new Date(startDate);
                        endDate.setMonth(endDate.getMonth() + 12); // 12 months contract
                        
                        contracts.push({
                          branch_id: room.branch_id,
                          room_id: room.id,
                          tenant_id: tenant.id,
                          start_date: startDate.toISOString().split('T')[0],
                          end_date: endDate.toISOString().split('T')[0],
                          monthly_rent: 3000000 + Math.floor(Math.random() * 2000000), // 3-5 triệu
                          deposit: 2000000 + Math.floor(Math.random() * 2000000), // 2-4 triệu
                          status: 'active',
                          notes: `Hợp đồng thuê phòng mẫu ${index + 1}`
                        });
                      });

                      const contractStmt = db.prepare(
                        'INSERT INTO contracts (branch_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                      );

                      let contractCount = 0;
                      contracts.forEach((contract) => {
                        contractStmt.run(
                          contract.branch_id, contract.room_id, contract.tenant_id,
                          contract.start_date, contract.end_date,
                          contract.monthly_rent, contract.deposit,
                          contract.status, contract.notes
                        );
                        contractCount++;
                      });

                      contractStmt.finalize((err) => {
                        if (err) {
                          console.error('Error seeding contracts:', err);
                        } else {
                          console.log(`✅ Seeded ${contractCount} contracts successfully!`);
                        }

                        // Seed contract services
                        db.all('SELECT id FROM contracts', [], (err, allContracts) => {
                          if (err || !allContracts || allContracts.length === 0) {
                            seedRemaining(resolve);
                            return;
                          }

                          db.all('SELECT id, unit FROM services', [], (err, allServices) => {
                            if (err || !allServices || allServices.length === 0) {
                              seedRemaining(resolve);
                              return;
                            }

                            const contractServiceStmt = db.prepare(
                              'INSERT INTO contract_services (contract_id, service_id, price, quantity, notes) VALUES (?, ?, ?, ?, ?)'
                            );

                            let serviceCount = 0;
                            allContracts.forEach((contract) => {
                              // Add 2-4 services per contract
                              const numServices = 2 + Math.floor(Math.random() * 3);
                              const selectedServices = allServices
                                .sort(() => 0.5 - Math.random())
                                .slice(0, numServices);

                              selectedServices.forEach((service) => {
                                let price = 0;
                                let quantity = 1;
                                
                                if (service.id === 1) { // Điện
                                  price = 200000 + Math.floor(Math.random() * 300000); // 200k-500k
                                } else if (service.id === 2) { // Nước
                                  price = 50000 + Math.floor(Math.random() * 100000); // 50k-150k
                                } else { // Other services
                                  price = 100000 + Math.floor(Math.random() * 200000); // 100k-300k
                                  // For quantity-based services, random quantity 1-5
                                  if (service.unit === 'quantity') {
                                    quantity = 1 + Math.floor(Math.random() * 5);
                                  }
                                }

                                contractServiceStmt.run(
                                  contract.id,
                                  service.id,
                                  price,
                                  quantity,
                                  null
                                );
                                serviceCount++;
                              });
                            });

                            contractServiceStmt.finalize((err) => {
                              if (err) {
                                console.error('Error seeding contract services:', err);
                              } else {
                                console.log(`✅ Seeded ${serviceCount} contract services successfully!`);
                              }
                              seedRemaining(resolve);
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  function seedRemaining(resolve) {
    const db = dbModule.getDb();

    // Seed payments
    db.all('SELECT id, monthly_rent, start_date FROM contracts LIMIT 10', [], (err, contracts) => {
      if (err || !contracts || contracts.length === 0) {
        console.log('⚠️  No contracts for payments');
        seedAssets(resolve);
        return;
      }

      const payments = [];
      contracts.forEach((contract) => {
        // Create 2-6 payments per contract
        const numPayments = 2 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numPayments; i++) {
          const paymentDate = new Date(contract.start_date);
          paymentDate.setMonth(paymentDate.getMonth() + i);
          const dueDate = new Date(paymentDate);
          dueDate.setDate(dueDate.getDate() + 5);

          payments.push({
            contract_id: contract.id,
            amount: contract.monthly_rent,
            payment_type: 'rent',
            payment_date: paymentDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            status: Math.random() > 0.2 ? 'paid' : 'pending',
            payment_method: Math.random() > 0.5 ? 'cash' : 'bank_transfer',
            notes: `Thanh toán tháng ${i + 1}`
          });
        }
      });

      const paymentStmt = db.prepare(
        'INSERT INTO payments (contract_id, amount, payment_type, payment_date, due_date, status, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );

      let paymentCount = 0;
      payments.forEach((payment) => {
        paymentStmt.run(
          payment.contract_id, payment.amount, payment.payment_type,
          payment.payment_date, payment.due_date,
          payment.status, payment.payment_method, payment.notes
        );
        paymentCount++;
      });

      paymentStmt.finalize((err) => {
        if (err) {
          console.error('Error seeding payments:', err);
        } else {
          console.log(`✅ Seeded ${paymentCount} payments successfully!`);
        }
        seedAssets(resolve);
      });
    });
  }

  function seedAssets(resolve) {
    const db = dbModule.getDb();

    // Seed assets
      db.all('SELECT id, branch_id FROM rooms LIMIT 20', [], (err, rooms) => {
        if (err || !rooms || rooms.length === 0) {
          console.log('⚠️  No rooms for assets');
          seedImages(resolve);
          return;
        }

        db.all('SELECT id FROM branches LIMIT 5', [], (err, branches) => {
          if (err || !branches || branches.length === 0) {
            console.log('⚠️  No branches for assets');
            seedImages(resolve);
            return;
          }

        const assets = [
          // Room assets
          { name: 'Điều hòa', type: 'appliance', description: 'Điều hòa 1.5HP', value: 8000000, status: 'good', location_type: 'room', room_id: rooms[0]?.id, manufacturer: 'Daikin', model: 'FTK-35' },
          { name: 'Tủ lạnh', type: 'appliance', description: 'Tủ lạnh 150L', value: 5000000, status: 'good', location_type: 'room', room_id: rooms[1]?.id, manufacturer: 'Samsung', model: 'RT-150' },
          { name: 'Máy nước nóng', type: 'appliance', description: 'Máy nước nóng 20L', value: 2000000, status: 'good', location_type: 'room', room_id: rooms[2]?.id, manufacturer: 'Ariston', model: 'AN-20' },
          { name: 'Giường', type: 'furniture', description: 'Giường đôi', value: 3000000, status: 'good', location_type: 'room', room_id: rooms[3]?.id },
          { name: 'Tủ quần áo', type: 'furniture', description: 'Tủ 3 cánh', value: 2500000, status: 'good', location_type: 'room', room_id: rooms[4]?.id },
          { name: 'Bàn ghế', type: 'furniture', description: 'Bàn ghế gỗ', value: 1500000, status: 'good', location_type: 'room', room_id: rooms[5]?.id },
          // Branch assets
          { name: 'Máy giặt', type: 'appliance', description: 'Máy giặt 8kg', value: 6000000, status: 'good', location_type: 'branch', branch_id: branches[0]?.id, manufacturer: 'LG', model: 'WM-8KG' },
          { name: 'Máy phát điện', type: 'equipment', description: 'Máy phát điện 5KVA', value: 15000000, status: 'good', location_type: 'branch', branch_id: branches[1]?.id, manufacturer: 'Honda', model: 'EP-5000' },
          { name: 'Camera an ninh', type: 'equipment', description: 'Hệ thống camera 8 kênh', value: 10000000, status: 'good', location_type: 'branch', branch_id: branches[2]?.id, manufacturer: 'Hikvision', model: 'DS-7608' },
          { name: 'Tủ lạnh chung', type: 'appliance', description: 'Tủ lạnh 300L', value: 8000000, status: 'good', location_type: 'branch', branch_id: branches[3]?.id, manufacturer: 'Panasonic', model: 'NR-300' }
        ];

        const assetStmt = db.prepare(
          'INSERT INTO assets (name, type, description, value, status, location_type, room_id, branch_id, manufacturer, model) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        let assetCount = 0;
        assets.forEach((asset) => {
          if ((asset.location_type === 'room' && asset.room_id) || (asset.location_type === 'branch' && asset.branch_id)) {
            assetStmt.run(
              asset.name, asset.type, asset.description || null,
              asset.value, asset.status, asset.location_type,
              asset.room_id || null, asset.branch_id || null,
              asset.manufacturer || null, asset.model || null
            );
            assetCount++;
          }
        });

        assetStmt.finalize((err) => {
          if (err) {
            console.error('Error seeding assets:', err);
          } else {
            console.log(`✅ Seeded ${assetCount} assets successfully!`);
          }
          seedImages(resolve);
        });
      });
    });
  }

  function seedImages(resolve) {
    const db = dbModule.getDb();

    // Seed images (using placeholder base64 data)
    // Note: In production, you would use actual image files
    const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    db.all('SELECT id, branch_id FROM rooms LIMIT 10', [], (err, rooms) => {
      if (err || !rooms || rooms.length === 0) {
        console.log('⚠️  No rooms for images');
        finishSeeding(resolve);
        return;
      }

      db.all('SELECT id FROM branches LIMIT 5', [], (err, branches) => {
        if (err || !branches || branches.length === 0) {
          console.log('⚠️  No branches for images');
          finishSeeding(resolve);
          return;
        }

        const images = [
          // Room images
          { name: 'Phòng 101 - Góc phòng', description: 'Hình ảnh góc phòng', image_url: placeholderImage, location_type: 'room', room_id: rooms[0]?.id },
          { name: 'Phòng 101 - Ban công', description: 'Hình ảnh ban công', image_url: placeholderImage, location_type: 'room', room_id: rooms[0]?.id },
          { name: 'Phòng 102 - Toàn cảnh', description: 'Hình ảnh toàn cảnh phòng', image_url: placeholderImage, location_type: 'room', room_id: rooms[1]?.id },
          { name: 'Phòng 201 - Phòng tắm', description: 'Hình ảnh phòng tắm', image_url: placeholderImage, location_type: 'room', room_id: rooms[2]?.id },
          // Branch images
          { name: 'Chi nhánh 1 - Mặt tiền', description: 'Hình ảnh mặt tiền chi nhánh', image_url: placeholderImage, location_type: 'branch', branch_id: branches[0]?.id },
          { name: 'Chi nhánh 1 - Sảnh chính', description: 'Hình ảnh sảnh chính', image_url: placeholderImage, location_type: 'branch', branch_id: branches[0]?.id },
          { name: 'Chi nhánh 2 - Khu vực chung', description: 'Hình ảnh khu vực chung', image_url: placeholderImage, location_type: 'branch', branch_id: branches[1]?.id },
          { name: 'Chi nhánh 3 - Cầu thang', description: 'Hình ảnh cầu thang', image_url: placeholderImage, location_type: 'branch', branch_id: branches[2]?.id }
        ];

        const imageStmt = db.prepare(
          'INSERT INTO images (name, description, image_url, location_type, room_id, branch_id) VALUES (?, ?, ?, ?, ?, ?)'
        );

        let imageCount = 0;
        images.forEach((image) => {
          if ((image.location_type === 'room' && image.room_id) || (image.location_type === 'branch' && image.branch_id)) {
            imageStmt.run(
              image.name, image.description || null, image.image_url,
              image.location_type, image.room_id || null, image.branch_id || null
            );
            imageCount++;
          }
        });

        imageStmt.finalize((err) => {
          if (err) {
            console.error('Error seeding images:', err);
          } else {
            console.log(`✅ Seeded ${imageCount} images successfully!`);
          }
          seedVehicles(resolve);
        });
      });
    });
  }

  function seedVehicles(resolve) {
    const db = dbModule.getDb();

    // Seed vehicles - get all tenants
    db.all('SELECT id FROM tenants', [], (err, tenants) => {
      if (err || !tenants || tenants.length === 0) {
        console.log('⚠️  No tenants for vehicles');
        finishSeeding(resolve);
        return;
      }

      // Vehicle brands and models
      const motorcycleBrands = ['Honda', 'Yamaha', 'SYM', 'Piaggio', 'Suzuki'];
      const motorcycleModels = ['Wave Alpha', 'Air Blade', 'SH', 'Lead', 'Vision', 'Exciter', 'Grand', 'Attila', 'Vespa', 'Click'];
      
      const carBrands = ['Toyota', 'Honda', 'Hyundai', 'Mazda', 'Ford'];
      const carModels = ['Vios', 'City', 'Accent', 'Mazda2', 'Fiesta', 'Camry', 'Civic', 'Elantra', 'Mazda3', 'Focus'];
      
      const bicycleBrands = ['Giant', 'Trek', 'Merida', 'Thống Nhất', 'Địa Năng'];
      const bicycleModels = ['ATX', 'XTC', 'Big Nine', 'Crossway', 'MTB-100', 'Road-200'];

      const colors = ['Đỏ', 'Xanh', 'Đen', 'Trắng', 'Vàng', 'Bạc', 'Xám', 'Nâu'];

      const vehicles = [];
      
      // Create vehicles for each tenant (1-3 vehicles per tenant)
      tenants.forEach((tenant, index) => {
        const numVehicles = 1 + Math.floor(Math.random() * 3); // 1-3 vehicles per tenant
        
        for (let i = 0; i < numVehicles; i++) {
          const vehicleType = Math.random() > 0.7 ? 'car' : (Math.random() > 0.5 ? 'motorcycle' : (Math.random() > 0.3 ? 'bicycle' : 'other'));
          
          let brand = '';
          let model = '';
          let licensePlate = '';
          
          if (vehicleType === 'motorcycle') {
            brand = motorcycleBrands[Math.floor(Math.random() * motorcycleBrands.length)];
            model = motorcycleModels[Math.floor(Math.random() * motorcycleModels.length)];
            // Generate license plate: 51A-12345 format
            const provinceCode = ['51A', '51B', '51C', '51D', '51E', '51F', '51G', '51H', '51K', '51L'][Math.floor(Math.random() * 10)];
            const number = String(Math.floor(10000 + Math.random() * 90000));
            licensePlate = `${provinceCode}-${number}`;
          } else if (vehicleType === 'car') {
            brand = carBrands[Math.floor(Math.random() * carBrands.length)];
            model = carModels[Math.floor(Math.random() * carModels.length)];
            // Generate license plate: 51A-12345 format
            const provinceCode = ['51A', '51B', '51C', '51D', '51E'][Math.floor(Math.random() * 5)];
            const number = String(Math.floor(10000 + Math.random() * 90000));
            licensePlate = `${provinceCode}-${number}`;
          } else if (vehicleType === 'bicycle') {
            brand = bicycleBrands[Math.floor(Math.random() * bicycleBrands.length)];
            model = bicycleModels[Math.floor(Math.random() * bicycleModels.length)];
            // Bicycles don't have license plates
            licensePlate = null;
          } else {
            brand = 'Khác';
            model = 'Khác';
            licensePlate = null;
          }

          const color = colors[Math.floor(Math.random() * colors.length)];
          const description = vehicleType === 'motorcycle' 
            ? `Xe máy ${brand} ${model} màu ${color}`
            : vehicleType === 'car'
            ? `Ô tô ${brand} ${model} màu ${color}`
            : vehicleType === 'bicycle'
            ? `Xe đạp ${brand} ${model} màu ${color}`
            : `Phương tiện khác`;

          vehicles.push({
            tenant_id: tenant.id,
            vehicle_type: vehicleType,
            brand: brand,
            model: model,
            license_plate: licensePlate,
            color: color,
            description: description
          });
        }
      });

      const vehicleStmt = db.prepare(
        'INSERT INTO vehicles (tenant_id, vehicle_type, brand, model, license_plate, color, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );

      let vehicleCount = 0;
      vehicles.forEach((vehicle) => {
        vehicleStmt.run(
          vehicle.tenant_id,
          vehicle.vehicle_type,
          vehicle.brand,
          vehicle.model,
          vehicle.license_plate,
          vehicle.color,
          vehicle.description
        );
        vehicleCount++;
      });

      vehicleStmt.finalize((err) => {
        if (err) {
          console.error('Error seeding vehicles:', err);
        } else {
          console.log(`✅ Seeded ${vehicleCount} vehicles successfully!`);
        }
        seedInvoices(resolve);
      });
    });
  }

  function seedInvoices(resolve) {
    // Get all active contracts
    db.all('SELECT id, monthly_rent, branch_id FROM contracts WHERE status = ?', ['active'], (err, contracts) => {
      if (err) {
        console.error('Error getting contracts for invoices:', err);
        finishSeeding(resolve);
        return;
      }

      if (!contracts || contracts.length === 0) {
        console.log('⚠️  No active contracts found. Skipping invoice seeding.');
        finishSeeding(resolve);
        return;
      }

      const invoices = [];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Create invoices for last 3 months for each contract
      contracts.forEach((contract) => {
        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
          const invoiceMonth = currentMonth - monthOffset;
          const invoiceYear = monthOffset === 0 ? currentYear : (invoiceMonth <= 0 ? currentYear - 1 : currentYear);
          const adjustedMonth = invoiceMonth <= 0 ? invoiceMonth + 12 : invoiceMonth;

          // Get contract services to calculate service amount
          db.all(
            `SELECT cs.*, s.name as service_name, s.unit, s.unit_name
             FROM contract_services cs
             LEFT JOIN services s ON cs.service_id = s.id
             WHERE cs.contract_id = ?`,
            [contract.id],
            (err, services) => {
              if (err) {
                console.error(`Error getting services for contract ${contract.id}:`, err);
                return;
              }

              const serviceAmount = services.reduce((sum, s) => {
                return sum + ((s.price || 0) * (s.quantity || 1));
              }, 0);

              const rentAmount = contract.monthly_rent || 0;
              const totalAmount = rentAmount + serviceAmount;
              const invoiceDate = new Date(invoiceYear, adjustedMonth - 1, 1);
              const dueDate = new Date(invoiceYear, adjustedMonth - 1, 15);

              // Generate invoice number
              const invoiceNumber = `HD-${invoiceYear}${String(adjustedMonth).padStart(2, '0')}-${String(contract.id).padStart(4, '0')}${String(monthOffset + 1).padStart(2, '0')}`;

              invoices.push({
                contract_id: contract.id,
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate.toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0],
                period_month: adjustedMonth,
                period_year: invoiceYear,
                rent_amount: rentAmount,
                service_amount: serviceAmount,
                previous_debt: 0,
                total_amount: totalAmount,
                paid_amount: monthOffset === 0 ? 0 : totalAmount, // Last month unpaid, previous months paid
                remaining_amount: monthOffset === 0 ? totalAmount : 0,
                status: monthOffset === 0 ? 'pending' : 'paid',
                qr_code: null,
                notes: null,
                services: services
              });
            }
          );
        }
      });

      // Wait a bit for async service queries to complete
      setTimeout(() => {
        const invoiceStmt = db.prepare(
          `INSERT INTO invoices (
            contract_id, invoice_number, invoice_date, due_date,
            period_month, period_year, rent_amount, service_amount,
            previous_debt, total_amount, paid_amount, remaining_amount,
            status, qr_code, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        const invoiceServiceStmt = db.prepare(
          `INSERT INTO invoice_services (
            invoice_id, service_id, service_name, price, quantity, amount,
            meter_start, meter_end, meter_usage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        let invoiceCount = 0;
        let processedInvoices = 0;

        invoices.forEach((invoice) => {
          invoiceStmt.run(
            invoice.contract_id,
            invoice.invoice_number,
            invoice.invoice_date,
            invoice.due_date,
            invoice.period_month,
            invoice.period_year,
            invoice.rent_amount,
            invoice.service_amount,
            invoice.previous_debt,
            invoice.total_amount,
            invoice.paid_amount,
            invoice.remaining_amount,
            invoice.status,
            invoice.qr_code,
            invoice.notes,
            function(err) {
              if (err) {
                console.error(`Error inserting invoice ${invoice.invoice_number}:`, err);
              } else {
                invoiceCount++;
                const invoiceId = this.lastID;

                // Insert invoice services
                if (invoice.services && invoice.services.length > 0) {
                  invoice.services.forEach((service) => {
                    const amount = (service.price || 0) * (service.quantity || 1);
                    invoiceServiceStmt.run(
                      invoiceId,
                      service.service_id,
                      service.service_name || '',
                      service.price || 0,
                      service.quantity || 1,
                      amount,
                      null,
                      null,
                      null
                    );
                  });
                }
              }

              processedInvoices++;
              if (processedInvoices === invoices.length) {
                invoiceStmt.finalize();
                invoiceServiceStmt.finalize((err) => {
                  if (err) {
                    console.error('Error finalizing invoice services:', err);
                  } else {
                    console.log(`✅ Seeded ${invoiceCount} invoices successfully!`);
                  }
                  seedFinancialCategories(resolve);
                });
              }
            }
          );
        });

        if (invoices.length === 0) {
          seedFinancialCategories(resolve);
        }
      }, 2000);
    });
  }

  function seedFinancialCategories(resolve) {
    const db = dbModule.getDb();

    // Check if financial categories already exist
    db.get('SELECT COUNT(*) as count FROM financial_categories', [], (err, row) => {
      if (err) {
        console.error('Error checking financial categories:', err);
        finishSeeding(resolve);
        return;
      }

      if (row.count > 0) {
        console.log('⚠️  Financial categories already exist. Skipping seed.');
        finishSeeding(resolve);
        return;
      }

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
        } else {
          console.log(`✅ Seeded ${categoryCount} financial categories successfully!`);
        }
        finishSeeding(resolve);
      });
    });
  }

  function finishSeeding(resolve) {
    console.log('✅ All seed data created successfully!');
    resolve();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Database seeded successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding database:', err);
      process.exit(1);
    });
}

module.exports = { seed };

