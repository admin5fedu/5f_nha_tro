# 🚀 Quick Start Guide - Firebase Integration

## ⚡ Bắt đầu nhanh trong 5 phút

### Bước 1: Import Database (2 phút)

1. Mở Firebase Console: https://console.firebase.google.com/
2. Chọn project **f-nha-tro**
3. Menu bên trái → **Realtime Database**
4. Click nút **⋮** (3 chấm dọc) → **Import JSON**
5. Chọn file `firebase-database-export.json`
6. Click **Import** và đợi hoàn tất

### Bước 2: Cấu hình Rules (1 phút)

Trong Firebase Console → Realtime Database → Tab **Rules**:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Click **Publish**

### Bước 3: Chạy App (1 phút)

```bash
# Đảm bảo đang ở thư mục client
cd "/Users/admin/Desktop/Nhà trọ/client"

# Dev server đã chạy rồi, hoặc restart:
npm run dev
```

### Bước 4: Đăng nhập (30 giây)

Mở browser: http://localhost:5173

**Đăng nhập:**
- Username: `admin`
- Password: `password`

### Bước 5: Test (30 giây)

Kiểm tra các tính năng:
- ✅ Dashboard hiển thị số liệu
- ✅ Chi nhánh: 3 chi nhánh
- ✅ Phòng trọ: 6 phòng
- ✅ Khách thuê: 4 người
- ✅ Hợp đồng: 3 hợp đồng
- ✅ Hóa đơn: 3 hóa đơn

---

## 🎯 Xác nhận Firebase đang hoạt động

Mở Browser Console (F12), bạn sẽ thấy:

```
🔥 API Mode: Firebase Realtime Database
```

Nếu thấy dòng này → ✅ Firebase đang hoạt động!

---

## 🔄 Chuyển về Backend API

Nếu muốn quay lại dùng Backend API (SQLite):

```bash
# 1. Sửa .env
echo "VITE_USE_FIREBASE=false" > "/Users/admin/Desktop/Nhà trọ/client/.env"

# 2. Restart dev server
# Ctrl+C để stop, sau đó:
npm run dev

# 3. Khởi động backend server (terminal mới)
cd "/Users/admin/Desktop/Nhà trọ"
npm run dev
```

---

## 📊 Dữ liệu mẫu

Sau khi import, bạn sẽ có:

| Module | Dữ liệu |
|--------|---------|
| Tài khoản | 4 users (admin, manager, accountant, staff) |
| Chi nhánh | 3 branches (Cầu Giấy, Đống Đa, Thanh Xuân) |
| Phòng trọ | 6 rooms (P101, P102, P201...) |
| Khách thuê | 4 tenants (có cả cotenants) |
| Hợp đồng | 3 contracts (đang active) |
| Dịch vụ | 5 services (điện, nước, internet...) |
| Hóa đơn | 3 invoices (paid, pending, partial) |
| Tài khoản NH | 3 accounts |
| Giao dịch | 5 transactions |
| Công việc | 3 tasks |
| Và nhiều hơn... | |

---

## 🆘 Troubleshooting nhanh

### Lỗi: Không thấy dữ liệu?

**Kiểm tra:**
1. Firebase Console → Database → Data tab có dữ liệu không?
2. Browser Console (F12) có lỗi không?
3. `.env` file có đúng `VITE_USE_FIREBASE=true` không?

**Giải pháp:**
```bash
# Kiểm tra .env
cat "/Users/admin/Desktop/Nhà trọ/client/.env"

# Restart dev server
cd "/Users/admin/Desktop/Nhà trọ/client"
npm run dev
```

### Lỗi: "Permission denied"?

**Giải pháp:** Cập nhật Firebase Rules (xem Bước 2 ở trên)

### Lỗi: "Cannot find module 'firebase'"?

**Giải pháp:**
```bash
cd "/Users/admin/Desktop/Nhà trọ/client"
npm install
```

---

## 📚 Tài liệu đầy đủ

- `FIREBASE_SETUP_COMPLETE.md` - Hướng dẫn chi tiết
- `FIREBASE_IMPORT_GUIDE.md` - Import database
- `INTEGRATION_SUMMARY.md` - Tổng kết kỹ thuật

---

## ✅ Checklist nhanh

- [ ] Import database vào Firebase ✅
- [ ] Set Rules = `{".read": true, ".write": true}` ✅
- [ ] File `.env` có `VITE_USE_FIREBASE=true` ✅
- [ ] Dev server đang chạy ✅
- [ ] Đăng nhập thành công với `admin`/`password` ✅
- [ ] Thấy dữ liệu trong các module ✅

**Nếu tất cả ✅ → Bạn đã hoàn tất! 🎉**

---

**Thời gian ước tính:** 5 phút  
**Độ khó:** ⭐ Dễ  
**Status:** ✅ Ready to use
