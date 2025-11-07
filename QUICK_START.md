# 🚀 QUICK START - Hướng dẫn nhanh

## ⚡ Chạy nhanh (3 bước)

### Bước 1: Cài đặt (nếu chưa có)
```bash
npm install
cd client && npm install && cd ..
```

### Bước 2: Seed dữ liệu (nếu chưa có)
```bash
npm run seed
```

### Bước 3: Chạy ứng dụng
```bash
npm run dev
```

## 📱 Truy cập

Sau khi chạy `npm run dev`, mở trình duyệt và vào:

**http://localhost:5173**

Đăng nhập:
- Username: `admin`
- Password: `admin`

## ⚠️ Nếu không chạy được

### Kiểm tra port đang được dùng:
```bash
# Kiểm tra port 5000 (backend)
lsof -i :5000

# Kiểm tra port 5173 (frontend)
lsof -i :5173
```

### Nếu port bị chiếm:
```bash
# Dừng process đang dùng port 5000
kill -9 $(lsof -t -i:5000)

# Dừng process đang dùng port 5173
kill -9 $(lsof -t -i:5173)
```

### Chạy lại:
```bash
npm run dev
```

## 🔍 Kiểm tra Backend

Mở terminal mới và test:
```bash
curl http://localhost:5000/api/test
```

Nếu thấy `{"message":"Server is running!"}` là OK ✅

## 🐛 Debug

Nếu vẫn lỗi, mở Browser Console (F12) và xem:
- Tab **Console**: Lỗi JavaScript
- Tab **Network**: Xem API calls có thành công không

## 📞 Cần hỗ trợ?

Cho biết:
1. Output của `npm run dev`
2. Lỗi trong Browser Console (F12)
3. Screenshot nếu có

