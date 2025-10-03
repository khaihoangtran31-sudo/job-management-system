const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5001;

// Utility functions for network detection
const getNetworkInterfaces = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
          type: iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.') ? 'LAN' : 'PUBLIC'
        });
      }
    }
  }
  
  return addresses;
};

const getPublicIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('⚠️ Không thể lấy IP công khai:', error.message);
    return null;
  }
};

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Cho phép tất cả origins trong development
    if (!origin) return callback(null, true);
    
    // Cho phép localhost và các IP trong mạng LAN
    const allowedOrigins = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
      /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,
      /^https?:\/\/.*\.vercel\.app$/,
      /^https?:\/\/.*\.netlify\.app$/,
      /^https?:\/\/.*\.github\.io$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Vẫn cho phép để test
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Tăng giới hạn kích thước request body lên 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Hỗ trợ form data lớn

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const KPI_EVALUATIONS_FILE = path.join(DATA_DIR, 'kpi_evaluations.json');

// Tạo thư mục data nếu chưa có
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Khởi tạo dữ liệu mặc định
const initializeData = () => {
  // Users mặc định
  const defaultUsers = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      
      fullName: 'Quản trị viên',
      department: 'Quản lý',
      role: 'admin',
      position: 'Quản lý'
    }
  ];

  // Jobs mặc định
  const defaultJobs = [];

  // KPI Evaluations mặc định
  const defaultKpiEvaluations = [];

  // Lưu users
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    console.log('✅ Đã khởi tạo users mặc định');
  }

  // Lưu jobs
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(defaultJobs, null, 2));
    console.log('✅ Đã khởi tạo jobs mặc định');
  }

  // Lưu KPI evaluations
  if (!fs.existsSync(KPI_EVALUATIONS_FILE)) {
    fs.writeFileSync(KPI_EVALUATIONS_FILE, JSON.stringify(defaultKpiEvaluations, null, 2));
    console.log('✅ Đã khởi tạo KPI evaluations mặc định');
  }
};

// Utility functions
const readData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Lỗi đọc file ${filePath}:`, error);
    return null;
  }
};

const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Lỗi ghi file ${filePath}:`, error);
    return false;
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server đang hoạt động',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Network info endpoint
app.get('/api/network-info', async (req, res) => {
  try {
    const networkInterfaces = getNetworkInterfaces();
    const publicIP = await getPublicIP();
    
    res.json({
      success: true,
      data: {
        networkInterfaces,
        publicIP,
        serverIP: req.connection.localAddress,
        clientIP: req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin mạng'
    });
  }
});

// Lấy danh sách users
app.get('/api/users', (req, res) => {
  try {
    const users = readData(USERS_FILE) || [];
    res.json({
      success: true,
      data: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách users'
    });
  }
});

// Lấy danh sách jobs
app.get('/api/jobs', (req, res) => {
  try {
    const jobs = readData(JOBS_FILE) || [];
    res.json({
      success: true,
      data: jobs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách jobs'
    });
  }
});

// Cập nhật users
app.post('/api/users', (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu users không hợp lệ'
      });
    }

    const success = writeData(USERS_FILE, users);
    if (success) {
      console.log(`✅ Đã cập nhật ${users.length} users`);
      res.json({
        success: true,
        message: 'Đã cập nhật users thành công',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lưu users'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật users'
    });
  }
});

// Cập nhật jobs
app.post('/api/jobs', (req, res) => {
  try {
    const { jobs } = req.body;
    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu jobs không hợp lệ'
      });
    }

    const success = writeData(JOBS_FILE, jobs);
    if (success) {
      console.log(`✅ Đã cập nhật ${jobs.length} jobs`);
      res.json({
        success: true,
        message: 'Đã cập nhật jobs thành công',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lưu jobs'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật jobs'
    });
  }
});

// Đăng nhập
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập username và password'
      });
    }

    const users = readData(USERS_FILE) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Không trả về password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword,
        message: 'Đăng nhập thành công'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi đăng nhập'
    });
  }
});

// KPI Evaluations API
app.get('/api/kpi-evaluations', (req, res) => {
  try {
    const evaluations = readData(KPI_EVALUATIONS_FILE) || [];
    res.json({
      success: true,
      data: evaluations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading KPI evaluations:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách KPI evaluations'
    });
  }
});

app.post('/api/kpi-evaluations', (req, res) => {
  try {
    const { evaluations } = req.body;
    if (!Array.isArray(evaluations)) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu evaluations phải là một mảng'
      });
    }
    
    writeData(KPI_EVALUATIONS_FILE, evaluations);
    res.json({
      success: true,
      message: 'KPI evaluations đã được lưu thành công',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving KPI evaluations:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lưu KPI evaluations'
    });
  }
});

// Xóa đánh giá KPI
app.delete('/api/kpi-evaluations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const evaluations = readData(KPI_EVALUATIONS_FILE) || [];
    
    const evaluationIndex = evaluations.findIndex(eval => eval.id == id);
    if (evaluationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đánh giá cần xóa'
      });
    }
    
    // Xóa đánh giá
    const deletedEvaluation = evaluations.splice(evaluationIndex, 1)[0];
    writeData(KPI_EVALUATIONS_FILE, evaluations);
    
    res.json({
      success: true,
      message: 'Đánh giá đã được xóa thành công',
      deletedEvaluation: deletedEvaluation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting KPI evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa đánh giá KPI'
    });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Fallback cho React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Khởi tạo dữ liệu
initializeData();

// Khởi động server
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log('='.repeat(60));
  console.log('🚀 HỆ THỐNG QUẢN LÝ CÔNG VIỆC - PHIÊN BẢN 2.0');
  console.log('='.repeat(60));
  
  // Lấy thông tin mạng
  const networkInterfaces = getNetworkInterfaces();
  const publicIP = await getPublicIP();
  
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  
  // Hiển thị các IP LAN
  const lanIPs = networkInterfaces.filter(iface => iface.type === 'LAN');
  if (lanIPs.length > 0) {
    console.log('🌐 LAN Access:');
    lanIPs.forEach(iface => {
      console.log(`   http://${iface.address}:${PORT} (${iface.interface})`);
    });
  }
  
  // Hiển thị IP công khai nếu có
  if (publicIP) {
    console.log(`🌐 Public Access: http://${publicIP}:${PORT}`);
    console.log('⚠️  Lưu ý: Để truy cập từ bên ngoài, cần cấu hình port forwarding trên router');
  }
  
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  /api/users - Lấy danh sách users`);
  console.log(`   POST /api/users - Cập nhật users`);
  console.log(`   GET  /api/jobs - Lấy danh sách jobs`);
  console.log(`   POST /api/jobs - Cập nhật jobs`);
  console.log(`   POST /api/login - Đăng nhập`);
  console.log(`   GET  /api/kpi-evaluations - Lấy danh sách đánh giá KPI`);
  console.log(`   POST /api/kpi-evaluations - Lưu đánh giá KPI`);
  console.log(`   DELETE /api/kpi-evaluations/:id - Xóa đánh giá KPI`);
  console.log(`   GET  /api/health - Kiểm tra server`);
  console.log(`   GET  /api/network-info - Thông tin mạng`);
  console.log('='.repeat(60));
  console.log('🔄 Server đang chạy 24/7 - Tự động khởi động lại khi lỗi');
  console.log('='.repeat(60));
});

// Xử lý lỗi và tự động khởi động lại
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('🔄 Đang khởi động lại server...');
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Đang khởi động lại server...');
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Export for Vercel
module.exports = app;

