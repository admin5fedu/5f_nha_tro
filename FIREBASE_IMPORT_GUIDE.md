# Hướng dẫn Import Database vào Firebase Realtime Database

## 🔥 Bước 1: Truy cập Firebase Console

1. Truy cập: https://console.firebase.google.com/
2. Chọn project của bạn (hoặc tạo project mới nếu chưa có)
3. Vào menu bên trái, chọn **"Realtime Database"**

## 📤 Bước 2: Import dữ liệu

### Cách 1: Import từ Firebase Console (Khuyến nghị)

1. Trong Realtime Database, click vào biểu tượng **3 chấm dọc** (⋮) ở góc phải trên
2. Chọn **"Import JSON"**
3. Click **"Browse"** và chọn file `firebase-database-export.json`
4. Click **"Import"**
5. Đợi vài giây để Firebase import xong

### Cách 2: Import bằng cURL (Command Line)

```bash
# Thay YOUR_PROJECT_ID và YOUR_DATABASE_SECRET bằng thông tin thực tế
curl -X PUT \
  -d @firebase-database-export.json \
  https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app/.json?auth=YOUR_DATABASE_SECRET
```

**Lấy Database Secret:**
- Vào Firebase Console > Project Settings > Service accounts
- Click "Database secrets"
- Copy secret key

### Cách 3: Import bằng Firebase CLI

```bash
# Cài đặt Firebase CLI nếu chưa có
npm install -g firebase-tools

# Login
firebase login

# Import
firebase database:set / firebase-database-export.json --project YOUR_PROJECT_ID
```

## 🔐 Bước 3: Cấu hình Security Rules

Sau khi import xong, cần cấu hình Rules để bảo mật database:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')"
      }
    },
    "branches": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "rooms": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "tenants": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "contracts": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "invoices": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "accounts": {
      ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'accountant')",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'accountant')"
    },
    "transactions": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "financial_categories": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "services": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "assets": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "images": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "vehicles": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "tasks": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "meter_readings": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "notifications": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "notification_recipients": {
      "$nrId": {
        ".read": "auth != null && data.child('user_id').val() === auth.uid",
        ".write": "auth != null && data.child('user_id').val() === auth.uid"
      }
    },
    "permissions": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "roles": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "role_permissions": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "settings": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

**Cách cấu hình:**
1. Trong Realtime Database, chọn tab **"Rules"**
2. Copy rules trên vào editor
3. Click **"Publish"**

## 🔍 Bước 4: Kiểm tra dữ liệu

1. Trong tab **"Data"** của Realtime Database
2. Bạn sẽ thấy cấu trúc dữ liệu như sau:

```
├── users (4 users)
├── branches (3 chi nhánh)
├── rooms (6 phòng)
├── tenants (4 khách thuê)
├── contracts (3 hợp đồng)
├── services (5 dịch vụ)
├── invoices (3 hóa đơn)
├── accounts (3 tài khoản)
├── financial_categories (6 danh mục)
├── assets (4 tài sản)
├── images (3 hình ảnh)
├── vehicles (3 phương tiện)
├── tasks (3 công việc)
├── meter_readings (3 bản ghi)
├── notifications (3 thông báo)
├── permissions (5 quyền)
├── roles (4 vai trò)
├── settings (1 bản ghi)
└── transactions (5 giao dịch)
```

## 👥 Thông tin đăng nhập mẫu

File đã tạo 4 tài khoản để test:

### 1. Admin (Quản trị viên)
- **Username:** `admin`
- **Password:** `password`
- **Email:** admin@nhatro.vn
- **Role:** admin

### 2. Manager (Quản lý)
- **Username:** `manager1`
- **Password:** `password`
- **Email:** manager1@nhatro.vn
- **Role:** manager

### 3. Accountant (Kế toán)
- **Username:** `accountant1`
- **Password:** `password`
- **Email:** accountant1@nhatro.vn
- **Role:** accountant

### 4. Staff (Nhân viên)
- **Username:** `staff1`
- **Password:** `password`
- **Email:** staff1@nhatro.vn
- **Role:** user

**Lưu ý:** Mật khẩu đã được hash bằng bcrypt với salt rounds = 10. Hash trong file JSON là của password `"password"`.

## 🔧 Bước 5: Cấu hình Firebase trong ứng dụng

### 5.1. Lấy Firebase Config

1. Vào Firebase Console > Project Settings
2. Scroll xuống phần "Your apps"
3. Click biểu tượng web (</>) để tạo web app (nếu chưa có)
4. Copy Firebase config

### 5.2. Cài đặt Firebase SDK

```bash
cd client
npm install firebase
```

### 5.3. Tạo file Firebase config

Tạo file `client/src/services/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
```

### 5.4. Tạo Firebase API Wrapper

Tạo file `client/src/services/firebaseApi.js` để thay thế SQLite API:

```javascript
import { database } from './firebase';
import { ref, get, set, push, remove, query, orderByChild, equalTo } from 'firebase/database';

const firebaseApi = {
  async get(path) {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array if needed
      if (typeof data === 'object' && !Array.isArray(data)) {
        return { data: Object.values(data) };
      }
      return { data };
    }
    return { data: [] };
  },

  async post(path, payload) {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, payload);
    return { data: { id: newRef.key, ...payload } };
  },

  async put(path, payload) {
    const dbRef = ref(database, path);
    await set(dbRef, payload);
    return { data: payload };
  },

  async delete(path) {
    const dbRef = ref(database, path);
    await remove(dbRef);
    return { data: { message: 'Deleted successfully' } };
  }
};

export default firebaseApi;
```

### 5.5. Cập nhật file api.js

Sửa file `client/src/services/api.js`:

```javascript
import axios from 'axios';
import firebaseApi from './firebaseApi';

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

// Giữ nguyên axios instance để fallback
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... interceptors ...

const api = USE_FIREBASE ? firebaseApi : axiosInstance;

export default api;
```

### 5.6. Cập nhật .env

Thêm vào file `client/.env`:

```
VITE_USE_FIREBASE=true
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📊 Cấu trúc dữ liệu mẫu

Database chứa:
- **4 users** (admin, manager, accountant, staff)
- **3 branches** (Cầu Giấy, Đống Đa, Thanh Xuân)
- **6 rooms** (P101, P102, P201 ở các chi nhánh)
- **4 tenants** (khách thuê, có cả owner và cotenant)
- **3 contracts** (hợp đồng đang active)
- **5 services** (điện, nước, internet, vệ sinh, gửi xe)
- **3 invoices** (1 paid, 1 pending, 1 partial)
- **3 accounts** (2 bank, 1 cash)
- **6 financial_categories** (3 thu, 3 chi)
- **4 assets** (điều hòa, giường, tủ, máy giặt)
- **3 images** (ảnh phòng và chi nhánh)
- **3 vehicles** (2 xe máy, 1 xe đạp)
- **3 tasks** (in_progress, pending, completed)
- **3 meter_readings** (ghi số điện nước)
- **3 notifications** (welcome, invoice, task)
- **4 roles** (admin, manager, accountant, user)
- **5 permissions** (dashboard view, branches view/create/update/delete)
- **5 transactions** (thu chi mẫu)
- **1 settings** (thông tin công ty)

## 🎯 Lưu ý quan trọng

### 1. Khác biệt giữa SQL và Firebase:

- **SQL:** Dữ liệu trong các bảng riêng biệt, có foreign key
- **Firebase:** Dữ liệu dạng JSON lồng nhau, không có foreign key tự động

### 2. Cần điều chỉnh queries:

```javascript
// SQL style (old)
const response = await api.get('/tenants?search=Nguyen');

// Firebase style (new)
const tenantsRef = ref(database, 'tenants');
const q = query(tenantsRef, orderByChild('full_name'), equalTo('Nguyễn Văn An'));
const snapshot = await get(q);
```

### 3. Indexes cho Firebase:

Thêm vào Rules để tăng tốc query:

```json
{
  "rules": {
    "contracts": {
      ".indexOn": ["room_id", "tenant_id", "status", "branch_id"]
    },
    "invoices": {
      ".indexOn": ["contract_id", "status", "period_year", "period_month"]
    },
    "rooms": {
      ".indexOn": ["branch_id", "status"]
    },
    "tasks": {
      ".indexOn": ["assigned_to", "status", "branch_id"]
    },
    "notifications": {
      ".indexOn": ["type", "created_at"]
    }
  }
}
```

## 🚀 Kiểm tra hoạt động

Sau khi import và cấu hình xong:

1. Chạy app: `npm run dev`
2. Đăng nhập bằng tài khoản admin
3. Kiểm tra các module:
   - ✅ Dashboard hiển thị thống kê
   - ✅ Branches hiển thị 3 chi nhánh
   - ✅ Rooms hiển thị 6 phòng
   - ✅ Tenants hiển thị 4 khách thuê
   - ✅ Contracts hiển thị 3 hợp đồng
   - ✅ Invoices hiển thị 3 hóa đơn
   - ✅ Transactions hiển thị 5 giao dịch

## 💡 Tips

1. **Backup trước khi import:** Export database hiện tại ra JSON để backup
2. **Test trên Firebase test project trước:** Tạo project test để thử nghiệm
3. **Monitor usage:** Firebase có giới hạn free tier, theo dõi usage tại Console
4. **Optimize reads:** Sử dụng `.once()` thay vì `.on()` khi chỉ cần đọc 1 lần
5. **Cache ở client:** Lưu dữ liệu không thường xuyên thay đổi vào localStorage

## 🆘 Troubleshooting

### Lỗi: "Permission denied"
→ Kiểm tra lại Rules, đảm bảo đã cấu hình đúng

### Lỗi: "Network error"
→ Kiểm tra Database URL có đúng region không (asia-southeast1)

### Lỗi: "Auth required"
→ Đảm bảo user đã login và có auth token

### Dữ liệu không hiển thị
→ Kiểm tra console.log để xem response từ Firebase
→ Đảm bảo đã convert object sang array đúng cách

## 📚 Tài liệu tham khảo

- Firebase Realtime Database: https://firebase.google.com/docs/database
- Firebase Security Rules: https://firebase.google.com/docs/database/security
- Firebase CLI: https://firebase.google.com/docs/cli

---

**Tác giả:** AI Assistant  
**Ngày tạo:** 7/11/2025  
**Version:** 1.0

