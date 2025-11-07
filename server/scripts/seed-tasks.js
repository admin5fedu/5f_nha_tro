const { init, getDb, close } = require('../database/db');

async function seedTasks() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Delete existing tasks (for fresh seed)
        db.run('DELETE FROM tasks', [], (err) => {
          if (err) {
            console.error('Error deleting existing tasks:', err);
            // Continue anyway
          } else {
            console.log('✅ Deleted existing tasks');
          }

          // Get users, branches, and rooms
          db.all('SELECT id FROM users LIMIT 5', [], (err, users) => {
            if (err) {
              console.error('Error fetching users:', err);
              reject(err);
              return;
            }

            if (users.length < 2) {
              console.log('⚠️  Not enough users. Need at least 2 users to create tasks.');
              resolve();
              return;
            }

            db.all('SELECT id FROM branches LIMIT 5', [], (err, branches) => {
              if (err) {
                console.error('Error fetching branches:', err);
                reject(err);
                return;
              }

              db.all('SELECT id, branch_id FROM rooms LIMIT 20', [], (err, rooms) => {
                if (err) {
                  console.error('Error fetching rooms:', err);
                  reject(err);
                  return;
                }

                // Prepare sample tasks
                const tasks = [];

                // Sửa chữa tasks
                const repairTasks = [
                  {
                    title: 'Sửa chữa hệ thống điện phòng 101',
                    description: 'Khách hàng báo mất điện trong phòng 101. Cần kiểm tra và sửa chữa hệ thống điện, thay thế công tắc hoặc ổ cắm nếu cần.',
                    status: 'pending',
                    priority: 'high',
                    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
                    notes: 'Ưu tiên cao vì ảnh hưởng đến sinh hoạt của khách thuê'
                  },
                  {
                    title: 'Sửa chữa vòi nước bị rò rỉ phòng 205',
                    description: 'Vòi nước trong nhà vệ sinh phòng 205 bị rò rỉ nước. Cần thay thế vòi nước hoặc sửa chữa gioăng cao su.',
                    status: 'in_progress',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    progress: 50,
                    notes: 'Đã mua vật liệu, đang chờ thợ đến sửa'
                  },
                  {
                    title: 'Sửa chữa cửa ra vào phòng 302',
                    description: 'Cửa ra vào phòng 302 bị kẹt, khó mở/đóng. Cần kiểm tra bản lề và khóa cửa, bôi trơn hoặc thay thế nếu cần.',
                    status: 'pending',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Khách hàng đã báo từ tuần trước'
                  },
                  {
                    title: 'Sửa chữa điều hòa không hoạt động phòng 108',
                    description: 'Điều hòa phòng 108 không bật được. Cần kiểm tra nguồn điện, remote, và hệ thống làm lạnh. Có thể cần nạp gas hoặc thay thế linh kiện.',
                    status: 'pending',
                    priority: 'urgent',
                    due_date: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Today
                    notes: 'Khẩn cấp - thời tiết nóng, ảnh hưởng lớn đến khách thuê'
                  },
                  {
                    title: 'Sửa chữa bồn cầu bị tắc phòng 401',
                    description: 'Bồn cầu phòng 401 bị tắc, nước không thoát được. Cần thông tắc và kiểm tra hệ thống ống nước.',
                    status: 'completed',
                    priority: 'high',
                    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
                    progress: 100,
                    result: 'Đã thông tắc thành công bằng máy thông tắc chuyên dụng. Hệ thống hoạt động bình thường. Khách hàng đã xác nhận hài lòng.',
                    notes: 'Hoàn thành đúng hạn'
                  },
                  {
                    title: 'Sửa chữa quạt trần phòng 203',
                    description: 'Quạt trần phòng 203 không quay, có tiếng kêu lạ. Cần kiểm tra motor và cánh quạt.',
                    status: 'in_progress',
                    priority: 'low',
                    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    progress: 30,
                    notes: 'Đã tháo quạt, đang chờ phụ tùng thay thế'
                  },
                  {
                    title: 'Sửa chữa hệ thống nước nóng phòng 305',
                    description: 'Bình nước nóng phòng 305 không hoạt động. Cần kiểm tra nguồn điện, bộ điều khiển và thanh đốt.',
                    status: 'pending',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Khách hàng yêu cầu sửa gấp'
                  },
                  {
                    title: 'Sửa chữa cửa sổ bị hỏng phòng 207',
                    description: 'Cửa sổ phòng 207 bị vỡ kính, cần thay thế kính mới và kiểm tra khung cửa.',
                    status: 'pending',
                    priority: 'high',
                    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Ảnh hưởng đến an ninh phòng'
                  }
                ];

                // Thu tiền tasks
                const collectionTasks = [
                  {
                    title: 'Thu tiền phòng tháng 12 - Phòng 101',
                    description: 'Thu tiền phòng tháng 12/2024 từ khách thuê phòng 101. Số tiền: 3.000.000 VNĐ. Cần thu trước ngày 5/12.',
                    status: 'pending',
                    priority: 'high',
                    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Khách hàng thường thanh toán đúng hạn'
                  },
                  {
                    title: 'Thu tiền phòng tháng 12 - Phòng 205',
                    description: 'Thu tiền phòng tháng 12/2024 từ khách thuê phòng 205. Số tiền: 2.500.000 VNĐ. Đã quá hạn 2 ngày.',
                    status: 'in_progress',
                    priority: 'urgent',
                    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
                    progress: 60,
                    result: 'Đã liên hệ khách hàng, họ hứa sẽ thanh toán trong ngày hôm nay.',
                    notes: 'Quá hạn thanh toán, cần theo dõi sát'
                  },
                  {
                    title: 'Thu tiền dịch vụ internet - Phòng 302',
                    description: 'Thu tiền dịch vụ internet tháng 12 cho phòng 302. Số tiền: 200.000 VNĐ.',
                    status: 'completed',
                    priority: 'medium',
                    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    progress: 100,
                    result: 'Đã thu tiền thành công. Khách hàng thanh toán bằng tiền mặt. Đã cập nhật vào hệ thống.',
                    notes: 'Hoàn thành đúng hạn'
                  },
                  {
                    title: 'Thu tiền phòng tháng 12 - Phòng 108',
                    description: 'Thu tiền phòng tháng 12/2024 từ khách thuê phòng 108. Số tiền: 3.500.000 VNĐ.',
                    status: 'pending',
                    priority: 'high',
                    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Khách hàng mới, cần nhắc nhở trước'
                  },
                  {
                    title: 'Thu tiền điện nước tháng 11 - Phòng 401',
                    description: 'Thu tiền điện nước tháng 11/2024 cho phòng 401. Số tiền: 450.000 VNĐ (điện: 300.000, nước: 150.000).',
                    status: 'pending',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Đã gửi hóa đơn cho khách hàng'
                  },
                  {
                    title: 'Thu tiền phòng tháng 12 - Phòng 203',
                    description: 'Thu tiền phòng tháng 12/2024 từ khách thuê phòng 203. Số tiền: 2.800.000 VNĐ.',
                    status: 'in_progress',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    progress: 40,
                    notes: 'Đã nhắc nhở, đang chờ khách hàng thanh toán'
                  },
                  {
                    title: 'Thu tiền dịch vụ giặt ủi - Phòng 305',
                    description: 'Thu tiền dịch vụ giặt ủi tháng 12 cho phòng 305. Số tiền: 150.000 VNĐ.',
                    status: 'pending',
                    priority: 'low',
                    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Dịch vụ tùy chọn, không bắt buộc'
                  },
                  {
                    title: 'Thu tiền phòng tháng 12 - Phòng 207',
                    description: 'Thu tiền phòng tháng 12/2024 từ khách thuê phòng 207. Số tiền: 3.200.000 VNĐ. Khách hàng yêu cầu thanh toán chậm.',
                    status: 'pending',
                    priority: 'high',
                    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Cần xác nhận lại với quản lý về việc cho phép thanh toán chậm'
                  },
                  {
                    title: 'Thu tiền cọc phòng 501',
                    description: 'Thu tiền cọc từ khách thuê mới phòng 501. Số tiền cọc: 3.000.000 VNĐ (bằng 1 tháng tiền phòng).',
                    status: 'completed',
                    priority: 'high',
                    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    progress: 100,
                    result: 'Đã thu tiền cọc thành công. Khách hàng thanh toán bằng chuyển khoản. Đã cập nhật hợp đồng và hệ thống.',
                    notes: 'Khách hàng mới, đã ký hợp đồng'
                  },
                  {
                    title: 'Thu tiền phòng tháng 12 - Phòng 402',
                    description: 'Thu tiền phòng tháng 12/2024 từ khách thuê phòng 402. Số tiền: 2.600.000 VNĐ.',
                    status: 'pending',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Khách hàng thường thanh toán đúng hạn'
                  }
                ];

                // Combine all tasks
                const allTasks = [...repairTasks, ...collectionTasks];

                // Prepare insert statement
                const stmt = db.prepare(`
                  INSERT INTO tasks (
                    title, description, assigned_by, assigned_to,
                    branch_id, room_id, status, priority, due_date,
                    progress, result, notes
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                let inserted = 0;
                const totalTasks = allTasks.length;

                allTasks.forEach((task, index) => {
                  // Assign users (rotate through available users)
                  const assignedBy = users[0].id; // First user assigns
                  const assignedTo = users[index % (users.length - 1) + 1].id || users[1].id; // Other users receive

                  // Assign branch and room if available
                  let branchId = null;
                  let roomId = null;
                  
                  if (branches.length > 0) {
                    branchId = branches[index % branches.length].id;
                    
                    // Find a room in this branch
                    const branchRooms = rooms.filter(r => r.branch_id === branchId);
                    if (branchRooms.length > 0) {
                      roomId = branchRooms[index % branchRooms.length].id;
                    }
                  }

                  stmt.run(
                    task.title,
                    task.description,
                    assignedBy,
                    assignedTo,
                    branchId,
                    roomId,
                    task.status,
                    task.priority,
                    task.due_date,
                    task.progress || 0,
                    task.result || null,
                    task.notes || null,
                    (err) => {
                      if (err) {
                        console.error(`Error inserting task "${task.title}":`, err);
                      } else {
                        inserted++;
                        if (inserted === totalTasks) {
                          stmt.finalize((err) => {
                            if (err) {
                              console.error('Error finalizing statement:', err);
                              reject(err);
                            } else {
                              console.log(`✅ Seeded ${inserted} tasks successfully!`);
                              resolve();
                            }
                          });
                        }
                      }
                    }
                  );
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    close();
  }
}

if (require.main === module) {
  seedTasks()
    .then(() => {
      console.log('✅ Task seeding completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Task seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedTasks };

