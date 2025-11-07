# HƯỚNG DẪN CHẠY ỨNG DỤNG TRÊN LOCALHOST

## Bước 1: Kiểm tra Dependencies

```bash
# Kiểm tra Node.js (cần Node.js 14+)
node --version

# Cài đặt dependencies nếu chưa có
npm install
cd client
npm install
cd ..
```

## Bước 2: Kiểm tra Database

```bash
# Kiểm tra database có tồn tại không
ls server/database/nhatro.db

# Nếu chưa có, seed dữ liệu
npm run seed
```

## Bước 3: Chạy Ứng dụng

### Cách 1: Chạy cả 2 services cùng lúc (Khuyến nghị)

Mở **1 terminal** và chạy:
```bash
npm run dev
```

Bạn sẽ thấy output như:
```
[0] Server running on port 5000
[1] VITE v7.x.x  ready in xxx ms
[1] ➜  Local:   http://localhost:5173/
```

### Cách 2: Chạy riêng từng service

**Terminal 1 - Backend:**
```bash
npm run server
```

Bạn sẽ thấy:
```
✅ Server running on port 5000
🌐 Backend API: http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Bạn sẽ thấy:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Bước 4: Mở trình duyệt

1. Mở trình duyệt (Chrome, Firefox, Safari...)
2. Truy cập: **http://localhost:5173**
3. Đăng nhập với:
   - Username: `admin`
   - Password: `admin`

## Kiểm tra Backend API

Mở trình duyệt và truy cập:
- http://localhost:5000/api/test (nếu có)
- http://localhost:5000/api/dashboard/stats (cần đăng nhập)

Hoặc test bằng curl:
```bash
curl http://localhost:5000/api/test
```

## Các lỗi thường gặp

### ❌ Lỗi "Cannot find module"
**Giải pháp:** Chạy lại `npm install` trong cả root và client folder

### ❌ Lỗi "Port 5000 already in use"
**Giải pháp:** 
- Đóng ứng dụng đang dùng port 5000
- Hoặc đổi port trong `server/index.js` (dòng 7)

### ❌ Lỗi "Port 5173 already in use"
**Giải pháp:**
- Vite sẽ tự động chọn port khác (5174, 5175...)
- Xem terminal để biết port mới

### ❌ Lỗi "Database locked" hoặc "Cannot connect to database"
**Giải pháp:**
```bash
# Xóa database cũ và tạo lại
rm server/database/nhatro.db
npm run seed
```

### ❌ Lỗi CORS hoặc "Network Error"
**Giải pháp:**
- Đảm bảo cả backend và frontend đều đang chạy
- Kiểm tra file `client/vite.config.js` có proxy config
- Kiểm tra file `client/src/services/api.js` dùng đúng URL

### ❌ Trang trắng khi mở localhost:5173
**Giải pháp:**
1. Mở Browser Console (F12)
2. Xem lỗi trong Console tab
3. Kiểm tra Network tab xem API có gọi được không

### ❌ Không đăng nhập được
**Giải pháp:**
- Đảm bảo backend đang chạy
- Kiểm tra Browser Console (F12) xem có lỗi gì
- Thử mở http://localhost:5000/api/auth/login bằng Postman hoặc curl

## Kiểm tra nhanh

Chạy các lệnh sau để kiểm tra:

```bash
# 1. Kiểm tra Node.js
node --version

# 2. Kiểm tra database
ls -la server/database/nhatro.db

# 3. Test server
node test-server.js
# (Nhấn Ctrl+C để dừng)

# 4. Test API
curl http://localhost:5000/api/test
```

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, vui lòng cung cấp:
1. Thông báo lỗi cụ thể (từ terminal hoặc browser console)
2. Output của `node --version`
3. Output của `npm run dev` hoặc `npm run server`

