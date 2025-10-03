# 🚀 HỆ THỐNG QUẢN LÝ CÔNG VIỆC 2.0

## 📋 Tổng quan
Hệ thống quản lý công việc và đánh giá KPI cho nhân viên với giao diện web hiện đại.

## 🎯 Cách sử dụng

### 🚀 Khởi động hệ thống
**Chỉ cần chạy 1 file duy nhất**: `HỆ_THỐNG.bat`

### 🎛️ Tính năng
1. **Tự động khởi động**: Sau 3 giây sẽ tự động khởi động toàn bộ hệ thống
2. **Menu quản lý**: Nhấn phím bất kỳ trong 3 giây để vào menu quản lý
3. **15 tùy chọn quản lý**:
   - 🚀 Khởi động toàn bộ hệ thống
   - 🔧 Khởi động chỉ Backend
   - 🎨 Khởi động chỉ Frontend
   - ⏹️ Dừng tất cả
   - 📊 Kiểm tra trạng thái
   - 🔄 Khởi động lại hệ thống
   - 🌐 Mở trình duyệt
   - 📋 Xem thông tin hệ thống
   - 🛠️ Cài đặt Windows Service
   - 🔄 Chạy 24/7 (Full System)
   - 🎨 Chạy Frontend 24/7
   - 🔧 Chạy Backend 24/7
   - 🛑 Dừng Windows Service
   - 🚀 Khởi động Windows Service

### 🔐 Đăng nhập
- **URL**: http://localhost:5000
- **Admin**: admin / admin123

## 📊 Dữ liệu
- **Users**: `data/users.json` (30 nhân viên)
- **KPI Evaluations**: `data/kpi_evaluations.json` (20 đánh giá)
- **Jobs**: `data/jobs.json`

## 🌐 Truy cập
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5001
- **Đăng nhập**: admin / admin123

## 📁 Cấu trúc thư mục (Đã tối ưu tối đa)
```
Qly_CV/
├── HỆ_THỐNG.bat                # FILE DUY NHẤT - Quản lý toàn bộ
├── data/                       # Dữ liệu
│   ├── users.json
│   ├── kpi_evaluations.json
│   └── jobs.json
├── src/                        # Mã nguồn React
├── server.js                   # Backend Node.js
├── package.json               # Cấu hình Node.js
└── HƯỚNG_DẪN_SỬ_DỤNG.md      # Hướng dẫn
```

## ⚡ Hướng dẫn sử dụng

### 🚀 Khởi động nhanh
1. **Double-click** `HỆ_THỐNG.bat`
2. **Đợi 3 giây** - Hệ thống tự động khởi động
3. **Hoặc nhấn phím bất kỳ** để vào menu quản lý

### 🎛️ Quản lý hệ thống
- **Chọn 1**: Khởi động toàn bộ (Backend + Frontend + Mở trình duyệt)
- **Chọn 2**: Chỉ khởi động Backend
- **Chọn 3**: Chỉ khởi động Frontend
- **Chọn 4**: Dừng tất cả dịch vụ
- **Chọn 5**: Kiểm tra trạng thái hệ thống
- **Chọn 6**: Khởi động lại hệ thống
- **Chọn 7**: Mở trình duyệt
- **Chọn 8**: Xem thông tin hệ thống
- **Chọn 9**: Cài đặt Windows Service
- **Chọn A**: Chạy 24/7 (Full System)
- **Chọn B**: Chạy Frontend 24/7
- **Chọn C**: Chạy Backend 24/7
- **Chọn D**: Dừng Windows Service
- **Chọn E**: Khởi động Windows Service
- **Chọn 0**: Thoát

## 🎉 Lợi ích
- ✅ **Cực kỳ đơn giản**: Chỉ 1 file duy nhất
- ✅ **Tự động**: Khởi động tự động sau 3 giây
- ✅ **Linh hoạt**: 15 tùy chọn quản lý đầy đủ
- ✅ **Siêu gọn gàng**: Từ 17 files → 1 file chính
- ✅ **Dễ sử dụng**: Chỉ cần double-click
- ✅ **Tích hợp hoàn chỉnh**: Tất cả chức năng trong 1 file