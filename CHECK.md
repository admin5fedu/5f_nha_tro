# ✅ KIỂM TRA TRƯỚC KHI CHẠY

## 1. Kiểm tra Dependencies

```bash
# Kiểm tra Node.js
node --version
# Cần Node.js 14 hoặc cao hơn

# Kiểm tra npm
npm --version

# Cài đặt dependencies (nếu chưa có)
npm install
cd client && npm install && cd ..
```

## 2. Kiểm tra Database

```bash
# Kiểm tra database có tồn tại
ls server/database/nhatro.db

# Nếu không có, seed dữ liệu
npm run seed
```

## 3. Kiểm tra Port

```bash
# Kiểm tra port 5000 có đang được dùng không
lsof -i :5000

# Kiểm tra port 5173 có đang được dùng không  
lsof -i :5173

# Nếu có process đang dùng, dừng nó:
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:5173)
```

## 4. Chạy ứng dụng

```bash
npm run dev
```

**Bạn sẽ thấy output như sau:**

```
[0] > nha-tro-management@1.0.0 server
[0] > nodemon server/index.js
[0] 
[0] [nodemon] 3.0.1
[0] [nodemon] to restart at any time, enter `rs`
[0] [nodemon] watching path(s): *.*
[0] [nodemon] watching extensions: js
[0] [nodemon] starting `node server/index.js`
[0] Connected to SQLite database
[0] Database tables created successfully
[0] ✅ Server running on port 5000
[0] 🌐 Backend API: http://localhost:5000
[0] 📱 Frontend: http://localhost:5173
[1] 
[1] > client@0.0.0 dev
[1] > vite
[1] 
[1] 
[1]   VITE v7.x.x  ready in xxx ms
[1] 
[1]   ➜  Local:   http://localhost:5173/
[1]   ➜  Network: use --host to expose
```

## 5. Mở trình duyệt

Mở trình duyệt và vào: **http://localhost:5173**

## 6. Đăng nhập

- Username: `admin`
- Password: `admin`

## ❌ Nếu gặp lỗi

### Lỗi "Cannot find module"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules client/node_modules
npm install
cd client && npm install && cd ..
```

### Lỗi "Port already in use"
```bash
# Dừng tất cả process Node
pkill -f node
# Hoặc dừng cụ thể
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:5173)
```

### Lỗi "Database locked"
```bash
# Xóa database và tạo lại
rm server/database/nhatro.db
npm run seed
```

### Trang trắng khi mở localhost:5173
1. Mở Browser Console (F12)
2. Xem tab Console có lỗi gì
3. Xem tab Network xem API có gọi được không
4. Đảm bảo backend đang chạy (http://localhost:5000)

### Không đăng nhập được
1. Kiểm tra backend có chạy không: `curl http://localhost:5000/api/test`
2. Kiểm tra Browser Console (F12)
3. Thử đăng nhập lại với: admin/admin

## 📞 Liên hệ

Nếu vẫn không chạy được, cung cấp:
1. Output của `npm run dev`
2. Screenshot Browser Console (F12)
3. Output của `node --version`
4. Output của `npm --version`

