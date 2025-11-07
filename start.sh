#!/bin/bash

echo "🚀 Đang khởi động hệ thống quản lý nhà trọ..."

# Kiểm tra xem database đã có dữ liệu chưa
if [ ! -f "server/database/nhatro.db" ]; then
    echo "📦 Đang tạo database và seed dữ liệu..."
    npm run seed
fi

echo "🔧 Đang khởi động backend và frontend..."
npm run dev

