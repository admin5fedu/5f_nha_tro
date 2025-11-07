const { init, getDb, close } = require('../database/db');

async function seedMeterReadings() {
  try {
    await init();
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Delete existing meter readings (for fresh seed)
        db.run('DELETE FROM meter_readings', [], (err) => {
          if (err) {
            console.error('Error deleting existing meter readings:', err);
            // Continue anyway
          } else {
            console.log('✅ Deleted existing meter readings');
          }

          // Get rooms with active contracts
          db.all(`
            SELECT DISTINCT r.id as room_id, r.room_number, c.id as contract_id
            FROM rooms r
            INNER JOIN contracts c ON c.room_id = r.id
            WHERE c.status = 'active'
            LIMIT 20
          `, [], (err, rooms) => {
            if (err) {
              console.error('Error fetching rooms:', err);
              reject(err);
              return;
            }

            if (rooms.length === 0) {
              console.log('⚠️  No rooms with active contracts found');
              resolve();
              return;
            }

            // Get meter-based services
            db.all('SELECT id, name FROM services WHERE unit = ?', ['meter'], (err, services) => {
              if (err) {
                console.error('Error fetching services:', err);
                reject(err);
                return;
              }

              if (services.length === 0) {
                console.log('⚠️  No meter-based services found');
                resolve();
                return;
              }

              // Get users
              db.all('SELECT id FROM users LIMIT 1', [], (err, users) => {
                if (err) {
                  console.error('Error fetching users:', err);
                  reject(err);
                  return;
                }

                if (users.length === 0) {
                  console.log('⚠️  No users found');
                  resolve();
                  return;
                }

                const userId = users[0].id;
                const readings = [];

                // Generate meter readings for last 3 months
                const today = new Date();
                for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                  const readingDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 15);
                  
                  rooms.forEach((room, roomIndex) => {
                    services.forEach((service, serviceIndex) => {
                      // Generate realistic meter readings
                      const baseStart = (roomIndex * 1000) + (serviceIndex * 100) + (monthOffset * 50);
                      const usage = Math.floor(Math.random() * 50) + 20; // 20-70 units per month
                      const meterStart = baseStart + (monthOffset * usage);
                      const meterEnd = meterStart + usage;

                      readings.push({
                        room_id: room.room_id,
                        service_id: service.id,
                        reading_date: readingDate.toISOString().split('T')[0],
                        meter_start: meterStart,
                        meter_end: meterEnd,
                        meter_usage: usage,
                        recorded_by: userId,
                        notes: monthOffset === 0 ? 'Ghi số tháng hiện tại' : `Ghi số tháng ${monthOffset} tháng trước`
                      });
                    });
                  });
                }

                // Insert meter readings
                const stmt = db.prepare(`
                  INSERT INTO meter_readings (
                    room_id, service_id, reading_date,
                    meter_start, meter_end, meter_usage,
                    recorded_by, notes
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);

                let inserted = 0;
                const totalReadings = readings.length;

                readings.forEach((reading) => {
                  stmt.run(
                    reading.room_id,
                    reading.service_id,
                    reading.reading_date,
                    reading.meter_start,
                    reading.meter_end,
                    reading.meter_usage,
                    reading.recorded_by,
                    reading.notes || null,
                    (err) => {
                      if (err) {
                        console.error(`Error inserting meter reading:`, err);
                      } else {
                        inserted++;
                        if (inserted === totalReadings) {
                          stmt.finalize((err) => {
                            if (err) {
                              console.error('Error finalizing statement:', err);
                              reject(err);
                            } else {
                              console.log(`✅ Seeded ${inserted} meter readings successfully!`);
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
  seedMeterReadings()
    .then(() => {
      console.log('✅ Meter readings seeding completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Meter readings seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedMeterReadings };

