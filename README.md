# Hệ thống Quản lý Nhà trọ

Hệ thống quản lý nhà trọ chuyên nghiệp với 10 chi nhánh và 200 phòng trọ, hỗ trợ cả máy tính và điện thoại.

## Tính năng

- ✅ Quản lý chi nhánh (10 chi nhánh)
- ✅ Quản lý phòng trọ (200 phòng)
- ✅ Quản lý khách thuê
- ✅ Quản lý hợp đồng
- ✅ Quản lý thanh toán
- ✅ Dashboard thống kê
- ✅ Responsive design (mobile & desktop)
- ✅ Authentication & Authorization

## Công nghệ sử dụng

### Backend
- Node.js + Express
- SQLite Database
- JWT Authentication
- RESTful API

### Frontend
- React + Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React Icons

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
cd client
npm install
cd ..
```

### 2. Khởi tạo database và seed dữ liệu

```bash
npm run seed
```

Hoặc:
```bash
node server/scripts/seed.js
```

### 3. Chạy ứng dụng

**Cách 1: Chạy cả backend và frontend cùng lúc (khuyến nghị):**
```bash
npm run dev
```

**Cách 2: Chạy riêng từng service:**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

**Cách 3: Sử dụng script tự động:**
```bash
./start.sh
```

Sau khi chạy, bạn sẽ thấy:
- Backend API: http://localhost:5000
- Frontend: http://localhost:5173

## Đăng nhập

- **Username:** `admin`
- **Password:** `admin`

## Khắc phục sự cố

### Lỗi "Cannot connect to database"
- Kiểm tra xem database đã được tạo chưa: `ls server/database/nhatro.db`
- Nếu chưa có, chạy lại: `npm run seed`

### Lỗi "Port already in use"
- Backend mặc định dùng port 5000. Nếu port này đã được dùng, thay đổi trong file `.env` hoặc `server/index.js`
- Frontend mặc định dùng port 5173. Nếu port này đã được dùng, Vite sẽ tự động chọn port khác

### Lỗi CORS hoặc API không kết nối được
- Đảm bảo cả backend và frontend đều đang chạy
- Kiểm tra file `client/vite.config.js` có cấu hình proxy đúng không
- Nếu vẫn lỗi, thử dùng `http://localhost:5000/api` trực tiếp trong `client/src/services/api.js`

### Lỗi khi build
- Đảm bảo đã cài đặt đầy đủ dependencies: `npm install` và `cd client && npm install`

## Cấu trúc dự án

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context
│   │   ├── services/      # API services
│   │   └── App.jsx
│   └── package.json
├── server/                 # Express backend
│   ├── database/           # Database setup
│   ├── routes/             # API routes
│   ├── middleware/         # Middleware
│   ├── scripts/            # Seed scripts
│   └── index.js
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập

### Branches
- `GET /api/branches` - Lấy danh sách chi nhánh
- `POST /api/branches` - Tạo chi nhánh
- `PUT /api/branches/:id` - Cập nhật chi nhánh
- `DELETE /api/branches/:id` - Xóa chi nhánh

### Rooms
- `GET /api/rooms` - Lấy danh sách phòng
- `POST /api/rooms` - Tạo phòng
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng

### Tenants
- `GET /api/tenants` - Lấy danh sách khách thuê
- `POST /api/tenants` - Tạo khách thuê
- `PUT /api/tenants/:id` - Cập nhật khách thuê
- `DELETE /api/tenants/:id` - Xóa khách thuê

### Contracts
- `GET /api/contracts` - Lấy danh sách hợp đồng
- `POST /api/contracts` - Tạo hợp đồng
- `PUT /api/contracts/:id` - Cập nhật hợp đồng
- `DELETE /api/contracts/:id` - Xóa hợp đồng

### Payments
- `GET /api/payments` - Lấy danh sách thanh toán
- `POST /api/payments` - Tạo thanh toán
- `PUT /api/payments/:id` - Cập nhật thanh toán
- `DELETE /api/payments/:id` - Xóa thanh toán

### Dashboard
- `GET /api/dashboard/stats` - Thống kê tổng quan
- `GET /api/dashboard/recent` - Hoạt động gần đây

## Production Build

```bash
cd client
npm run build
```

Build sẽ được tạo trong thư mục `client/dist`. Backend sẽ tự động serve static files trong production mode.

## License

MIT

