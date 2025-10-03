# 🚀 Hệ Thống Quản Lý Công Việc 2.0

## 📋 Tổng quan
Hệ thống quản lý công việc và đánh giá KPI cho nhân viên với giao diện web hiện đại, được xây dựng bằng React.js và Node.js.

## ✨ Tính năng chính

### 🎯 Quản lý công việc
- ✅ Tạo, chỉnh sửa, xóa công việc
- ✅ Phân công công việc cho nhân viên
- ✅ Theo dõi tiến độ và trạng thái
- ✅ Lọc và tìm kiếm công việc

### 📊 Đánh giá KPI
- ✅ Đánh giá hiệu suất, kỷ luật, thái độ
- ✅ Quản lý ngày đánh giá linh hoạt
- ✅ Báo cáo thống kê chi tiết
- ✅ Lịch sử đánh giá đầy đủ

### 👥 Quản lý người dùng
- ✅ Quản lý nhân viên và phân quyền
- ✅ Phân quyền theo vai trò (Admin, Quản lý, Tổ trưởng, Tổ phó, Nhân viên)
- ✅ Quản lý bộ phận và chức vụ

### 📈 Dashboard & Báo cáo
- ✅ Dashboard tổng quan với biểu đồ
- ✅ Thống kê theo bộ phận và thời gian
- ✅ Báo cáo hiệu suất nhân viên
- ✅ Xuất dữ liệu và báo cáo

## 🛠️ Công nghệ sử dụng

### Frontend
- **React.js 18.2.0** - UI Framework
- **CSS3** - Styling với responsive design
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.18.2** - Web framework
- **CORS** - Cross-origin resource sharing

### Data Storage
- **JSON Files** - Local data storage
- **File System** - Data persistence

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 14.0.0
- npm >= 6.0.0

### Cài đặt
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/job-management-system.git
cd job-management-system

# Cài đặt dependencies
npm install

# Khởi động hệ thống
npm run start
```

### Chạy hệ thống
```bash
# Chạy Backend (Port 5001)
npm run server

# Chạy Frontend (Port 5000)
npm start
```

## 📁 Cấu trúc dự án

```
job-management-system/
├── src/                    # Mã nguồn React
│   ├── App.js             # Component chính
│   ├── App.css            # Styles
│   └── index.js           # Entry point
├── public/                # Static files
├── data/                  # Dữ liệu JSON
│   ├── users.json         # Danh sách người dùng
│   ├── kpi_evaluations.json # Đánh giá KPI
│   └── jobs.json          # Công việc
├── server.js              # Backend API
├── package.json          # Dependencies
└── README.md             # Tài liệu
```

## 🔐 Đăng nhập mặc định

### Admin
- **Username**: admin
- **Password**: admin123

### Quyền truy cập
- **Admin**: Toàn quyền quản lý hệ thống
- **Quản lý**: Quản lý bộ phận và đánh giá KPI
- **Tổ trưởng**: Quản lý nhóm và đánh giá KPI
- **Tổ phó**: Đánh giá KPI nhân viên
- **Nhân viên**: Xem công việc được phân công

## 🌐 API Endpoints

### Authentication
- `POST /api/login` - Đăng nhập
- `POST /api/logout` - Đăng xuất

### Users
- `GET /api/users` - Lấy danh sách người dùng
- `POST /api/users` - Tạo người dùng mới
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### Jobs
- `GET /api/jobs` - Lấy danh sách công việc
- `POST /api/jobs` - Tạo công việc mới
- `PUT /api/jobs/:id` - Cập nhật công việc
- `DELETE /api/jobs/:id` - Xóa công việc

### KPI Evaluations
- `GET /api/kpi-evaluations` - Lấy đánh giá KPI
- `POST /api/kpi-evaluations` - Tạo đánh giá mới
- `DELETE /api/kpi-evaluations/:id` - Xóa đánh giá

## 📱 Responsive Design

Hệ thống được thiết kế responsive, tương thích với:
- 💻 Desktop (1920x1080+)
- 📱 Tablet (768px - 1024px)
- 📱 Mobile (320px - 767px)

## 🔧 Cấu hình

### Environment Variables
```bash
# Backend Port (mặc định: 5001)
PORT=5001

# Frontend Port (mặc định: 5000)
REACT_APP_PORT=5000
```

### Cấu hình mạng
Hệ thống tự động phát hiện IP và cấu hình CORS cho:
- Localhost development
- LAN access
- Public access (với port forwarding)

## 📊 Tính năng nâng cao

### Dashboard Analytics
- 📈 Biểu đồ thống kê theo bộ phận
- 📊 Phân tích hiệu suất nhân viên
- 📅 Báo cáo theo thời gian
- 🎯 KPI tracking và trends

### Quản lý dữ liệu
- 💾 Auto-save và backup
- 🔄 Real-time updates
- 📤 Export dữ liệu
- 🔍 Advanced filtering

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Project Link**: [https://github.com/YOUR_USERNAME/job-management-system](https://github.com/YOUR_USERNAME/job-management-system)
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/job-management-system/issues)

## 🙏 Acknowledgments

- React.js Community
- Express.js Team
- Open Source Contributors
