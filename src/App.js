import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

// API Client - Tự động detect IP máy chủ với fallback
const getApiBase = () => {
  // Nếu đang chạy trên localhost, sử dụng localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  // Nếu truy cập từ IP khác, sử dụng IP đó
  const apiUrl = `http://${window.location.hostname}:5001`;
  console.log('🔍 API Base URL:', apiUrl);
  return apiUrl;
};

// Danh sách các URL để thử kết nối
const getApiUrls = () => {
  const hostname = window.location.hostname;
  const urls = [];
  
  // Nếu đang trên localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    urls.push('http://localhost:5001');
    urls.push('http://127.0.0.1:5001');
  } else {
    // Nếu đang trên IP khác, thử IP đó trước
    urls.push(`http://${hostname}:5001`);
    urls.push('http://localhost:5001');
    urls.push('http://127.0.0.1:5001');
  }
  
  return urls;
};

const API_BASE = getApiBase();

const apiClient = {
  async request(endpoint, options = {}) {
    const urlsToTry = getApiUrls();
    
    for (const baseUrl of urlsToTry) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        };

        console.log(`🔍 Thử kết nối đến: ${url}`);
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        // Nếu thành công, cập nhật API_BASE cho các request tiếp theo
        if (baseUrl !== API_BASE) {
          window.API_BASE = baseUrl;
          console.log(`✅ Đã cập nhật API_BASE thành: ${baseUrl}`);
        }

        return data;
      } catch (error) {
        console.log(`❌ Không thể kết nối đến ${baseUrl}:`, error.message);
        // Tiếp tục thử URL tiếp theo
        continue;
      }
    }
    
    // Nếu tất cả URL đều thất bại
    throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
  },

  async login(username, password) {
    try {
      const response = await this.request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      return response;
    } catch (error) {
      return { success: false, error: 'Không thể kết nối server' };
    }
  },

  async getUsers() {
    try {
      const response = await this.request('/api/users');
      return response.data || [];
    } catch (error) {
      console.error('❌ Lỗi khi lấy users:', error);
    return [];
    }
  },

  async updateUsers(users) {
    try {
      const response = await this.request('/api/users', {
        method: 'POST',
        body: JSON.stringify({ users })
      });
      return response.success;
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật users:', error);
        return false;
      }
  },

  async getJobs() {
    try {
      const response = await this.request('/api/jobs');
      return response.data || [];
    } catch (error) {
      console.error('❌ Lỗi khi lấy jobs:', error);
    return [];
    }
  },

  async updateJobs(jobs) {
    try {
      const response = await this.request('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ jobs })
      });
      return response.success;
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật jobs:', error);
        return false;
      }
      }
};

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Network detection state
  const [networkInfo, setNetworkInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  
  // Data state
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Network detection functions
  const checkNetworkConnection = useCallback(async () => {
    try {
      setConnectionStatus('checking');
      const urlsToTry = getApiUrls();
      
      for (const url of urlsToTry) {
        try {
          console.log(`🔍 Đang thử kết nối đến: ${url}`);
          const response = await fetch(`${url}/api/health`, {
            method: 'GET',
            timeout: 5000
          });
          
          if (response.ok) {
            const data = await response.json();
            setConnectionStatus('connected');
            setNetworkInfo({
              serverUrl: url,
              status: 'connected',
              timestamp: new Date().toISOString()
            });
            
            // Cập nhật API_BASE
            window.API_BASE = url;
            console.log(`✅ Kết nối thành công đến: ${url}`);
            return;
          }
        } catch (error) {
          console.log(`❌ Không thể kết nối đến ${url}:`, error.message);
          continue;
        }
      }
      
      // Nếu tất cả đều thất bại
      setConnectionStatus('disconnected');
      setNetworkInfo({
        serverUrl: null,
        status: 'disconnected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Lỗi kiểm tra kết nối:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Authentication functions
  const handleLogin = async (username, password) => {
    try {
      setLoginError('');
      const response = await apiClient.login(username, password);
      if (response.success) {
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        console.log('✅ Đăng nhập thành công:', response.user.fullName);
      } else {
        setLoginError(response.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('❌ Lỗi đăng nhập:', error);
      setLoginError('Không thể kết nối server. Vui lòng thử lại.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoginError('');
    localStorage.removeItem('currentUser');
  };

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const usersData = await apiClient.getUsers();
      if (Array.isArray(usersData)) {
        setUsers(usersData);
        console.log('✅ Đã tải users:', usersData.length, 'users');
      } else {
        setUsers([]);
      }
      } catch (error) {
        console.error('❌ Lỗi khi tải users:', error);
      setUsers([]);
    }
  }, []);

  // Kiểm tra kết nối khi component mount
  useEffect(() => {
    checkNetworkConnection();
  }, [checkNetworkConnection]);

  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      const jobsData = await apiClient.getJobs();
      if (Array.isArray(jobsData)) {
        setJobs(jobsData);
        console.log('✅ Đã tải jobs:', jobsData.length, 'jobs');
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải jobs:', error);
      setJobs([]);
    }
  }, []);

  // Update users
  const handleUpdateUsers = async (updatedUsers) => {
    try {
      setUsers(updatedUsers);
      await apiClient.updateUsers(updatedUsers);
      console.log('✅ Đã cập nhật users');
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật users:', error);
    }
  };

  // Update jobs
  const handleUpdateJobs = async (updatedJobs) => {
    try {
    setJobs(updatedJobs);
      await apiClient.updateJobs(updatedJobs);
      console.log('✅ Đã cập nhật jobs');
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật jobs:', error);
    }
  };

  // Check authentication on load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('✅ Đã khôi phục phiên đăng nhập:', user.fullName);
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Kiểm tra quyền truy cập tab khi user thay đổi
  useEffect(() => {
    if (currentUser) {
      // Nếu user không có quyền truy cập tab hiện tại, chuyển về tab mặc định
      const hasAccessToCurrentTab = () => {
        switch (activeTab) {
          case 'dashboard':
          case 'salary':
            return currentUser.role === 'admin' || currentUser.position === 'Tổ trưởng';
          case 'users':
            return currentUser.role === 'admin';
          case 'list':
          default:
            return true; // Tất cả user đều có quyền truy cập tab công việc
        }
      };

      if (!hasAccessToCurrentTab()) {
        setActiveTab('list');
      }
    }
  }, [currentUser, activeTab]);

  // Test server connection with fallback
  const testServerConnection = useCallback(async () => {
    const urlsToTry = [
      API_BASE,
      'http://localhost:5001',
      `http://${window.location.hostname}:5001`
    ];
    
    for (const url of urlsToTry) {
      try {
        console.log(`🔍 Đang thử kết nối đến: ${url}`);
        const response = await fetch(`${url}/api/health`, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Server đang hoạt động:', data);
          // Update API_BASE to working URL
          if (url !== API_BASE) {
            console.log(`🔄 Cập nhật API_BASE từ ${API_BASE} thành ${url}`);
            window.API_BASE = url;
          }
          return true;
        }
      } catch (error) {
        console.log(`❌ Không thể kết nối đến ${url}:`, error.message);
        continue;
      }
    }
    
    console.error('❌ Không thể kết nối đến server từ bất kỳ URL nào');
    return false;
  }, []);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
      loadJobs();
      // Test server connection on mount
      testServerConnection();
    }
  }, [isAuthenticated, testServerConnection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isAuthenticated) return;
      
      // Ctrl/Cmd + N: Thêm công việc mới
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (currentUser?.role === 'admin' || currentUser?.position === 'Tổ trưởng') {
          setIsAdding(true);
        }
      }
      
      // Ctrl/Cmd + F: Focus vào ô tìm kiếm
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.filter-input');
        if (searchInput) searchInput.focus();
      }
      
      // Escape: Đóng form thêm/sửa
      if (e.key === 'Escape') {
        setIsAdding(false);
        setEditingUser(null);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isAuthenticated, currentUser]);

  // Tự động kiểm tra và cập nhật trạng thái công việc trễ hạn
  useEffect(() => {
    if (isAuthenticated && jobs.length > 0) {
      checkAndUpdateOverdueJobs();
    }
  }, [isAuthenticated, jobs]);

  // Kiểm tra deadline và hiển thị thông báo nhắc nhở
  const getUpcomingDeadlines = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    return jobs.filter(job => {
      if (!job.completionTime || job.status === 'thành công') return false;
      
      // Lọc theo bộ phận của người dùng hiện tại
      if (currentUser?.role !== 'admin' && job.department !== currentUser?.department) {
        return false;
      }
      
      const completionDate = new Date(job.completionTime);
      const timeDiff = completionDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Nhắc nhở trước 1 ngày (0-1 ngày)
      return daysDiff >= 0 && daysDiff <= 1;
    });
  };

  // Hàm kiểm tra và cập nhật trạng thái công việc trễ hạn
  const checkAndUpdateOverdueJobs = () => {
    const today = new Date();
    const overdueJobs = [];
    
    const updatedJobs = jobs.map(job => {
      // Chỉ cập nhật nếu công việc chưa hoàn thành và có ngày hoàn thành
      if (job.status !== 'thành công' && job.status !== 'thất bại' && job.completionTime) {
        const completionDate = new Date(job.completionTime);
        const timeDiff = completionDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Nếu trễ hạn (ngày hoàn thành đã qua)
        if (daysDiff < 0) {
          overdueJobs.push(job);
          return { ...job, status: 'thất bại' };
        }
      }
      return job;
    });
    
    // Cập nhật danh sách công việc nếu có thay đổi
    const hasChanges = updatedJobs.some((job, index) => job.status !== jobs[index].status);
    if (hasChanges) {
      handleUpdateJobs(updatedJobs);
      
      // Hiển thị thông báo về các công việc trễ hạn
      if (overdueJobs.length > 0) {
        const overdueList = overdueJobs.map(job => `• ${job.description} (${job.department})`).join('\n');
        alert(`⚠️ CẢNH BÁO: ${overdueJobs.length} công việc đã trễ hạn và được tự động cập nhật thành "thất bại":\n\n${overdueList}`);
      }
    }
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  // Reminder Notification Component
  const ReminderNotification = ({ deadlines }) => {
    if (deadlines.length === 0) return null;

    const getReminderMessage = (job) => {
      const today = new Date();
      const completionDate = new Date(job.completionTime);
      const timeDiff = completionDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff === 0) {
        return `⚠️ Hôm nay là deadline: "${job.description}"`;
      } else if (daysDiff === 1) {
        return `⏰ Ngày mai deadline: "${job.description}"`;
      }
      return `📅 Còn ${daysDiff} ngày: "${job.description}"`;
    };

    return (
      <div className="reminder-notification">
        <div className="reminder-header">
          <h3>🔔 Nhắc nhở deadline</h3>
          <span className="reminder-count">
            {deadlines.length} công việc
            {currentUser?.role !== 'admin' && (
              <span className="department-info"> (Bộ phận: {currentUser?.department})</span>
            )}
          </span>
        </div>
        <div className="reminder-list">
          {deadlines.map(job => (
            <div key={job.id} className="reminder-item">
              <div className="reminder-message">
                {getReminderMessage(job)}
              </div>
              <div className="reminder-details">
                <span className="reminder-department">🏢 {job.department}</span>
                <span className="reminder-assignee">👤 {job.assigner || 'Chưa giao'} → {job.assignee || 'Chưa giao'}</span>
                <span className="reminder-date">📅 {new Date(job.completionTime).toLocaleDateString('vi-VN')}</span>
                <span className={`reminder-status status-${job.status}`}>
                  {job.status === 'nhận việc' ? '📋 Nhận việc' :
                   job.status === 'đang xử lý' ? '⏳ Đang xử lý' :
                   job.status === 'chờ duyệt' ? '⏸️ Chờ duyệt' :
                   job.status === 'thất bại' ? '❌ Thất bại' : '✅ Thành công'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Login Form Component
  const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (username && password) {
        handleLogin(username, password);
      } else {
        setLoginError('Vui lòng nhập đầy đủ thông tin');
      }
    };

    const getConnectionStatusIcon = () => {
      switch (connectionStatus) {
        case 'connected':
          return '🟢';
        case 'checking':
          return '🟡';
        case 'disconnected':
          return '🔴';
        default:
          return '⚪';
      }
    };

    const getConnectionStatusText = () => {
      switch (connectionStatus) {
        case 'connected':
          return `Đã kết nối đến server`;
        case 'checking':
          return 'Đang kiểm tra kết nối...';
        case 'disconnected':
          return 'Không thể kết nối đến server';
        default:
          return 'Trạng thái không xác định';
      }
    };

    return (
      <div className="login-container">
        <div className="login-form">
          <h2>🔐 Đăng nhập hệ thống</h2>
          
          {/* Network Status */}
          <div className="network-status">
            <div className="status-indicator">
              {getConnectionStatusIcon()} {getConnectionStatusText()}
            </div>
            {networkInfo && networkInfo.serverUrl && (
              <div className="server-info">
                📡 Server: {networkInfo.serverUrl}
              </div>
            )}
            {connectionStatus === 'disconnected' && (
              <div className="connection-help">
                <p>💡 Hướng dẫn kết nối:</p>
                <ul>
                  <li>Kiểm tra server đã khởi động chưa</li>
                  <li>Kiểm tra kết nối mạng</li>
                  <li>Thử truy cập từ IP khác trong mạng LAN</li>
                </ul>
                <button 
                  onClick={checkNetworkConnection}
                  className="retry-btn"
                >
                  🔄 Thử kết nối lại
                </button>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tên đăng nhập:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username"
                required
                disabled={connectionStatus === 'disconnected'}
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập password"
                required
                disabled={connectionStatus === 'disconnected'}
              />
            </div>
            
            {loginError && (
              <div className="error-message">
                ❌ {loginError}
              </div>
            )}
            <button 
              type="submit" 
              className="login-btn"
              disabled={connectionStatus === 'disconnected'}
            >
              🚀 Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Main App Component
  const MainApp = () => {
  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <div className="header-content">
            <div className="header-info">
              <h1>📋 Danh sách việc làm</h1>
              <p>Quản lý và theo dõi tiến độ công việc</p>
            </div>
            <div className="user-info">
              <div className="user-details">
                  <span className="user-name">{currentUser?.fullName}</span>
                  <span className="user-department">{currentUser?.department}</span>
                  <span className="user-position">{currentUser?.position}</span>
              </div>
            <div className="user-actions">
                  <button onClick={handleLogout} className="logout-btn">
                    🚪 Đăng xuất
                  </button>
            </div>
            </div>
          </div>
        </header>

        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
            title="Ctrl+F: Tìm kiếm, Ctrl+N: Thêm mới"
          >
            📋 Quản lý công việc
          </button>
          
          {/* Dashboard - Admin, Quản lý, Tổ trưởng */}
          {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý' || currentUser?.position === 'Tổ trưởng') && (
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard & Thống kê
            </button>
          )}
          
          {/* KPI Evaluation - Admin, Quản lý, Tổ trưởng, Tổ phó */}
          {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý' || currentUser?.position === 'Tổ trưởng' || currentUser?.position === 'Tổ phó') && (
            <button 
              className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`}
              onClick={() => setActiveTab('salary')}
            >
              📊 Đánh giá KPI nhân sự
            </button>
          )}
          
          {/* User Management - Chỉ admin */}
          {currentUser?.role === 'admin' && (
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Quản lý người dùng
            </button>
          )}
        </div>

        <div className="tab-content">
        {/* Hiển thị thông báo nhắc nhở ở đầu mọi tab */}
        <ReminderNotification deadlines={upcomingDeadlines} />
        
        {activeTab === 'list' && (
            <JobManagement 
              jobs={jobs}
              onUpdateJobs={handleUpdateJobs}
              currentUser={currentUser}
            />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            jobs={jobs}
              users={users}
            currentUser={currentUser}
          />
        )}

          {activeTab === 'salary' && (
            <KPIEvaluation 
              users={users}
              jobs={jobs}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'users' && (
            <UserManagement 
            users={users}
            onUpdateUsers={handleUpdateUsers}
            currentUser={currentUser}
          />
        )}

      </div>
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = ({ jobs, users, currentUser }) => {
    const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, quarter, year
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    
    // Auto refresh effect
    useEffect(() => {
      if (!autoRefresh) return;
      
      const interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }, [autoRefresh]);
    
    // Manual refresh function
    const handleRefresh = async () => {
      setIsRefreshing(true);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    // Filter jobs by time period
    const getFilteredJobs = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let filteredJobs = jobs;
      
      // Filter by time period
      switch (timeFilter) {
        case 'today':
          filteredJobs = jobs.filter(job => {
            if (!job.deliveryDate) return false;
            const jobDate = new Date(job.deliveryDate);
            const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
            return jobDateOnly.getTime() === today.getTime();
          });
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          filteredJobs = jobs.filter(job => {
            if (!job.deliveryDate) return false;
            const jobDate = new Date(job.deliveryDate);
            const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
            return jobDateOnly >= weekStart && jobDateOnly <= weekEnd;
          });
          break;
          
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          filteredJobs = jobs.filter(job => {
            if (!job.deliveryDate) return false;
            const jobDate = new Date(job.deliveryDate);
            const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
            return jobDateOnly >= monthStart && jobDateOnly <= monthEnd;
          });
          break;
          
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
          const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 0);
          filteredJobs = jobs.filter(job => {
            if (!job.deliveryDate) return false;
            const jobDate = new Date(job.deliveryDate);
            const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
            return jobDateOnly >= quarterStart && jobDateOnly <= quarterEnd;
          });
          break;
          
        case 'year':
          const yearStart = new Date(today.getFullYear(), 0, 1);
          const yearEnd = new Date(today.getFullYear(), 11, 31);
          filteredJobs = jobs.filter(job => {
            if (!job.deliveryDate) return false;
            const jobDate = new Date(job.deliveryDate);
            const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
            return jobDateOnly >= yearStart && jobDateOnly <= yearEnd;
          });
          break;
          
        default:
          filteredJobs = jobs;
      }
      
      // Filter by department
      if (departmentFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.department === departmentFilter);
      }
      
      return filteredJobs;
    };

    const filteredJobs = getFilteredJobs();
    
    // Debug information
    console.log('Dashboard Filter Debug:', {
      timeFilter,
      departmentFilter,
      totalJobs: jobs.length,
      filteredJobs: filteredJobs.length,
      sampleJobs: jobs.slice(0, 3).map(job => ({
        id: job.id,
        deliveryDate: job.deliveryDate,
        department: job.department,
        status: job.status
      }))
    });
    
    const stats = {
      totalJobs: filteredJobs.length,
      completedJobs: filteredJobs.filter(job => job.status === 'thành công').length,
      pendingJobs: filteredJobs.filter(job => job.status === 'nhận việc' || job.status === 'đang xử lý' || job.status === 'chờ duyệt').length,
      failedJobs: filteredJobs.filter(job => job.status === 'thất bại').length,
      totalUsers: users.length,
      activeUsers: users.filter(user => user.role !== 'inactive').length
    };

    const departmentStats = filteredJobs.reduce((acc, job) => {
      if (!acc[job.department]) {
        acc[job.department] = { 
          total: 0, 
          completed: 0, 
          pending: 0,
          failed: 0,
          inProgress: 0,
          waiting: 0,
          percentage: 0,
          avgCompletionTime: 0,
          onTimeRate: 0,
          overdue: 0
        };
      }
      
      acc[job.department].total += 1;
      
      // Count by status
      switch (job.status) {
        case 'thành công':
        acc[job.department].completed += 1;
          break;
        case 'nhận việc':
        case 'đang xử lý':
        case 'chờ duyệt':
          acc[job.department].pending += 1;
          if (job.status === 'đang xử lý') acc[job.department].inProgress += 1;
          if (job.status === 'chờ duyệt') acc[job.department].waiting += 1;
          break;
        case 'thất bại':
          acc[job.department].failed += 1;
          break;
      }
      
      // Calculate completion time and overdue
      if (job.completionTime && job.deliveryDate) {
        const deliveryDate = new Date(job.deliveryDate);
        const completionDate = new Date(job.completionTime);
        const today = new Date();
        
        if (job.status === 'thành công') {
          const completionTime = Math.ceil((completionDate - deliveryDate) / (1000 * 60 * 60 * 24));
          acc[job.department].avgCompletionTime = (acc[job.department].avgCompletionTime + completionTime) / 2;
        }
        
        // Check if overdue
        if (job.status !== 'thành công' && job.status !== 'thất bại' && completionDate < today) {
          acc[job.department].overdue += 1;
        }
      }
      
      acc[job.department].percentage = Math.round((acc[job.department].completed / acc[job.department].total) * 100);
      acc[job.department].onTimeRate = Math.round(((acc[job.department].completed - acc[job.department].overdue) / acc[job.department].completed) * 100) || 0;
      
      return acc;
    }, {});

    const statusStats = filteredJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h2>📊 Dashboard & Thống kê</h2>
              <p>Xin chào {currentUser?.fullName}, đây là tổng quan hệ thống</p>
              <div className="refresh-controls">
                <button 
                  className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                  onClick={handleRefresh}
                  title="Làm mới dữ liệu"
                >
                  {isRefreshing ? '🔄' : '🔄'} {isRefreshing ? 'Đang tải...' : 'Làm mới'}
                </button>
                <label className="auto-refresh-toggle">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  <span className="toggle-label">Tự động cập nhật (30s)</span>
                </label>
              </div>
              <div className="filter-info">
                <span className="filter-badge">
                  📅 {timeFilter === 'all' ? 'Tất cả thời gian' : 
                       timeFilter === 'week' ? 'Tuần này' :
                       timeFilter === 'month' ? 'Tháng này' :
                       timeFilter === 'quarter' ? 'Quý này' :
                       timeFilter === 'year' ? 'Năm này' : timeFilter}
                </span>
                {departmentFilter !== 'all' && (
                  <span className="filter-badge">
                    🏢 {departmentFilter}
                  </span>
                )}
                <span className="filter-badge">
                  📊 {filteredJobs.length} công việc
                </span>
              </div>
            </div>
            <div className="dashboard-filters">
              <div className="filter-group">
                <label>📅 Thời gian:</label>
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="quarter">Quý này</option>
                  <option value="year">Năm này</option>
                </select>
              </div>
              <div className="filter-group">
                <label>🏢 Bộ phận:</label>
                <select 
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tất cả bộ phận</option>
                  {Array.from(new Set(jobs.map(job => job.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="filter-actions">
                <div className="filter-info" style={{ 
                  padding: '8px 12px', 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '6px', 
                  fontSize: '0.9rem',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  📊 Hiển thị: {getFilteredJobs().length} / {jobs.length} công việc
                </div>
                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setTimeFilter('all');
                    setDepartmentFilter('all');
                  }}
                >
                  🔄 Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-grid" key={refreshKey}>
          <div className="stat-card animated">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalJobs}</h3>
              <p>Tổng công việc</p>
              <div className="stat-trend">
                <span className="trend-indicator">📊</span>
                <span className="trend-text">Tổng quan</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card success animated">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.completedJobs}</h3>
              <p>Hoàn thành</p>
              <div className="stat-trend">
                <span className="trend-indicator success">📈</span>
                <span className="trend-text">Hoàn thành tốt</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card warning animated">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.pendingJobs}</h3>
              <p>Đang xử lý</p>
              <div className="stat-trend">
                <span className="trend-indicator warning">⏰</span>
                <span className="trend-text">Cần theo dõi</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card danger animated">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.failedJobs}</h3>
              <p>Thất bại</p>
              <div className="stat-trend">
                <span className="trend-indicator danger">⚠️</span>
                <span className="trend-text">Cần xử lý</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card info animated">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalUsers}</h3>
              <p>Tổng người dùng</p>
              <div className="stat-trend">
                <span className="trend-indicator info">👤</span>
                <span className="trend-text">Tổng nhân sự</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card primary">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <h3>{stats.activeUsers}</h3>
              <p>Đang hoạt động</p>
            </div>
          </div>
          
          <div className="stat-card productivity">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%</h3>
              <p>Tổng năng suất</p>
            </div>
          </div>
          
          <div className="stat-card efficiency">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>{Object.values(departmentStats).length > 0 ? 
                Math.round(Object.values(departmentStats).reduce((sum, dept) => sum + dept.onTimeRate, 0) / Object.values(departmentStats).length) : 0}%</h3>
              <p>Tỷ lệ đúng hạn</p>
            </div>
          </div>
          
          <div className="stat-card departments">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>{Object.keys(departmentStats).length}</h3>
              <p>Bộ phận hoạt động</p>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>📊 Năng suất theo bộ phận</h3>
            <div className="chart-content">
              {Object.entries(departmentStats).map(([dept, data]) => (
                <div key={dept} className="chart-bar enhanced">
                  <div className="bar-header">
                  <div className="bar-label">{dept}</div>
                    <div className="bar-status-indicators">
                      <span className="status-dot completed" title="Hoàn thành">●</span>
                      <span className="status-dot pending" title="Đang xử lý">●</span>
                      <span className="status-dot failed" title="Thất bại">●</span>
                    </div>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${data.percentage}%`,
                        background: data.percentage >= 80 ? 'linear-gradient(90deg, #28a745 0%, #20c997 100%)' :
                                   data.percentage >= 60 ? 'linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)' :
                                   'linear-gradient(90deg, #dc3545 0%, #e83e8c 100%)'
                      }}
                    ></div>
                  </div>
                  <div className="bar-value">
                    <div className="percentage">{data.percentage}%</div>
                    <div className="count">({data.completed}/{data.total})</div>
                  </div>
                  <div className="bar-details">
                    <div className="detail-row">
                      <span className="detail-item">
                        <span className="detail-icon">✅</span>
                        {data.completed} hoàn thành
                      </span>
                      <span className="detail-item">
                        <span className="detail-icon">⏳</span>
                        {data.pending} đang xử lý
                      </span>
                      <span className="detail-item">
                        <span className="detail-icon">❌</span>
                        {data.failed} thất bại
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-item">
                        <span className="detail-icon">⚡</span>
                        {data.onTimeRate}% đúng hạn
                      </span>
                      <span className="detail-item">
                        <span className="detail-icon">📅</span>
                        {data.avgCompletionTime > 0 ? `${Math.round(data.avgCompletionTime)} ngày` : 'N/A'}
                      </span>
                      <span className="detail-item">
                        <span className="detail-icon">⚠️</span>
                        {data.overdue} trễ hạn
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>📈 Thống kê theo trạng thái</h3>
            <div className="chart-content">
              {Object.entries(statusStats).map(([status, count]) => (
                <div key={status} className="chart-bar">
                  <div className="bar-label">{status}</div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(count / stats.totalJobs) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-value">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="productivity-summary">
          <h3>📊 Tổng quan năng suất</h3>
          <div className="productivity-grid">
            {Object.entries(departmentStats).map(([dept, data]) => (
              <div key={dept} className="productivity-card">
                <div className="productivity-header">
                  <h4>{dept}</h4>
                  <div className="productivity-percentage">
                    {data.percentage}%
                  </div>
                </div>
                <div className="productivity-bar">
                  <div 
                    className="productivity-fill"
                    style={{ 
                      width: `${data.percentage}%`,
                      background: data.percentage >= 80 ? 'linear-gradient(90deg, #28a745 0%, #20c997 100%)' :
                                 data.percentage >= 60 ? 'linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)' :
                                 'linear-gradient(90deg, #dc3545 0%, #e83e8c 100%)'
                    }}
                  ></div>
                </div>
                <div className="productivity-details">
                  <span>Hoàn thành: {data.completed}/{data.total}</span>
                  <span className={`productivity-status ${
                    data.percentage >= 80 ? 'excellent' :
                    data.percentage >= 60 ? 'good' : 'needs-improvement'
                  }`}>
                    {data.percentage >= 80 ? 'Xuất sắc' :
                     data.percentage >= 60 ? 'Tốt' : 'Cần cải thiện'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="performance-insights">
          <h3>🔍 Phân tích hiệu suất chi tiết</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>📊 Top Bộ phận</h4>
              <div className="insight-content">
                {Object.entries(departmentStats)
                  .sort(([,a], [,b]) => b.percentage - a.percentage)
                  .slice(0, 3)
                  .map(([dept, data], index) => (
                    <div key={dept} className="insight-item">
                      <div className="insight-rank">#{index + 1}</div>
                      <div className="insight-info">
                        <div className="insight-name">{dept}</div>
                        <div className="insight-stats">
                          {data.percentage}% • {data.completed}/{data.total} công việc
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="insight-card">
              <h4>⚡ Hiệu suất thời gian</h4>
              <div className="insight-content">
                {Object.entries(departmentStats)
                  .filter(([,data]) => data.avgCompletionTime > 0)
                  .sort(([,a], [,b]) => a.avgCompletionTime - b.avgCompletionTime)
                  .slice(0, 3)
                  .map(([dept, data]) => (
                    <div key={dept} className="insight-item">
                      <div className="insight-info">
                        <div className="insight-name">{dept}</div>
                        <div className="insight-stats">
                          {Math.round(data.avgCompletionTime)} ngày trung bình
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="insight-card">
              <h4>🎯 Tỷ lệ đúng hạn</h4>
              <div className="insight-content">
                {Object.entries(departmentStats)
                  .sort(([,a], [,b]) => b.onTimeRate - a.onTimeRate)
                  .slice(0, 3)
                  .map(([dept, data]) => (
                    <div key={dept} className="insight-item">
                      <div className="insight-info">
                        <div className="insight-name">{dept}</div>
                        <div className="insight-stats">
                          {data.onTimeRate}% đúng hạn
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>🕒 Hoạt động gần đây</h3>
          <div className="activity-list">
            {filteredJobs.slice(-5).reverse().map(job => (
              <div key={job.id} className="activity-item">
                <div className="activity-icon">
                  {job.status === 'thành công' ? '✅' : 
                   job.status === 'thất bại' ? '❌' : 
                   job.status === 'đang xử lý' ? '⏳' : 
                   job.status === 'nhận việc' ? '📋' : '⏸️'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{job.description}</div>
                  <div className="activity-meta">
                    {job.department} • {job.assigner || 'Chưa giao'} → {job.assignee || 'Chưa giao'} • {new Date(job.deliveryDate).toLocaleDateString('vi-VN')} • {job.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // KPI Evaluation Component
  const KPIEvaluation = ({ users, jobs, currentUser }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
    const [evaluationData, setEvaluationData] = useState({
      performance: 0,
      discipline: 0,
      attitude: 0
    });
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationHistory, setEvaluationHistory] = useState([]);
    const [viewMode, setViewMode] = useState('evaluate'); // 'evaluate', 'history', 'all-evaluations'
    const [summaryPeriod, setSummaryPeriod] = useState('week'); // 'week', 'month', 'quarter', 'year'
    const [selectedDepartment, setSelectedDepartment] = useState('all'); // 'all' hoặc tên bộ phận
    const [allEvaluations, setAllEvaluations] = useState([]); // Lưu tất cả đánh giá KPI
    const [expandedUser, setExpandedUser] = useState(null); // Track which user's details are expanded
    const [historyTimeFilter, setHistoryTimeFilter] = useState('all'); // Filter for history tab
    const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState('all'); // Department filter for history tab
    const [historyDateFilter, setHistoryDateFilter] = useState(''); // Specific date filter for history tab
    const [weeklyTimeFilter, setWeeklyTimeFilter] = useState('all'); // Filter for weekly summary
    const [weeklyDepartmentFilter, setWeeklyDepartmentFilter] = useState('all'); // Department filter for weekly summary

    // Load KPI evaluations from server
    const loadKpiEvaluations = useCallback(async () => {
      try {
        const currentApiBase = window.API_BASE || API_BASE;
        const response = await fetch(`${currentApiBase}/api/kpi-evaluations`);
        const result = await response.json();
        if (result.success) {
          setAllEvaluations(result.data || []);
          setEvaluationHistory(result.data || []);
        }
      } catch (error) {
        console.error('❌ Lỗi load KPI evaluations:', error);
      }
    }, []);

    // Save KPI evaluations to server
    const saveKpiEvaluations = useCallback(async (evaluations) => {
      try {
        const currentApiBase = window.API_BASE || API_BASE;
        const response = await fetch(`${currentApiBase}/api/kpi-evaluations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ evaluations }),
        });
        const result = await response.json();
        if (!result.success) {
          console.error('❌ Lỗi save KPI evaluations:', result.error);
        }
      } catch (error) {
        console.error('❌ Lỗi save KPI evaluations:', error);
      }
    }, []);

    // Load evaluations when component mounts
    useEffect(() => {
      loadKpiEvaluations();
    }, [loadKpiEvaluations]);


    // Lấy danh sách bộ phận từ users có thể đánh giá
    const getAvailableDepartments = () => {
      let availableUsers = [];
      
      if (currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') {
        // Quản lý đánh giá Tổ trưởng
        availableUsers = users.filter(user => 
          user.role !== 'admin' && 
          user.position === 'Tổ trưởng'
        );
      } else if (currentUser?.position === 'Tổ trưởng') {
        // Tổ trưởng đánh giá Tổ phó và Nhân viên trong cùng bộ phận
        availableUsers = users.filter(user => 
          user.role !== 'admin' && 
          (user.position === 'Tổ phó' || user.position === 'Nhân viên') &&
          user.department === currentUser.department
        );
      } else if (currentUser?.position === 'Tổ phó') {
        // Tổ phó đánh giá Nhân viên trong cùng bộ phận
        availableUsers = users.filter(user => 
          user.role !== 'admin' && 
          user.position === 'Nhân viên' &&
          user.department === currentUser.department
        );
      }
      
      return Array.from(new Set(availableUsers.map(user => user.department))).filter(dept => dept);
    };

    // Lấy danh sách bộ phận cho bộ lọc lịch sử
    const getHistoryDepartments = () => {
      if (currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') {
        // Quản lý xem tất cả bộ phận
        return Array.from(new Set(users.map(user => user.department))).filter(dept => dept);
      } else {
        // Các cấp khác chỉ xem bộ phận mình
        return [currentUser?.department].filter(dept => dept);
      }
    };
    
    const departments = getAvailableDepartments();
    
    // Lọc users theo bộ phận và quyền đánh giá
    const getFilteredUsers = () => {
      let filteredUsers = [];
      
      // Quyền đánh giá theo cấp bậc
      if (currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') {
        // Quản lý đánh giá Tổ trưởng
        filteredUsers = users.filter(user => 
          user.role !== 'admin' && 
          user.position === 'Tổ trưởng'
        );
      } else if (currentUser?.position === 'Tổ trưởng') {
        // Tổ trưởng đánh giá Tổ phó và Nhân viên trong cùng bộ phận
        filteredUsers = users.filter(user => 
          user.role !== 'admin' && 
          (user.position === 'Tổ phó' || user.position === 'Nhân viên') &&
          user.department === currentUser.department
        );
      } else if (currentUser?.position === 'Tổ phó') {
        // Tổ phó đánh giá Nhân viên trong cùng bộ phận
        filteredUsers = users.filter(user => 
          user.role !== 'admin' && 
          user.position === 'Nhân viên' &&
          user.department === currentUser.department
        );
      }
      
      // Lọc theo bộ phận nếu được chọn
      if (selectedDepartment !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.department === selectedDepartment);
      }
      
      return filteredUsers;
    };

    const filteredUsers = getFilteredUsers();

    const criteria = [
      {
        name: 'performance',
        title: 'Hiệu quả công việc',
        weight: 50,
        description: 'Năng suất, chất lượng, tiến độ, linh hoạt',
        maxScore: 100
      },
      {
        name: 'discipline',
        title: 'Kỷ luật & Tuân thủ',
        weight: 30,
        description: 'Giờ giấc, nội quy, an toàn, giữ gìn',
        maxScore: 100
      },
      {
        name: 'attitude',
        title: 'Thái độ & Hợp tác',
        weight: 20,
        description: 'Trách nhiệm, hợp tác, học hỏi, chủ động',
        maxScore: 100
      }
    ];

    const handleScoreChange = (criteria, value) => {
      setEvaluationData(prev => ({
        ...prev,
        [criteria]: parseInt(value) || 0
      }));
    };

    const calculateTotalScore = () => {
      let totalScore = 0;
      let totalWeight = 0;

      criteria.forEach(criterion => {
        const score = evaluationData[criterion.name];
        const weightedScore = (score * criterion.weight) / 100;
        totalScore += weightedScore;
        totalWeight += criterion.weight;
      });

      return Math.round(totalScore);
    };

    const getScoreLevel = (score) => {
      if (score >= 90) return { level: 'Xuất sắc', color: '#28a745' };
      if (score >= 80) return { level: 'Tốt', color: '#17a2b8' };
      if (score >= 70) return { level: 'Khá', color: '#6f42c1' };
      if (score >= 50) return { level: 'Trung bình', color: '#ffc107' };
      return { level: 'Yếu', color: '#dc3545' };
    };

    // Calculate summary statistics
    const calculateSummary = () => {
      try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
        console.log('🔍 Debug calculateSummary:', {
          summaryPeriod,
          today: today.toLocaleDateString('vi-VN'),
          allEvaluationsLength: allEvaluations.length
        });
        
        let startDate, endDate;
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed
      
      switch (summaryPeriod) {
        case 'week':
          // Current week: from Monday to Sunday
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
          endDate = new Date(today);
          endDate.setDate(today.getDate() - today.getDay() + 7); // Sunday
          break;
        case 'month':
          startDate = new Date(currentYear, currentMonth, 1);
          endDate = new Date(currentYear, currentMonth + 1, 0);
          break;
        case 'quarter':
          const quarter = Math.floor(currentMonth / 3);
          startDate = new Date(currentYear, quarter * 3, 1);
          endDate = new Date(currentYear, quarter * 3 + 3, 0);
          break;
        case 'year':
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 11, 31);
          break;
        // Specific weeks in current month - weeks end on Sunday
        case 'week1':
          startDate = new Date(currentYear, currentMonth, 1);
          const firstDay = new Date(currentYear, currentMonth, 1);
          const firstDayOfWeek = firstDay.getDay();
          if (firstDayOfWeek === 0) {
            endDate = new Date(currentYear, currentMonth, 1);
          } else {
            const daysToSunday = 7 - firstDayOfWeek;
            endDate = new Date(currentYear, currentMonth, 1 + daysToSunday);
          }
          break;
        case 'week2':
          // Start from day after week 1's Sunday
          const week1End = new Date(currentYear, currentMonth, 1);
          const week1EndDayOfWeek = week1End.getDay();
          if (week1EndDayOfWeek === 0) {
            startDate = new Date(currentYear, currentMonth, 2);
          } else {
            const daysToFirstSunday = 7 - week1EndDayOfWeek;
            startDate = new Date(currentYear, currentMonth, 1 + daysToFirstSunday + 1);
          }
          const week2StartDayOfWeek = startDate.getDay();
          if (week2StartDayOfWeek === 0) {
            endDate = new Date(startDate);
          } else {
            const daysToSunday = 7 - week2StartDayOfWeek;
            endDate = new Date(currentYear, currentMonth, startDate.getDate() + daysToSunday);
          }
          break;
        case 'week3':
          // Start from day after week 2's Sunday
          const week2End = new Date(currentYear, currentMonth, 1);
          const week2EndDayOfWeek = week2End.getDay();
          if (week2EndDayOfWeek === 0) {
            startDate = new Date(currentYear, currentMonth, 2 + 7);
          } else {
            const daysToFirstSunday = 7 - week2EndDayOfWeek;
            startDate = new Date(currentYear, currentMonth, 1 + daysToFirstSunday + 1 + 7);
          }
          const week3StartDayOfWeek = startDate.getDay();
          if (week3StartDayOfWeek === 0) {
            endDate = new Date(startDate);
          } else {
            const daysToSunday = 7 - week3StartDayOfWeek;
            endDate = new Date(currentYear, currentMonth, startDate.getDate() + daysToSunday);
          }
          break;
        case 'week4':
          // Start from day after week 3's Sunday
          const week3End = new Date(currentYear, currentMonth, 1);
          const week3EndDayOfWeek = week3End.getDay();
          if (week3EndDayOfWeek === 0) {
            startDate = new Date(currentYear, currentMonth, 2 + 14);
          } else {
            const daysToFirstSunday = 7 - week3EndDayOfWeek;
            startDate = new Date(currentYear, currentMonth, 1 + daysToFirstSunday + 1 + 14);
          }
          const week4StartDayOfWeek = startDate.getDay();
          if (week4StartDayOfWeek === 0) {
            endDate = new Date(startDate);
          } else {
            const daysToSunday = 7 - week4StartDayOfWeek;
            endDate = new Date(currentYear, currentMonth, startDate.getDate() + daysToSunday);
          }
          break;
        case 'week5':
          // Start from day after week 4's Sunday
          const week4End = new Date(currentYear, currentMonth, 1);
          const week4EndDayOfWeek = week4End.getDay();
          if (week4EndDayOfWeek === 0) {
            startDate = new Date(currentYear, currentMonth, 2 + 21);
          } else {
            const daysToFirstSunday = 7 - week4EndDayOfWeek;
            startDate = new Date(currentYear, currentMonth, 1 + daysToFirstSunday + 1 + 21);
          }
          const week5StartDayOfWeek = startDate.getDay();
          if (week5StartDayOfWeek === 0) {
            endDate = new Date(startDate);
          } else {
            const daysToSunday = 7 - week5StartDayOfWeek;
            endDate = new Date(currentYear, currentMonth, startDate.getDate() + daysToSunday);
          }
          // Ensure week 5 doesn't exceed month boundaries
          const monthEnd = new Date(currentYear, currentMonth + 1, 0);
          if (endDate.getDate() > monthEnd.getDate()) {
            endDate = new Date(monthEnd);
          }
          break;
        // Specific months in current year
        case 'month1':
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 0, 31);
          break;
        case 'month2':
          startDate = new Date(currentYear, 1, 1);
          endDate = new Date(currentYear, 1, 28); // February
          break;
        case 'month3':
          startDate = new Date(currentYear, 2, 1);
          endDate = new Date(currentYear, 2, 31);
          break;
        case 'month4':
          startDate = new Date(currentYear, 3, 1);
          endDate = new Date(currentYear, 3, 30);
          break;
        case 'month5':
          startDate = new Date(currentYear, 4, 1);
          endDate = new Date(currentYear, 4, 31);
          break;
        case 'month6':
          startDate = new Date(currentYear, 5, 1);
          endDate = new Date(currentYear, 5, 30);
          break;
        case 'month7':
          startDate = new Date(currentYear, 6, 1);
          endDate = new Date(currentYear, 6, 31);
          break;
        case 'month8':
          startDate = new Date(currentYear, 7, 1);
          endDate = new Date(currentYear, 7, 31);
          break;
        case 'month9':
          startDate = new Date(currentYear, 8, 1);
          endDate = new Date(currentYear, 8, 30);
          break;
        case 'month10':
          startDate = new Date(currentYear, 9, 1);
          endDate = new Date(currentYear, 9, 31);
          break;
        case 'month11':
          startDate = new Date(currentYear, 10, 1);
          endDate = new Date(currentYear, 10, 30);
          break;
        case 'month12':
          startDate = new Date(currentYear, 11, 1);
          endDate = new Date(currentYear, 11, 31);
          break;
        // Specific week in specific month
        default:
          if (summaryPeriod.includes('_week')) {
            const [monthPart, weekPart] = summaryPeriod.split('_week');
            const monthNum = parseInt(monthPart.replace('month', '')) - 1; // Convert to 0-indexed
            const weekNum = parseInt(weekPart);
            
            if (monthNum >= 0 && monthNum <= 11 && weekNum >= 1 && weekNum <= 5) {
              const monthStart = new Date(currentYear, monthNum, 1);
              const monthEnd = new Date(currentYear, monthNum + 1, 0);
              
              // Calculate week boundaries - weeks end on Sunday
              if (weekNum === 1) {
                // Week 1: From 1st day of month to next Sunday
                startDate = new Date(currentYear, monthNum, 1);
                
                // Find the first Sunday of the month
                const firstDay = new Date(currentYear, monthNum, 1);
                const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
                
                if (firstDayOfWeek === 0) {
                  // If 1st is Sunday, week ends on same day
                  endDate = new Date(currentYear, monthNum, 1);
                } else {
                  // Find next Sunday
                  const daysToSunday = 7 - firstDayOfWeek;
                  endDate = new Date(currentYear, monthNum, 1 + daysToSunday);
                }
              } else {
                // Week 2+: Start from day after previous week's Sunday
                const prevWeekEnd = new Date(currentYear, monthNum, 1);
                const firstDayOfWeek = prevWeekEnd.getDay();
                
                if (firstDayOfWeek === 0) {
                  // If 1st is Sunday, week 2 starts on 2nd
                  const weekStartDay = 1 + (weekNum - 1) * 7;
                  startDate = new Date(currentYear, monthNum, weekStartDay);
                } else {
                  // Calculate start of current week
                  const daysToFirstSunday = 7 - firstDayOfWeek;
                  const weekStartDay = 1 + daysToFirstSunday + (weekNum - 2) * 7;
                  startDate = new Date(currentYear, monthNum, weekStartDay);
                }
                
                // Week ends on Sunday
                const weekStartDayOfWeek = startDate.getDay();
                if (weekStartDayOfWeek === 0) {
                  // If week starts on Sunday, it ends same day
                  endDate = new Date(startDate);
                } else {
                  // Find next Sunday
                  const daysToSunday = 7 - weekStartDayOfWeek;
                  endDate = new Date(currentYear, monthNum, startDate.getDate() + daysToSunday);
                }
              }
              
              // Ensure dates don't exceed month boundaries
              if (startDate.getMonth() !== monthNum) {
                startDate = new Date(currentYear, monthNum, 1);
              }
              if (endDate.getMonth() !== monthNum || endDate.getDate() > monthEnd.getDate()) {
                endDate = new Date(monthEnd);
              }
              
              // Debug log for week calculation
              console.log(`📅 ${summaryPeriod}: ${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`);
              
            } else {
          startDate = new Date(0);
              endDate = new Date();
            }
          } else {
            startDate = new Date(0);
            endDate = new Date();
          }
          break;
      }

      const filteredEvaluations = allEvaluations.filter(evaluation => {
        const evalDate = new Date(evaluation.date);
        return evalDate >= startDate && evalDate <= endDate;
      });

      if (filteredEvaluations.length === 0) {
        return {
          totalEvaluations: 0,
          averageScore: 0,
          topPerformers: [],
          departmentStats: {},
          scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 }
        };
      }

      // Calculate average score
      const totalScore = filteredEvaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0);
      const averageScore = Math.round(totalScore / filteredEvaluations.length);

      // Top performers
      const topPerformers = filteredEvaluations
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 5);

      // Department statistics
      const departmentStats = filteredEvaluations.reduce((acc, evaluation) => {
        if (!acc[evaluation.department]) {
          acc[evaluation.department] = { count: 0, totalScore: 0, average: 0 };
        }
        acc[evaluation.department].count += 1;
        acc[evaluation.department].totalScore += evaluation.totalScore;
        acc[evaluation.department].average = Math.round(acc[evaluation.department].totalScore / acc[evaluation.department].count);
        return acc;
      }, {});

      // Score distribution (A/B/C/D)
      const scoreDistribution = filteredEvaluations.reduce((acc, evaluation) => {
        if (evaluation.totalScore >= 90) acc.excellent += 1; // Xuất sắc
        else if (evaluation.totalScore >= 80) acc.good += 1; // Tốt
        else if (evaluation.totalScore >= 70) acc.average += 1; // Trung bình
        else acc.poor += 1; // Cần cải thiện
        return acc;
      }, { excellent: 0, good: 0, average: 0, poor: 0 });

      // Calculate monthly trends
      const monthlyTrend = calculateMonthlyTrend();
      const dailyKPI = calculateDailyKPI();

      return {
        totalEvaluations: filteredEvaluations.length,
        averageScore,
        topPerformers,
        departmentStats,
        scoreDistribution,
        monthlyTrend,
        dailyKPI
      };
      } catch (error) {
        console.error('❌ Error in calculateSummary:', error);
        return {
          totalEvaluations: 0,
          averageScore: 0,
          topPerformers: [],
          departmentStats: {},
          scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
          monthlyTrend: [],
          dailyKPI: []
        };
      }
    };


    // Calculate monthly trend
    const calculateMonthlyTrend = () => {
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthEvaluations = allEvaluations.filter(evaluation => {
          const evalDate = new Date(evaluation.date);
          return evalDate >= monthStart && evalDate <= monthEnd;
        });
        
        // Calculate average of 4 weeks in the month
        const weeklyAverages = calculateWeeklyAveragesInMonth(monthStart, monthEnd);
        const monthlyAverage = weeklyAverages.length > 0 
          ? Math.round(weeklyAverages.reduce((sum, avg) => sum + avg, 0) / weeklyAverages.length)
          : 0;
        
        months.push({
          month: `${monthStart.getMonth() + 1}/${monthStart.getFullYear()}`,
          evaluations: monthEvaluations.length,
          averageScore: monthlyAverage,
          weeklyAverages: weeklyAverages,
          date: monthStart
        });
      }
      
      return months;
    };

    // Calculate daily KPI for all weeks in current month
    const calculateDailyKPI = () => {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get first and last day of current month
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        
        const days = [];
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        
        // Generate all days in the current month
        const current = new Date(monthStart);
        while (current <= monthEnd) {
          const dayStart = new Date(current);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(current);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayEvaluations = allEvaluations.filter(evaluation => {
            const evalDate = new Date(evaluation.date);
            return evalDate >= dayStart && evalDate <= dayEnd;
          });
          
          const avgScore = dayEvaluations.length > 0 
            ? Math.round(dayEvaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / dayEvaluations.length)
            : 0;
          
          const dayName = dayNames[current.getDay()];
          
          // Calculate week number - weeks always end on Sunday
          const dayOfMonth = current.getDate();
          const firstDayOfMonth = monthStart.getDay(); // 0=Sunday, 1=Monday, etc.
          
          // Find the Sunday that ends the week containing this day
          const dayOfWeek = current.getDay(); // 0=Sunday, 1=Monday, etc.
          const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
          const weekEndingSunday = new Date(current);
          weekEndingSunday.setDate(current.getDate() + daysToSunday);
          
          // Calculate week number based on which Sunday this week ends on
          let weekNumber;
          if (firstDayOfMonth === 0) { // Month starts on Sunday
            weekNumber = Math.ceil(dayOfMonth / 7);
          } else {
            // Find the first Sunday of the month
            const firstSunday = new Date(monthStart);
            if (firstDayOfMonth === 0) {
              // Already Sunday
            } else {
              firstSunday.setDate(1 + (7 - firstDayOfMonth));
            }
            
            // Calculate week number based on which Sunday this week ends on
            const daysDiff = Math.floor((weekEndingSunday - firstSunday) / (1000 * 60 * 60 * 24));
            weekNumber = Math.floor(daysDiff / 7) + 1;
            
            // If this day is before the first Sunday, it's week 1
            if (current < firstSunday) {
              weekNumber = 1;
            }
          }
          
          days.push({
            day: dayName,
            date: current.toLocaleDateString('vi-VN'),
            evaluationsCount: dayEvaluations.length,
            averageScore: avgScore,
            evaluations: dayEvaluations,
            weekNumber: weekNumber
          });
          
          current.setDate(current.getDate() + 1);
        }
        
        return days;
      } catch (error) {
        console.error('❌ Error in calculateDailyKPI:', error);
        return [];
      }
    };

    // Calculate weekly averages in a month
    const calculateWeeklyAveragesInMonth = (monthStart, monthEnd) => {
      const weeklyAverages = [];
      const current = new Date(monthStart);
      
      while (current <= monthEnd) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(current.getDate() + 6);
        
        // Adjust if week goes beyond month
        if (weekEnd > monthEnd) {
          weekEnd.setTime(monthEnd.getTime());
        }
        
        const weekEvaluations = allEvaluations.filter(evaluation => {
          const evalDate = new Date(evaluation.date);
          return evalDate >= weekStart && evalDate <= weekEnd;
        });
        
        const weekAvg = weekEvaluations.length > 0 
          ? Math.round(weekEvaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / weekEvaluations.length)
          : 0;
        
        weeklyAverages.push(weekAvg);
        
        // Move to next week
        current.setDate(current.getDate() + 7);
      }
      
      return weeklyAverages;
    };

    // Export Daily KPI to Excel
    const exportDailyKPIExcel = (dailyData) => {
      try {
        // Create CSV content with BOM for proper UTF-8 encoding
        let csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "Ngày,Thứ,Đánh giá,Điểm trung bình\n";
        
        dailyData.forEach(day => {
          csvContent += `${day.date},${day.day},${day.evaluationsCount},${day.averageScore}\n`;
        });
        
        // Create and download file with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Bao_cao_KPI_ngay_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Đã xuất báo cáo KPI theo ngày thành công!');
      } catch (error) {
        console.error('❌ Lỗi xuất file:', error);
        alert('❌ Lỗi khi xuất file. Vui lòng thử lại.');
      }
    };

    // Export Monthly KPI to Excel
    const exportMonthlyKPIExcel = (monthlyData) => {
      try {
        // Create CSV content with BOM for proper UTF-8 encoding
        let csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "Tháng,Đánh giá,Điểm trung bình,Điểm TB tuần 1,Điểm TB tuần 2,Điểm TB tuần 3,Điểm TB tuần 4\n";
        
        monthlyData.forEach(month => {
          const weeklyAvgs = month.weeklyAverages || [];
          csvContent += `${month.month},${month.evaluations},${month.averageScore},${weeklyAvgs[0] || 0},${weeklyAvgs[1] || 0},${weeklyAvgs[2] || 0},${weeklyAvgs[3] || 0}\n`;
        });
        
        // Create and download file with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Bao_cao_KPI_thang_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Đã xuất báo cáo KPI theo tháng thành công!');
      } catch (error) {
        console.error('❌ Lỗi xuất file:', error);
        alert('❌ Lỗi khi xuất file. Vui lòng thử lại.');
      }
    };

    // Export Department KPI to Excel
    const exportDepartmentKPIExcel = (departmentStats) => {
      try {
        // Create CSV content with BOM for proper UTF-8 encoding
        let csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "Bộ phận,Số đánh giá,Điểm trung bình\n";
        
        Object.entries(departmentStats).forEach(([dept, stats]) => {
          csvContent += `${dept},${stats.count},${stats.average}\n`;
        });
        
        // Create and download file with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Bao_cao_KPI_bo_phan_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Đã xuất báo cáo KPI theo bộ phận thành công!');
      } catch (error) {
        console.error('❌ Lỗi xuất file:', error);
        alert('❌ Lỗi khi xuất file. Vui lòng thử lại.');
      }
    };

    // Export All Evaluations to Excel (with current filters)
    const exportAllEvaluationsExcel = () => {
      try {
        // Get filtered evaluations - use the same logic as display
        const filteredEvaluations = allEvaluations.filter(evaluation => {
          // Filter by department
          if (selectedDepartment !== 'all' && evaluation.department !== selectedDepartment) {
            return false;
          }
          
          // Filter by time period
          const evalDate = new Date(evaluation.date);
          const today = new Date();
          let startDate;
          
          switch (summaryPeriod) {
            case 'week':
              // Current week: from Monday to Sunday
              startDate = new Date(today);
              startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
              const endDate = new Date(today);
              endDate.setDate(today.getDate() - today.getDay() + 7); // Sunday
              return evalDate >= startDate && evalDate <= endDate;
            case 'month':
              startDate = new Date(today.getFullYear(), today.getMonth(), 1);
              break;
            case 'quarter':
              const quarter = Math.floor(today.getMonth() / 3);
              startDate = new Date(today.getFullYear(), quarter * 3, 1);
              break;
            case 'year':
              startDate = new Date(today.getFullYear(), 0, 1);
              break;
            default:
              // Show all evaluations when no specific period is selected
              return true;
          }
          
          return evalDate >= startDate && evalDate <= today;
        });

        exportEvaluationsToCSV(filteredEvaluations, 'Danh_sach_danh_gia_KPI');
      } catch (error) {
        console.error('❌ Lỗi xuất file:', error);
        alert('❌ Lỗi khi xuất file. Vui lòng thử lại.');
      }
    };

    // Export All Evaluations to Excel (without filters)
    const exportAllEvaluationsExcelUnfiltered = () => {
      try {
        exportEvaluationsToCSV(allEvaluations, 'Tat_ca_danh_gia_KPI');
      } catch (error) {
        console.error('❌ Lỗi xuất file:', error);
        alert('❌ Lỗi khi xuất file. Vui lòng thử lại.');
      }
    };

    // Helper function to export evaluations to CSV
    const exportEvaluationsToCSV = (evaluations, filenamePrefix) => {
      try {
        // Debug log
        console.log('Export Debug:');
        console.log('- Evaluations to export:', evaluations.length);
        console.log('- Data:', evaluations);

        // Create CSV content with BOM for proper UTF-8 encoding
        let csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "STT,Nhân viên,Bộ phận,Ngày đánh giá,Hiệu quả,Kỷ luật,Thái độ,Tổng điểm,Xếp loại\n";
        
        evaluations.forEach((evaluation, index) => {
          csvContent += `${index + 1},${evaluation.userName},${evaluation.department},${new Date(evaluation.date).toLocaleDateString('vi-VN')},${evaluation.scores.performance},${evaluation.scores.discipline},${evaluation.scores.attitude},${evaluation.totalScore},${evaluation.level}\n`;
        });
        
        // Create and download file with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filenamePrefix}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`✅ Đã xuất ${evaluations.length} đánh giá KPI thành công!`);
      } catch (error) {
        console.error('❌ Lỗi xuất file:', error);
        alert('❌ Lỗi khi xuất file. Vui lòng thử lại.');
      }
    };

    // Export weekly summaries to CSV
    const exportWeeklySummariesToCSV = (weeklySummaries, filenamePrefix) => {
      try {
        // Create CSV content with BOM for proper UTF-8 encoding
        let csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "STT,Nhân viên,Bộ phận,Tuần từ,Tuần đến,Số đánh giá ngày,Điểm TB hiệu quả,Điểm TB kỷ luật,Điểm TB thái độ,Điểm TB tổng,Xếp loại tuần\n";
        
        weeklySummaries.forEach((summary, index) => {
          csvContent += `${index + 1},${summary.userName},${summary.department},${new Date(summary.weekStart).toLocaleDateString('vi-VN')},${new Date(summary.weekEnd).toLocaleDateString('vi-VN')},${summary.totalDailyEvaluations},${summary.averageScores.performance},${summary.averageScores.discipline},${summary.averageScores.attitude},${summary.averageTotalScore},${summary.weeklyLevel}\n`;
        });
        
        // Create and download file with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filenamePrefix}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`✅ Đã xuất ${weeklySummaries.length} báo cáo tổng hợp tuần thành công!`);
      } catch (error) {
        console.error('❌ Lỗi xuất file:', error);
        alert('❌ Lỗi khi xuất file. Vui lòng thử lại.');
      }
    };

    // Calculate weekly summary from daily evaluations
    const calculateWeeklySummary = (userId, weekStart, weekNumber) => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      
      // Calculate week end (Sunday of the week)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Ensure week end doesn't exceed month end
      if (weekEnd > monthEnd) {
        weekEnd.setTime(monthEnd.getTime());
        weekEnd.setHours(23, 59, 59, 999);
      }
      
      // Get all daily evaluations for this user in this week (within month)
      const weeklyEvaluations = allEvaluations.filter(evaluation => {
        const evalDate = new Date(evaluation.date);
        return evaluation.userId === userId && 
               evalDate >= weekStart && 
               evalDate <= weekEnd &&
               evalDate >= monthStart &&
               evalDate <= monthEnd;
      });
      
      if (weeklyEvaluations.length === 0) return null;
      
      // Calculate averages
      const totalEvaluations = weeklyEvaluations.length;
      const avgPerformance = weeklyEvaluations.reduce((sum, evaluation) => sum + evaluation.scores.performance, 0) / totalEvaluations;
      const avgDiscipline = weeklyEvaluations.reduce((sum, evaluation) => sum + evaluation.scores.discipline, 0) / totalEvaluations;
      const avgAttitude = weeklyEvaluations.reduce((sum, evaluation) => sum + evaluation.scores.attitude, 0) / totalEvaluations;
      const avgTotalScore = weeklyEvaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / totalEvaluations;
      
      // Determine weekly level based on average score
      let weeklyLevel;
      if (avgTotalScore >= 90) weeklyLevel = 'Xuất sắc';
      else if (avgTotalScore >= 80) weeklyLevel = 'Tốt';
      else if (avgTotalScore >= 70) weeklyLevel = 'Trung bình';
      else weeklyLevel = 'Cần cải thiện';
      
      return {
        userId: userId,
        userName: weeklyEvaluations[0].userName,
        department: weeklyEvaluations[0].department,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        weekNumber: weekNumber,
        totalDailyEvaluations: totalEvaluations,
        averageScores: {
          performance: Math.round(avgPerformance * 100) / 100,
          discipline: Math.round(avgDiscipline * 100) / 100,
          attitude: Math.round(avgAttitude * 100) / 100
        },
        averageTotalScore: Math.round(avgTotalScore * 100) / 100,
        weeklyLevel: weeklyLevel,
        dailyEvaluations: weeklyEvaluations,
        createdAt: new Date().toISOString()
      };
    };

    // Filter weekly summaries based on time and department
    const getFilteredWeeklySummaries = () => {
      const allSummaries = generateWeeklySummaries();
      
      return allSummaries.filter(summary => {
        // Filter by department
        if (weeklyDepartmentFilter !== 'all' && summary.department !== weeklyDepartmentFilter) {
          return false;
        }
        
        // Filter by time
        if (weeklyTimeFilter !== 'all') {
          const summaryDate = new Date(summary.weekStart);
          const today = new Date();
          
          switch (weeklyTimeFilter) {
            case 'week1':
              return summary.weekNumber === 1;
            case 'week2':
              return summary.weekNumber === 2;
            case 'week3':
              return summary.weekNumber === 3;
            case 'week4':
              return summary.weekNumber === 4;
            case 'week5':
              return summary.weekNumber === 5;
            case 'current':
              // Current week (this week)
              const currentWeekStart = new Date(today);
              const currentDay = today.getDay();
              const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
              currentWeekStart.setDate(today.getDate() + daysToMonday);
              currentWeekStart.setHours(0, 0, 0, 0);
              
              const currentWeekEnd = new Date(currentWeekStart);
              currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
              currentWeekEnd.setHours(23, 59, 59, 999);
              
              return summaryDate >= currentWeekStart && summaryDate <= currentWeekEnd;
            default:
              return true;
          }
        }
        
        return true;
      });
    };

    // Generate weekly summaries for all users (monthly-based weeks)
    const generateWeeklySummaries = () => {
      try {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        console.log('🔍 Debug - Today:', today.toISOString().split('T')[0]);
        console.log('🔍 Debug - Current month:', currentMonth + 1);
        
        // Get current month boundaries
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        console.log('🔍 Debug - Month start:', monthStart.toISOString().split('T')[0]);
        console.log('🔍 Debug - Month end:', monthEnd.toISOString().split('T')[0]);
        
        // Calculate weeks in month (Week 1 starts from 1st day of month)
        const weeksInMonth = [];
        let weekNumber = 1;
        
        // Week 1 always starts from the 1st day of the month
        let weekStart = new Date(currentYear, currentMonth, 1);
        weekStart.setHours(0, 0, 0, 0);
        
        console.log('🔍 Debug - Week 1 start:', weekStart.toISOString().split('T')[0]);
        
        // Generate all weeks that have at least one day in the current month
        while (weekStart <= monthEnd) {
          let weekEnd;
          
          if (weekNumber === 1) {
            // Week 1: from 1st day to Sunday of that week
            const firstDayOfWeek = weekStart.getDay();
            const daysToSunday = firstDayOfWeek === 0 ? 0 : 7 - firstDayOfWeek;
            weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + daysToSunday);
          } else {
            // Other weeks: Monday to Sunday
            weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
          }
          weekEnd.setHours(23, 59, 59, 999);
          
          // Only include weeks that have at least one day in the current month
          if (weekEnd >= monthStart && weekStart <= monthEnd) {
            const actualWeekStart = new Date(Math.max(weekStart, monthStart));
            const actualWeekEnd = new Date(Math.min(weekEnd, monthEnd));
            actualWeekStart.setHours(0, 0, 0, 0);
            actualWeekEnd.setHours(23, 59, 59, 999);
            
            console.log(`🔍 Debug - Week ${weekNumber}: ${actualWeekStart.toISOString().split('T')[0]} to ${actualWeekEnd.toISOString().split('T')[0]}`);
            
            weeksInMonth.push({ 
              start: actualWeekStart, 
              end: actualWeekEnd, 
              weekNumber: weekNumber 
            });
            weekNumber++;
          }
          
          // Move to next week
          if (weekNumber === 2) {
            // Week 2 starts from Monday after Week 1's Sunday
            weekStart = new Date(weekEnd);
            weekStart.setDate(weekEnd.getDate() + 1);
            weekStart.setHours(0, 0, 0, 0);
          } else {
            // Other weeks: move to next Monday
            weekStart = new Date(weekStart);
            weekStart.setDate(weekStart.getDate() + 7);
            weekStart.setHours(0, 0, 0, 0);
          }
        }
        
        console.log('🔍 Debug - Total weeks:', weeksInMonth.length);
        
        // Get unique users who have evaluations
        const uniqueUsers = [...new Set(allEvaluations.map(evaluation => evaluation.userId))];
      
      const weeklySummaries = [];
      
      // For each week in the month, calculate summaries for all users
      weeksInMonth.forEach(week => {
        uniqueUsers.forEach(userId => {
          const summary = calculateWeeklySummary(userId, week.start, week.weekNumber);
          if (summary) {
            weeklySummaries.push(summary);
          }
        });
      });
      
        return weeklySummaries;
      } catch (error) {
        console.error('❌ Error in generateWeeklySummaries:', error);
        return [];
      }
    };

    // Toggle expanded user details
    const toggleUserDetails = (userId) => {
      setExpandedUser(expandedUser === userId ? null : userId);
    };

    // Filter history evaluations
    const getFilteredHistory = () => {
      return evaluationHistory.filter(evaluation => {
        // Quản lý xem tất cả, các cấp khác chỉ xem bộ phận mình
        if (currentUser?.role !== 'admin' && currentUser?.position !== 'Quản lý') {
          if (evaluation.department !== currentUser?.department) {
            return false;
          }
        }
        
        // Filter by department (nếu có bộ lọc)
        if (historyDepartmentFilter !== 'all' && evaluation.department !== historyDepartmentFilter) {
          return false;
        }
        
        // Filter by specific date if provided
        if (historyDateFilter) {
          const evalDate = new Date(evaluation.date);
          const filterDate = new Date(historyDateFilter);
          return evalDate.toDateString() === filterDate.toDateString();
        }
        
        // Filter by time period
        const evalDate = new Date(evaluation.date);
        const today = new Date();
        let startDate;
        
        switch (historyTimeFilter) {
          case 'today':
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            // Current week: from Monday to Sunday
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - today.getDay() + 7); // Sunday
            return evalDate >= startDate && evalDate <= endDate;
          case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
          case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startDate = new Date(today.getFullYear(), quarter * 3, 1);
            break;
          case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
          default:
            return true;
        }
        
        return evalDate >= startDate && evalDate <= today;
      });
    };


    // Calculate daily KPI report for current week
    const calculateDailyKPIReport = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate current week: Monday to Sunday
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Monday is start of week
      
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() + daysToMonday);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Sunday
      
      const dailyReports = [];
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      
      // Generate days for the current week
      const daysInWeek = Math.ceil((currentWeekEnd - currentWeekStart) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < daysInWeek; i++) {
        const dayStart = new Date(currentWeekStart);
        dayStart.setDate(currentWeekStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayEvaluations = allEvaluations.filter(evaluation => {
          const evalDate = new Date(evaluation.date);
          return evalDate >= dayStart && evalDate <= dayEnd;
        });
        
        // Calculate department-wise statistics for this day
        const departmentStats = {};
        dayEvaluations.forEach(evaluation => {
          if (!departmentStats[evaluation.department]) {
            departmentStats[evaluation.department] = {
              evaluations: [],
              totalScore: 0,
              count: 0,
              averageScore: 0
            };
          }
          departmentStats[evaluation.department].evaluations.push(evaluation);
          departmentStats[evaluation.department].totalScore += evaluation.totalScore;
          departmentStats[evaluation.department].count += 1;
        });
        
        // Calculate average scores for each department
        Object.keys(departmentStats).forEach(dept => {
          const stats = departmentStats[dept];
          stats.averageScore = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
        });
        
        const totalEvaluations = dayEvaluations.length;
        const overallAverage = totalEvaluations > 0 
          ? Math.round(dayEvaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / totalEvaluations)
          : 0;
        
        dailyReports.push({
          dayName: dayNames[i],
          date: dayStart,
          dateString: dayStart.toLocaleDateString('vi-VN'),
          totalEvaluations,
          overallAverage,
          departmentStats,
          evaluations: dayEvaluations
        });
      }
      
      return dailyReports;
    };

    const handleStartEvaluation = (user) => {
      // Kiểm tra xem người này đã được đánh giá trong ngày hôm nay chưa
      const today = new Date().toISOString().split('T')[0];
      const alreadyEvaluatedToday = allEvaluations.some(evaluation => 
        evaluation.userId === user.id && 
        evaluation.date === today &&
        evaluation.evaluatedBy === currentUser.fullName
      );
      
      if (alreadyEvaluatedToday) {
        alert(`❌ Bạn đã đánh giá ${user.fullName} trong ngày hôm nay!\nMỗi người chỉ được đánh giá 1 lần/ngày.`);
        return;
      }
      
      setSelectedUser(user);
      setIsEvaluating(true);
      setEvaluationData({
        performance: 0,
        discipline: 0,
        attitude: 0
      });
    };

    const handleSaveEvaluation = async () => {
      const totalScore = calculateTotalScore();
      const scoreLevel = getScoreLevel(totalScore);
      
      // Sử dụng ngày được chọn từ input
      const selectedDate = evaluationDate;
      
      const newEvaluation = {
        id: Date.now(),
        userId: selectedUser.id,
        userName: selectedUser.fullName,
        department: selectedUser.department,
        date: selectedDate, // Sử dụng ngày được chọn
        scores: evaluationData,
        totalScore: totalScore,
        level: scoreLevel.level,
        evaluatedBy: currentUser.fullName,
        evaluatorRole: currentUser.role === 'admin' ? 'Quản lý' : currentUser.position,
        createdAt: new Date().toISOString()
      };
      
      const updatedEvaluations = [newEvaluation, ...allEvaluations];
      setEvaluationHistory(updatedEvaluations);
      setAllEvaluations(updatedEvaluations);
      
      // Save to server
      await saveKpiEvaluations(updatedEvaluations);
      
      alert(`✅ Đánh giá KPI cho ${selectedUser.fullName} ngày ${selectedDate}:\nĐiểm tổng: ${totalScore}/100\nXếp loại: ${scoreLevel.level}\n\n💡 Đánh giá đã được lưu với ngày được chọn.`);
      
      setIsEvaluating(false);
      setSelectedUser(null);
    };

    // Delete evaluation function
    const handleDeleteEvaluation = async (evaluationId) => {
      if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.')) {
        return;
      }
      
      try {
        // Gọi API để xóa đánh giá
        const response = await fetch(`${window.API_BASE || API_BASE}/api/kpi-evaluations/${evaluationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Cập nhật state local
          const updatedEvaluations = allEvaluations.filter(evaluation => evaluation.id !== evaluationId);
          setEvaluationHistory(updatedEvaluations);
          setAllEvaluations(updatedEvaluations);
          
          alert('✅ Đã xóa đánh giá thành công!');
        } else {
          alert(`❌ Lỗi: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Lỗi khi xóa đánh giá:', error);
        alert('❌ Lỗi khi xóa đánh giá. Vui lòng thử lại.');
      }
    };

    return (
      <div className="kpi-evaluation">
        <div className="kpi-header">
          <h2>📊 Đánh giá KPI nhân sự</h2>
          <p>Bộ tiêu chí 360° - Ưu tiên hiệu quả – tuân thủ – phát triển</p>
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const evaluatedToday = allEvaluations.filter(evaluation => 
              evaluation.date === today && 
              evaluation.evaluatedBy === currentUser.fullName
            ).length;
            const totalUsers = users.filter(user => user.id !== currentUser.id).length;
            
            return (
              <div className="daily-progress">
                <div className="progress-info">
                  <span className="progress-text">
                    📈 Tiến độ hôm nay: {evaluatedToday}/{totalUsers} người đã đánh giá
                  </span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${(evaluatedToday / totalUsers) * 100}%`}}
                    ></div>
                  </div>
                </div>
                {evaluatedToday === totalUsers && (
                  <div className="completion-message">
                    🎉 Chúc mừng! Bạn đã hoàn thành đánh giá tất cả nhân viên trong ngày hôm nay!
                  </div>
                )}
              </div>
            );
          })()}
          <div className="kpi-controls">
            <div className="date-selector">
              <label>📅 Ngày đánh giá:</label>
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                disabled
                className="date-input disabled"
                title="Ngày đánh giá được tự động cố định theo ngày hiện tại"
              />
              <small style={{color: '#666', fontSize: '12px'}}>
                ⚠️ Ngày đánh giá được cố định theo ngày hiện tại để đảm bảo tính chính xác
              </small>
            </div>
            <div className="view-mode">
              <button
                className={`mode-btn ${viewMode === 'evaluate' ? 'active' : ''}`}
                onClick={() => setViewMode('evaluate')}
              >
                📝 Đánh giá
              </button>
              <button
                className={`mode-btn ${viewMode === 'history' ? 'active' : ''}`}
                onClick={() => setViewMode('history')}
              >
                📊 Lịch sử
              </button>
              <button
                className={`mode-btn ${viewMode === 'summary' ? 'active' : ''}`}
                onClick={() => setViewMode('summary')}
              >
                📈 Tổng hợp
              </button>
              {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') && (
              <button
                  className={`mode-btn ${viewMode === 'all-evaluations' ? 'active' : ''}`}
                  onClick={() => setViewMode('all-evaluations')}
              >
                  👥 Tất cả đánh giá
              </button>
              )}
            </div>
          </div>
        </div>

        {viewMode === 'summary' ? (
          <div className="evaluation-summary">
            <div className="summary-header">
              <div className="section-header">
              <h3>📈 Tổng hợp đánh giá KPI</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="export-excel-btn"
                    onClick={() => exportDailyKPIExcel(calculateDailyKPIReport())}
                    title="Xuất báo cáo KPI theo ngày"
                  >
                    📅 Xuất theo ngày
                  </button>
                  <button 
                    className="export-excel-btn"
                    onClick={() => exportMonthlyKPIExcel(calculateMonthlyKPIReport())}
                    title="Xuất báo cáo KPI theo tháng"
                  >
                    📊 Xuất theo tháng
                  </button>
                </div>
              </div>
              <div className="period-selector">
                <label>Khoảng thời gian:</label>
                <select 
                  value={summaryPeriod} 
                  onChange={(e) => setSummaryPeriod(e.target.value)}
                  className="period-select"
                >
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="quarter">Quý này</option>
                  <option value="year">Năm này</option>
                  <optgroup label="📅 Theo tuần">
                    <option value="week1">Tuần 1</option>
                    <option value="week2">Tuần 2</option>
                    <option value="week3">Tuần 3</option>
                    <option value="week4">Tuần 4</option>
                    <option value="week5">Tuần 5</option>
                  </optgroup>
                  <optgroup label="📆 Theo tháng">
                    <option value="month1">Tháng 1</option>
                    <option value="month2">Tháng 2</option>
                    <option value="month3">Tháng 3</option>
                    <option value="month4">Tháng 4</option>
                    <option value="month5">Tháng 5</option>
                    <option value="month6">Tháng 6</option>
                    <option value="month7">Tháng 7</option>
                    <option value="month8">Tháng 8</option>
                    <option value="month9">Tháng 9</option>
                    <option value="month10">Tháng 10</option>
                    <option value="month11">Tháng 11</option>
                    <option value="month12">Tháng 12</option>
                  </optgroup>
                  <optgroup label="🗓️ Tuần trong tháng cụ thể">
                    <option value="month1_week1">Tháng 1 - Tuần 1</option>
                    <option value="month1_week2">Tháng 1 - Tuần 2</option>
                    <option value="month1_week3">Tháng 1 - Tuần 3</option>
                    <option value="month1_week4">Tháng 1 - Tuần 4</option>
                    <option value="month1_week5">Tháng 1 - Tuần 5</option>
                    <option value="month2_week1">Tháng 2 - Tuần 1</option>
                    <option value="month2_week2">Tháng 2 - Tuần 2</option>
                    <option value="month2_week3">Tháng 2 - Tuần 3</option>
                    <option value="month2_week4">Tháng 2 - Tuần 4</option>
                    <option value="month3_week1">Tháng 3 - Tuần 1</option>
                    <option value="month3_week2">Tháng 3 - Tuần 2</option>
                    <option value="month3_week3">Tháng 3 - Tuần 3</option>
                    <option value="month3_week4">Tháng 3 - Tuần 4</option>
                    <option value="month3_week5">Tháng 3 - Tuần 5</option>
                    <option value="month4_week1">Tháng 4 - Tuần 1</option>
                    <option value="month4_week2">Tháng 4 - Tuần 2</option>
                    <option value="month4_week3">Tháng 4 - Tuần 3</option>
                    <option value="month4_week4">Tháng 4 - Tuần 4</option>
                    <option value="month5_week1">Tháng 5 - Tuần 1</option>
                    <option value="month5_week2">Tháng 5 - Tuần 2</option>
                    <option value="month5_week3">Tháng 5 - Tuần 3</option>
                    <option value="month5_week4">Tháng 5 - Tuần 4</option>
                    <option value="month5_week5">Tháng 5 - Tuần 5</option>
                    <option value="month6_week1">Tháng 6 - Tuần 1</option>
                    <option value="month6_week2">Tháng 6 - Tuần 2</option>
                    <option value="month6_week3">Tháng 6 - Tuần 3</option>
                    <option value="month6_week4">Tháng 6 - Tuần 4</option>
                    <option value="month7_week1">Tháng 7 - Tuần 1</option>
                    <option value="month7_week2">Tháng 7 - Tuần 2</option>
                    <option value="month7_week3">Tháng 7 - Tuần 3</option>
                    <option value="month7_week4">Tháng 7 - Tuần 4</option>
                    <option value="month7_week5">Tháng 7 - Tuần 5</option>
                    <option value="month8_week1">Tháng 8 - Tuần 1</option>
                    <option value="month8_week2">Tháng 8 - Tuần 2</option>
                    <option value="month8_week3">Tháng 8 - Tuần 3</option>
                    <option value="month8_week4">Tháng 8 - Tuần 4</option>
                    <option value="month8_week5">Tháng 8 - Tuần 5</option>
                    <option value="month9_week1">Tháng 9 - Tuần 1</option>
                    <option value="month9_week2">Tháng 9 - Tuần 2</option>
                    <option value="month9_week3">Tháng 9 - Tuần 3</option>
                    <option value="month9_week4">Tháng 9 - Tuần 4</option>
                    <option value="month10_week1">Tháng 10 - Tuần 1</option>
                    <option value="month10_week2">Tháng 10 - Tuần 2</option>
                    <option value="month10_week3">Tháng 10 - Tuần 3</option>
                    <option value="month10_week4">Tháng 10 - Tuần 4</option>
                    <option value="month10_week5">Tháng 10 - Tuần 5</option>
                    <option value="month11_week1">Tháng 11 - Tuần 1</option>
                    <option value="month11_week2">Tháng 11 - Tuần 2</option>
                    <option value="month11_week3">Tháng 11 - Tuần 3</option>
                    <option value="month11_week4">Tháng 11 - Tuần 4</option>
                    <option value="month12_week1">Tháng 12 - Tuần 1</option>
                    <option value="month12_week2">Tháng 12 - Tuần 2</option>
                    <option value="month12_week3">Tháng 12 - Tuần 3</option>
                    <option value="month12_week4">Tháng 12 - Tuần 4</option>
                    <option value="month12_week5">Tháng 12 - Tuần 5</option>
                  </optgroup>
                </select>
              </div>
            </div>
            
            {(() => {
              const summary = calculateSummary();
              return (
                <div className="summary-content">
                  <div className="summary-stats">
                    <div className="stat-card">
                      <h4>Tổng đánh giá</h4>
                      <div className="stat-value">{summary.totalEvaluations}</div>
                    </div>
                    <div className="stat-card">
                      <h4>Điểm trung bình</h4>
                      <div className="stat-value">{summary.averageScore}/100</div>
                    </div>
                    <div className="stat-card">
                      <h4>Xuất sắc</h4>
                      <div className="stat-value">{summary.scoreDistribution.excellent}</div>
                    </div>
                    <div className="stat-card">
                      <h4>Tốt</h4>
                      <div className="stat-value">{summary.scoreDistribution.good}</div>
                    </div>
                    <div className="stat-card">
                      <h4>Trung bình</h4>
                      <div className="stat-value">{summary.scoreDistribution.average}</div>
                    </div>
                    <div className="stat-card">
                      <h4>Cần cải thiện</h4>
                      <div className="stat-value">{summary.scoreDistribution.poor}</div>
                    </div>
                  </div>

                  {summary.topPerformers.length > 0 && (
                    <div className="top-performers">
                      <h4>🏆 Top 5 nhân viên xuất sắc</h4>
                      <div className="performers-list">
                        {summary.topPerformers.map((performer, index) => (
                          <div key={performer.id} className="performer-item">
                            <div className="rank">#{index + 1}</div>
                            <div className="performer-info">
                              <div className="name">{performer.userName}</div>
                              <div className="department">{performer.department}</div>
                            </div>
                            <div className="score">
                              <span 
                                className="score-value"
                                style={{ color: getScoreLevel(performer.totalScore).color }}
                              >
                                {performer.totalScore}/100
                              </span>
                              <span className="level">{performer.level}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(summary.departmentStats).length > 0 && (
                    <div className="department-performance">
                      <div className="section-header">
                      <h4>📊 Năng suất theo bộ phận</h4>
                        <button 
                          className="export-excel-btn"
                          onClick={() => exportDepartmentKPIExcel(summary.departmentStats)}
                          title="Xuất báo cáo Excel"
                        >
                          📊 Xuất Excel
                        </button>
                      </div>
                      <div className="department-list">
                        {Object.entries(summary.departmentStats).map(([dept, stats]) => (
                          <div key={dept} className="department-item">
                            <div className="dept-name">{dept}</div>
                            <div className="dept-stats">
                              <span>Đánh giá: {stats.count}</span>
                              <span>Trung bình: {stats.average}/100</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily KPI */}
                  {summary.dailyKPI && summary.dailyKPI.length > 0 && (
                    <div className="trend-section daily-kpi">
                      <div className="section-header">
                        <h4>📅 Báo cáo KPI theo ngày (Tháng này)</h4>
                        <button 
                          className="export-excel-btn"
                          onClick={() => exportDailyKPIExcel(summary.dailyKPI)}
                          title="Xuất báo cáo Excel"
                        >
                          📊 Xuất Excel
                        </button>
                      </div>
                      {/* Group by weeks */}
                      {(() => {
                        const weeks = {};
                        summary.dailyKPI.forEach(day => {
                          const weekNum = day.weekNumber || 1;
                          if (!weeks[weekNum]) {
                            weeks[weekNum] = [];
                          }
                          weeks[weekNum].push(day);
                        });
                        
                        return Object.keys(weeks).map(weekNum => {
                          const weekDays = weeks[weekNum];
                          const firstDay = weekDays[0];
                          const lastDay = weekDays[weekDays.length - 1];
                          const weekTitle = weekDays.length < 7 
                            ? `📅 Tuần ${weekNum} (${firstDay.date} - ${lastDay.date})`
                            : `📅 Tuần ${weekNum}`;
                          
                          return (
                            <div key={weekNum} className="week-section">
                              <h5 className="week-title">{weekTitle}</h5>
                              <div className="daily-kpi-grid">
                                {weekDays.map((day, index) => (
                                <div key={index} className="daily-kpi-item">
                                  <div className="day-header">
                                    <span className="day-name">{day.day}</span>
                                    <span className="day-date">{day.date}</span>
                                  </div>
                                  <div className="day-stats">
                                    <div className="day-stat">
                                      <span className="stat-label">Đánh giá:</span>
                                      <span className="stat-value">{day.evaluationsCount}</span>
                                    </div>
                                    <div className="day-stat">
                                      <span className="stat-label">Điểm TB:</span>
                                      <span className="stat-value score">{day.averageScore}/100</span>
                                    </div>
                                  </div>
                                  <div className="day-progress">
                                    <div 
                                      className="progress-fill"
                                      style={{ 
                                        width: `${day.averageScore}%`,
                                        backgroundColor: day.averageScore >= 80 ? '#28a745' : 
                                                       day.averageScore >= 70 ? '#ffc107' : '#dc3545'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}


                  {/* Monthly Trend */}
                  {summary.monthlyTrend && summary.monthlyTrend.length > 0 && (
                    <div className="trend-section">
                      <div className="section-header">
                        <h4>📊 Xu hướng theo tháng (6 tháng gần nhất)</h4>
                        <button 
                          className="export-excel-btn"
                          onClick={() => exportMonthlyKPIExcel(summary.monthlyTrend)}
                          title="Xuất báo cáo Excel"
                        >
                          📊 Xuất Excel
                        </button>
                      </div>
                      <div className="trend-chart monthly-trend">
                        {summary.monthlyTrend.map((month, index) => (
                          <div key={index} className="trend-item monthly">
                            <div className="trend-header">
                              <span className="trend-label">{month.month}</span>
                            </div>
                            <div className="trend-stats">
                              <div className="trend-stat">
                                <span className="stat-label">Đánh giá:</span>
                                <span className="stat-value">{month.evaluations}</span>
                              </div>
                              <div className="trend-stat">
                                <span className="stat-label">Điểm TB:</span>
                                <span className="stat-value score">{month.averageScore}/100</span>
                              </div>
                            </div>
                            <div className="trend-bar">
                              <div 
                                className="trend-fill"
                                style={{ 
                                  width: `${month.averageScore}%`,
                                  backgroundColor: month.averageScore >= 80 ? '#28a745' : 
                                                 month.averageScore >= 70 ? '#ffc107' : '#dc3545'
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.totalEvaluations === 0 && (
                    <div className="no-data">
                      <p>Chưa có dữ liệu đánh giá trong khoảng thời gian này</p>
                    </div>
                  )}
                  
                  {/* Weekly Summary Section - Moved to bottom */}
                  <div style={{ marginTop: '30px', padding: '15px', background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', borderRadius: '8px', border: '1px solid #ffc107' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📊 Báo cáo tổng hợp tuần trong tháng
                    </h4>
                    
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ color: '#856404', fontWeight: '600' }}>📅 Tuần:</label>
                        <select 
                          value={weeklyTimeFilter} 
                          onChange={(e) => setWeeklyTimeFilter(e.target.value)}
                          style={{ 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            border: '1px solid #ffc107',
                            backgroundColor: 'white',
                            color: '#495057'
                          }}
                        >
                          <option value="all">Tất cả tuần</option>
                          <option value="current">Tuần hiện tại</option>
                          <option value="week1">Tuần 1</option>
                          <option value="week2">Tuần 2</option>
                          <option value="week3">Tuần 3</option>
                          <option value="week4">Tuần 4</option>
                          <option value="week5">Tuần 5</option>
                        </select>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ color: '#856404', fontWeight: '600' }}>🏢 Bộ phận:</label>
                        <select 
                          value={weeklyDepartmentFilter} 
                          onChange={(e) => setWeeklyDepartmentFilter(e.target.value)}
                          style={{ 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            border: '1px solid #ffc107',
                            backgroundColor: 'white',
                            color: '#495057'
                          }}
                        >
                          <option value="all">Tất cả bộ phận</option>
                          {Array.from(new Set(allEvaluations.map(e => e.department))).map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {(() => {
                      const weeklySummaries = getFilteredWeeklySummaries();
                      if (weeklySummaries.length === 0) {
                        return <p style={{ margin: 0, color: '#856404' }}>📭 Chưa có đánh giá nào phù hợp với bộ lọc</p>;
                      }
                      
                      return (
                        <div>
                          <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
                            📈 Tổng hợp từ {weeklySummaries.reduce((sum, s) => sum + s.totalDailyEvaluations, 0)} đánh giá hàng ngày của {weeklySummaries.length} nhân viên
                          </p>
                          <div style={{ 
                            background: 'white', 
                            borderRadius: '8px', 
                            border: '1px solid #dee2e6',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                          }}>
                            {/* Header Row */}
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', 
                              gap: '1px',
                              background: '#f8f9fa',
                              borderBottom: '2px solid #dee2e6'
                            }}>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>👤 Nhân viên</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>📅 Tuần</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>🏢 Bộ phận</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>📅 Từ</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>📅 Đến</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>📊 Số đánh giá</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>⚡ Hiệu quả</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>⚖️ Kỷ luật</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>🧡 Thái độ</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>🎯 Tổng điểm</div>
                              <div style={{ padding: '12px', fontWeight: '600', color: '#495057', textAlign: 'center' }}>📊 Xếp loại</div>
                            </div>
                            
                            {/* Data Rows */}
                            {weeklySummaries.map((summary, index) => (
                              <React.Fragment key={index}>
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', 
                                  gap: '1px',
                                  borderBottom: index < weeklySummaries.length - 1 ? '1px solid #dee2e6' : 'none',
                                  background: index % 2 === 0 ? 'white' : '#f8f9fa',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={() => toggleUserDetails(summary.userId)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#e3f2fd';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8f9fa';
                                }}
                                >
                                  <div style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#333' }}>
                                    👤 {summary.userName}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                                    Tuần {summary.weekNumber}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                                    {summary.department}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                                    {summary.weekNumber === 1 ? '01/10/2025' : new Date(summary.weekStart).toLocaleDateString('vi-VN')}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                                    {summary.weekNumber === 1 ? '05/10/2025' : new Date(summary.weekEnd).toLocaleDateString('vi-VN')}
                                  </div>
                                  <div style={{ 
                                    padding: '12px', 
                                    textAlign: 'center', 
                                    color: '#1976d2', 
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleUserDetails(summary.userId);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#e3f2fd';
                                    e.target.style.borderRadius = '4px';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                  }}
                                  title="Click để xem chi tiết đánh giá"
                                  >
                                    {summary.totalDailyEvaluations}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#2e7d32', fontWeight: '500' }}>
                                    {summary.averageScores.performance}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#ef6c00', fontWeight: '500' }}>
                                    {summary.averageScores.discipline}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#c2185b', fontWeight: '500' }}>
                                    {summary.averageScores.attitude}
                                  </div>
                                  <div style={{ padding: '12px', textAlign: 'center', color: '#6f42c1', fontWeight: '600' }}>
                                    {summary.averageTotalScore}
                                  </div>
                                  <div style={{ 
                                    padding: '12px', 
                                    textAlign: 'center', 
                                    fontWeight: '600',
                                    background: summary.weeklyLevel === 'Xuất sắc' ? '#e8f5e8' : 
                                               summary.weeklyLevel === 'Tốt' ? '#e3f2fd' : 
                                               summary.weeklyLevel === 'Trung bình' ? '#fff3e0' : '#ffebee',
                                    color: summary.weeklyLevel === 'Xuất sắc' ? '#2e7d32' : 
                                           summary.weeklyLevel === 'Tốt' ? '#1976d2' : 
                                           summary.weeklyLevel === 'Trung bình' ? '#f57c00' : '#d32f2f',
                                    borderRadius: '4px',
                                    margin: '4px'
                                  }}>
                                    {summary.weeklyLevel}
                                  </div>
                                </div>
                                
                                {/* Expanded Details Section */}
                                {expandedUser === summary.userId && (
                                  <div style={{ 
                                    gridColumn: '1 / -1', // Span across all columns
                                    marginTop: '0',
                                    padding: '15px', 
                                    background: '#f8f9fa', 
                                    borderRadius: '0 0 8px 8px', 
                                    border: '1px solid #dee2e6',
                                    borderTop: 'none'
                                  }}>
                                    <h5 style={{ 
                                      margin: '0 0 10px 0', 
                                      color: '#333', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px' 
                                    }}>
                                      📋 Chi tiết đánh giá hàng ngày
                                    </h5>
                                    
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                      gap: '10px' 
                                    }}>
                                      {summary.dailyEvaluations.map((evaluation, evalIndex) => (
                                        <div key={evalIndex} style={{ 
                                          background: 'white', 
                                          padding: '12px', 
                                          borderRadius: '6px', 
                                          border: '1px solid #e9ecef',
                                          fontSize: '0.8rem'
                                        }}>
                                          <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            marginBottom: '8px' 
                                          }}>
                                            <span style={{ fontWeight: '600', color: '#333' }}>
                                              📅 {new Date(evaluation.date).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span style={{ 
                                              padding: '2px 8px', 
                                              borderRadius: '12px', 
                                              fontSize: '0.7rem',
                                              fontWeight: '600',
                                              background: evaluation.level === 'Xuất sắc' ? '#e8f5e8' : 
                                                         evaluation.level === 'Tốt' ? '#e3f2fd' : 
                                                         evaluation.level === 'Trung bình' ? '#fff3e0' : '#ffebee',
                                              color: evaluation.level === 'Xuất sắc' ? '#2e7d32' : 
                                                     evaluation.level === 'Tốt' ? '#1976d2' : 
                                                     evaluation.level === 'Trung bình' ? '#f57c00' : '#d32f2f'
                                            }}>
                                              {evaluation.level}
                                            </span>
                                          </div>
                                          
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                            <div style={{ color: '#666' }}>
                                              ⚡ Hiệu quả: <strong>{evaluation.scores.performance}</strong>
                                            </div>
                                            <div style={{ color: '#666' }}>
                                              ⚖️ Kỷ luật: <strong>{evaluation.scores.discipline}</strong>
                                            </div>
                                            <div style={{ color: '#666' }}>
                                              🤝 Thái độ: <strong>{evaluation.scores.attitude}</strong>
                                            </div>
                                            <div style={{ color: '#333', fontWeight: '600' }}>
                                              🎯 Tổng: <strong>{evaluation.totalScore}</strong>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    <div style={{ 
                                      marginTop: '10px', 
                                      padding: '8px', 
                                      background: '#e3f2fd', 
                                      borderRadius: '4px', 
                                      fontSize: '0.8rem', 
                                      color: '#1976d2',
                                      textAlign: 'center'
                                    }}>
                                      📊 Tổng cộng: {summary.totalDailyEvaluations} đánh giá | Điểm TB: {summary.averageTotalScore} | Xếp loại: {summary.weeklyLevel}
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : viewMode === 'history' ? (
          <div className="evaluation-history">
            <div className="history-header">
            <h3>📊 Lịch sử đánh giá KPI</h3>
              
              {/* Filter Controls */}
              <div className="history-filters" style={{ 
                display: 'flex', 
                gap: '15px', 
                marginBottom: '20px', 
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div className="filter-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333', marginRight: '8px' }}>
                    📅 Thời gian:
                  </label>
                  <select 
                    value={historyTimeFilter}
                    onChange={(e) => setHistoryTimeFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  >
                    <option value="all">Tất cả</option>
                    <option value="today">Hôm nay</option>
                    <option value="week">7 ngày qua</option>
                    <option value="month">Tháng này</option>
                    <option value="quarter">Quý này</option>
                    <option value="year">Năm này</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333', marginRight: '8px' }}>
                    🏢 Bộ phận:
                  </label>
                  <select 
                    value={historyDepartmentFilter}
                    onChange={(e) => setHistoryDepartmentFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  >
                    <option value="all">Tất cả</option>
                    {getHistoryDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333', marginRight: '8px' }}>
                    📅 Ngày cụ thể:
                  </label>
                  <input 
                    type="date"
                    value={historyDateFilter}
                    onChange={(e) => {
                      setHistoryDateFilter(e.target.value);
                      if (e.target.value) {
                        setHistoryTimeFilter('all'); // Reset time filter when date is selected
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  />
                  {historyDateFilter && (
                    <button 
                      onClick={() => setHistoryDateFilter('')}
                      style={{
                        marginLeft: '8px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #dc3545',
                        background: '#dc3545',
                        color: 'white',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Xóa
                    </button>
                  )}
                </div>
                
                <div style={{ 
                  padding: '8px 12px', 
                  background: '#f8f9fa', 
                  borderRadius: '6px', 
                  fontSize: '0.9rem',
                  color: '#666',
                  border: '1px solid #e9ecef'
                }}>
                  📊 Hiển thị: {getFilteredHistory().length} / {evaluationHistory.length} đánh giá
                  {currentUser?.role !== 'admin' && currentUser?.position !== 'Quản lý' && (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}> (Bộ phận: {currentUser?.department})</span>
                  )}
                </div>
              </div>
            </div>
            
            {evaluationHistory.length === 0 ? (
              <div className="no-history">
                <p>Chưa có đánh giá nào được lưu</p>
              </div>
            ) : getFilteredHistory().length === 0 ? (
              <div className="no-history">
                <p>Không có đánh giá nào phù hợp với bộ lọc đã chọn</p>
              </div>
            ) : (
              <div className="history-table-container">
                <div className="history-table">
                  <div className="table-header">
                    <div>👤 Nhân viên</div>
                    <div>🏢 Bộ phận</div>
                    <div>📅 Ngày đánh giá</div>
                    <div>📊 Hiệu quả</div>
                    <div>⚖️ Kỷ luật</div>
                    <div>🤝 Thái độ</div>
                    <div>🎯 Tổng điểm</div>
                    <div>🏆 Xếp loại</div>
                    <div>👨‍💼 Người đánh giá</div>
                    {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') && (
                      <div>⚙️ Thao tác</div>
                    )}
                  </div>
                  
                  {getFilteredHistory().map(evaluation => (
                    <div key={evaluation.id} className="table-row">
                      <div className="user-info">
                        <div className="user-name">{evaluation.userName}</div>
                      </div>
                      <div className="department">{evaluation.department}</div>
                      <div className="date">{new Date(evaluation.date).toLocaleDateString('vi-VN')}</div>
                      <div className="score performance" style={{ color: '#28a745' }}>
                        {evaluation.scores.performance}
                      </div>
                      <div className="score discipline" style={{ color: '#ffc107' }}>
                        {evaluation.scores.discipline}
                      </div>
                      <div className="score attitude" style={{ color: '#dc3545' }}>
                        {evaluation.scores.attitude}
                      </div>
                      <div className="total-score" style={{ color: '#6f42c1', fontWeight: 'bold' }}>
                        {evaluation.totalScore}
                      </div>
                      <div 
                        className="level"
                        style={{ 
                          color: getScoreLevel(evaluation.totalScore).color,
                          fontWeight: '600'
                        }}
                      >
                        {evaluation.level}
                      </div>
                      <div className="evaluator">
                        <div className="evaluator-name">
                          {evaluation.evaluatedBy || 'Chưa xác định'}
                        </div>
                        <div className="evaluator-role">
                          {evaluation.evaluatorRole || 'Chưa xác định'}
                        </div>
                      </div>
                      {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') && (
                        <div className="actions">
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteEvaluation(evaluation.id)}
                            title="Xóa đánh giá"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: '1px solid #dc3545',
                              background: '#dc3545',
                              color: 'white',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#c82333';
                              e.target.style.borderColor = '#c82333';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = '#dc3545';
                              e.target.style.borderColor = '#dc3545';
                            }}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
         ) : viewMode === 'all-evaluations' ? (
          <div className="all-evaluations">
            <div className="all-evaluations-header">
              <div className="section-header">
                <h3>👥 Tất cả đánh giá KPI trong hệ thống</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="export-excel-btn"
                    onClick={exportAllEvaluationsExcel}
                    title="Xuất danh sách đánh giá theo filter hiện tại"
                  >
                    📄 Xuất theo filter
                  </button>
                  <button 
                    className="export-excel-btn"
                    onClick={exportAllEvaluationsExcelUnfiltered}
                    title="Xuất tất cả đánh giá không bị filter"
                    style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}
                  >
                    📋 Xuất tất cả
                  </button>
                  <button 
                    className="export-excel-btn"
                    onClick={() => {
                      const weeklySummaries = getFilteredWeeklySummaries();
                      if (weeklySummaries.length > 0) {
                        const filterSuffix = weeklyTimeFilter !== 'all' || weeklyDepartmentFilter !== 'all' 
                          ? `_${weeklyTimeFilter}_${weeklyDepartmentFilter}` 
                          : '';
                        exportWeeklySummariesToCSV(weeklySummaries, `Bao_cao_tong_hop_tuan${filterSuffix}`);
                      } else {
                        alert('📭 Chưa có đánh giá nào phù hợp với bộ lọc để tổng hợp');
                      }
                    }}
                    title="Xuất báo cáo tổng hợp tuần theo bộ lọc"
                    style={{ background: 'linear-gradient(135deg, #fd7e14 0%, #e8590c 100%)' }}
                  >
                    📊 Tổng hợp tuần
                  </button>
                </div>
              </div>
              <div className="evaluations-stats">
                <div className="stat-item">
                  <span className="stat-number">{allEvaluations.length}</span>
                  <span className="stat-label">Tổng đánh giá</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {allEvaluations.filter(e => e.level === 'Xuất sắc').length}
                  </span>
                  <span className="stat-label">Xuất sắc</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {allEvaluations.filter(e => e.level === 'Tốt').length}
                  </span>
                  <span className="stat-label">Tốt</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {allEvaluations.filter(e => e.level === 'Trung bình').length}
                  </span>
                  <span className="stat-label">Trung bình</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {allEvaluations.filter(e => e.level === 'Cần cải thiện').length}
                  </span>
                  <span className="stat-label">Cần cải thiện</span>
                </div>
              </div>
            </div>

            <div className="evaluations-filters">
              <div className="filter-group">
                <label>🏢 Bộ phận:</label>
                <select 
                  value={selectedDepartment} 
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tất cả bộ phận</option>
                  {Array.from(new Set(allEvaluations.map(e => e.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>📅 Khoảng thời gian:</label>
                <select 
                  value={summaryPeriod} 
                  onChange={(e) => setSummaryPeriod(e.target.value)}
                  className="filter-select"
                >
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="quarter">Quý này</option>
                  <option value="year">Năm này</option>
                  <option value="all">Tất cả</option>
                </select>
              </div>
            </div>

            <div className="evaluations-table">
              <div className="table-header">
                <div>👤 Nhân viên</div>
                <div>🏢 Bộ phận</div>
                <div>📅 Ngày đánh giá</div>
                <div>📊 Hiệu quả</div>
                <div>⚖️ Kỷ luật</div>
                <div>🤝 Thái độ</div>
                <div>🎯 Tổng điểm</div>
                <div>🏆 Xếp loại</div>
                <div>👨‍💼 Người đánh giá</div>
                {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') && (
                  <div>⚙️ Thao tác</div>
                )}
              </div>
              
              <div className="filter-info" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.9rem' }}>
                📊 Hiển thị: {allEvaluations.filter(evaluation => {
                  // Quản lý xem tất cả đánh giá, các cấp khác chỉ xem đánh giá của mình
                  if (currentUser?.role !== 'admin' && currentUser?.position !== 'Quản lý') {
                    if (evaluation.evaluatedBy !== currentUser.fullName) {
                      return false;
                    }
                  }
                  
                  if (selectedDepartment !== 'all' && evaluation.department !== selectedDepartment) {
                    return false;
                  }
                  const evalDate = new Date(evaluation.date);
                  const today = new Date();
                  let startDate;
                  
                  switch (summaryPeriod) {
                    case 'week':
                      // Current week: from Monday to Sunday
                      startDate = new Date(today);
                      startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
                      const endDate = new Date(today);
                      endDate.setDate(today.getDate() - today.getDay() + 7); // Sunday
                      return evalDate >= startDate && evalDate <= endDate;
                    case 'month':
                      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                      break;
                    case 'quarter':
                      const quarter = Math.floor(today.getMonth() / 3);
                      startDate = new Date(today.getFullYear(), quarter * 3, 1);
                      break;
                    case 'year':
                      startDate = new Date(today.getFullYear(), 0, 1);
                      break;
                    default:
                      return true;
                  }
                  return evalDate >= startDate && evalDate <= today;
                }).length} / {allEvaluations.length} đánh giá
                {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') && (
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}> (Quản lý xem tất cả)</span>
                )}
              </div>
              
              
              
              {(() => {
                const filteredEvaluations = allEvaluations
                  .filter(evaluation => {
                    // Quản lý xem tất cả đánh giá, các cấp khác chỉ xem đánh giá của mình
                    if (currentUser?.role !== 'admin' && currentUser?.position !== 'Quản lý') {
                      if (evaluation.evaluatedBy !== currentUser.fullName) {
                        return false;
                      }
                    }
                    
                    // Filter by department
                    if (selectedDepartment !== 'all' && evaluation.department !== selectedDepartment) {
                      return false;
                    }
                    
                    // Filter by time period
                    const evalDate = new Date(evaluation.date);
                    const today = new Date();
                    let startDate;
                    
                    switch (summaryPeriod) {
                      case 'week':
                        // Current week: from Monday to Sunday
                        startDate = new Date(today);
                        startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
                        const endDate = new Date(today);
                        endDate.setDate(today.getDate() - today.getDay() + 7); // Sunday
                        return evalDate >= startDate && evalDate <= endDate;
                      case 'month':
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        break;
                      case 'quarter':
                        const quarter = Math.floor(today.getMonth() / 3);
                        startDate = new Date(today.getFullYear(), quarter * 3, 1);
                        break;
                      case 'year':
                        startDate = new Date(today.getFullYear(), 0, 1);
                        return evalDate >= startDate && evalDate <= today;
                      case 'all':
                        // Show all evaluations
                        return true;
                      default:
                        // Show all evaluations when no specific period is selected
                        return true;
                    }
                  })
                  .sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Debug log
                console.log('Total evaluations:', allEvaluations.length);
                console.log('Filtered evaluations:', filteredEvaluations.length);
                console.log('Selected department:', selectedDepartment);
                console.log('Summary period:', summaryPeriod);
                
                return filteredEvaluations.map(evaluation => (
                  <div key={evaluation.id} className="evaluation-row">
                    <div className="user-info">
                      <div className="user-name">{evaluation.userName}</div>
                    </div>
                    <div className="department">{evaluation.department}</div>
                    <div className="date">
                      {new Date(evaluation.date).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="score performance">
                      {evaluation.scores.performance}/100
                    </div>
                    <div className="score discipline">
                      {evaluation.scores.discipline}/100
                    </div>
                    <div className="score attitude">
                      {evaluation.scores.attitude}/100
                    </div>
                    <div className="total-score">
                      <strong>{evaluation.totalScore}/100</strong>
                    </div>
                    <div className="level">
                      <span 
                        className="level-badge"
                        style={{ 
                          backgroundColor: evaluation.level === 'Xuất sắc' ? '#28a745' :
                                         evaluation.level === 'Tốt' ? '#17a2b8' :
                                         evaluation.level === 'Trung bình' ? '#ffc107' :
                                         '#dc3545'
                        }}
                      >
                        {evaluation.level}
                      </span>
                    </div>
                    <div className="evaluator">
                      <div className="evaluator-name">
                        {evaluation.evaluatedBy || 'Chưa xác định'}
                      </div>
                      <div className="evaluator-role">
                        {evaluation.evaluatorRole || 'Chưa xác định'}
                      </div>
                    </div>
                    {(currentUser?.role === 'admin' || currentUser?.position === 'Quản lý') && (
                      <div className="actions">
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteEvaluation(evaluation.id)}
                          title="Xóa đánh giá"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #dc3545',
                            background: '#dc3545',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = '#c82333';
                            e.target.style.borderColor = '#c82333';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = '#dc3545';
                            e.target.style.borderColor = '#dc3545';
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            {allEvaluations.length === 0 && (
              <div className="no-evaluations">
                <p>📭 Chưa có đánh giá KPI nào trong hệ thống</p>
              </div>
            )}
          </div>
        ) : !isEvaluating ? (
          <div className="user-selection">
            <h3>👥 Chọn nhân viên để đánh giá</h3>
            
            {/* Thông tin quyền đánh giá */}
            <div className="evaluation-permission-info">
              {currentUser?.role === 'admin' || currentUser?.position === 'Quản lý' ? (
                <p>📋 <strong>Quản lý</strong> đánh giá <strong>Tổ trưởng</strong></p>
              ) : currentUser?.position === 'Tổ trưởng' ? (
                <p>📋 <strong>Tổ trưởng</strong> đánh giá <strong>Tổ phó</strong> và <strong>Nhân viên</strong> trong bộ phận <strong>{currentUser.department}</strong></p>
              ) : currentUser?.position === 'Tổ phó' ? (
                <p>📋 <strong>Tổ phó</strong> đánh giá <strong>Nhân viên</strong> trong bộ phận <strong>{currentUser.department}</strong></p>
              ) : (
                <p>❌ Bạn không có quyền đánh giá KPI</p>
              )}
            </div>
            
            {/* Department Tabs */}
            {departments.length > 0 && (
              <div className="department-tabs">
                <button 
                  className={`dept-tab ${selectedDepartment === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedDepartment('all')}
                >
                  🏢 Tất cả bộ phận
                </button>
                {departments.map(dept => (
                  <button 
                    key={dept}
                    className={`dept-tab ${selectedDepartment === dept ? 'active' : ''}`}
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    🏢 {dept}
                  </button>
                ))}
              </div>
            )}

            {/* User Grid */}
            <div className="user-grid">
              {filteredUsers.length === 0 ? (
                <div className="no-users">
                  <p>Không có nhân viên nào trong bộ phận này</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  // Kiểm tra xem người này đã được đánh giá trong ngày hôm nay chưa
                  const today = new Date().toISOString().split('T')[0];
                  const alreadyEvaluatedToday = allEvaluations.some(evaluation => 
                    evaluation.userId === user.id && 
                    evaluation.date === today &&
                    evaluation.evaluatedBy === currentUser.fullName
                  );
                  
                  return (
                    <div key={user.id} className="user-card">
                      <div className="user-info">
                        <h4>{user.fullName}</h4>
                        <p>{user.department} - {user.position}</p>
                        {alreadyEvaluatedToday && (
                          <div className="evaluation-status">
                            <span className="status-badge evaluated">✅ Đã đánh giá hôm nay</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleStartEvaluation(user)}
                        className={`evaluate-btn ${alreadyEvaluatedToday ? 'disabled' : ''}`}
                        disabled={alreadyEvaluatedToday}
                        title={alreadyEvaluatedToday ? 'Bạn đã đánh giá người này trong ngày hôm nay' : 'Bấm để đánh giá KPI'}
                      >
                        {alreadyEvaluatedToday ? '✅ Đã đánh giá' : '📝 Đánh giá KPI'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="evaluation-form">
            <div className="evaluation-header">
              <h3>📝 Đánh giá KPI cho: {selectedUser.fullName}</h3>
              <div className="evaluation-date-display">
                <label htmlFor="evaluation-date">📅 Ngày đánh giá:</label>
                <input
                  id="evaluation-date"
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="date-input"
                  max={new Date().toISOString().split('T')[0]}
                />
                <span className="date-note">💡 Có thể chọn ngày trong quá khứ để đánh giá bù</span>
              </div>
              <div className="evaluation-weights">
                <span>Thang điểm: 0-100 điểm cho mỗi tiêu chí</span>
              </div>
            </div>

            <div className="criteria-list">
              {criteria.map(criterion => (
                <div key={criterion.name} className="criterion-card">
                  <div className="criterion-header">
                    <h4>{criterion.title} ({criterion.weight}%)</h4>
                    <p>{criterion.description}</p>
                  </div>
                  
                  <div className="evaluation-inputs">
                    <div className="evaluator-group">
                      <label>Điểm đánh giá: {evaluationData[criterion.name]}/100</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={evaluationData[criterion.name]}
                        onChange={(e) => handleScoreChange(criterion.name, e.target.value)}
                        className="score-slider"
                      />
                      <div className="slider-labels">
                        <span>0</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                    </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="evaluation-summary">
              <div className="total-score">
                <h3>Điểm tổng KPI: {calculateTotalScore()}/100</h3>
                <div 
                  className="score-level"
                  style={{ color: getScoreLevel(calculateTotalScore()).color }}
                >
                  {getScoreLevel(calculateTotalScore()).level}
                </div>
              </div>
            </div>

            <div className="evaluation-actions">
              <button onClick={handleSaveEvaluation} className="save-evaluation-btn">
                💾 Lưu đánh giá
              </button>
              <button 
                onClick={() => setIsEvaluating(false)} 
                className="cancel-evaluation-btn"
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Job Management Component
  const JobManagement = ({ jobs, onUpdateJobs, currentUser }) => {
    const [newJob, setNewJob] = useState({
      deliveryDate: '',
      department: currentUser?.department || '',
      description: '',
      completionTime: '',
      status: '',
      jobType: 'management',
      assignee: '',
      assigner: currentUser?.fullName || '',
      completionEvidence: [] // Array of uploaded files
    });
    const [isAdding, setIsAdding] = useState(false);
    const [filters, setFilters] = useState({
      department: '',
      status: '',
      search: '',
      timeRange: 'all' // all, week, month, quarter, year
    });
    const [uploadingFiles, setUploadingFiles] = useState({});
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    // Lọc jobs theo bộ phận của user (trừ admin)
    const getFilteredJobsByDepartment = () => {
      if (currentUser?.role === 'admin') {
        return jobs; // Admin thấy tất cả
      }
      
      // Tổ trưởng: chỉ thấy công việc được giao cho mình hoặc bộ phận mình
      if (currentUser?.position === 'Tổ trưởng') {
        return jobs.filter(job => 
          job.department === currentUser?.department && 
          (job.assignee === currentUser?.fullName || !job.assignee)
        );
      }
      
      // Tổ phó và nhân viên: chỉ thấy công việc được giao cho mình hoặc bộ phận mình
      if (currentUser?.position === 'Tổ phó' || currentUser?.position === 'Nhân viên') {
        return jobs.filter(job => 
          job.department === currentUser?.department && 
          (job.assignee === currentUser?.fullName || !job.assignee)
        );
      }
      
      return jobs;
    };

    const departments = [
      'Kho Phôi', 'Sản Xuất', 'Đóng gói',
      'Kho & Trải Cắt', 'Quản lý'
    ];

    const statusOptions = ['nhận việc', 'đang xử lý', 'chờ duyệt', 'thành công', 'thất bại'];

    // Filter jobs based on current filters (sau khi đã lọc theo bộ phận)
    const departmentFilteredJobs = getFilteredJobsByDepartment();
    
    // Filter by time range
    const getTimeFilteredJobs = (jobs) => {
      if (filters.timeRange === 'all') return jobs;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      return jobs.filter(job => {
        if (!job.deliveryDate) return false;
        const jobDate = new Date(job.deliveryDate);
        const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
        
        switch (filters.timeRange) {
          case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return jobDateOnly >= weekStart && jobDateOnly <= weekEnd;
            
          case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return jobDateOnly >= monthStart && jobDateOnly <= monthEnd;
            
          case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
            const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 0);
            return jobDateOnly >= quarterStart && jobDateOnly <= quarterEnd;
            
          case 'year':
            const yearStart = new Date(today.getFullYear(), 0, 1);
            const yearEnd = new Date(today.getFullYear(), 11, 31);
            return jobDateOnly >= yearStart && jobDateOnly <= yearEnd;
            
          default:
            return true;
        }
      });
    };
    
    const timeFilteredJobs = getTimeFilteredJobs(departmentFilteredJobs);
    const filteredJobs = timeFilteredJobs.filter(job => {
      const matchesDepartment = !filters.department || job.department === filters.department;
      const matchesStatus = !filters.status || job.status === filters.status;
      const matchesSearch = !filters.search || 
        job.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.department.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesDepartment && matchesStatus && matchesSearch;
    });

    const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
        [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
        status: '',
      search: '',
      timeRange: 'all'
    });
  };

  // File upload functions
  const handleFileUpload = async (jobId, files) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      console.error('❌ Không tìm thấy công việc với ID:', jobId);
      alert('❌ Không tìm thấy công việc. Vui lòng thử lại.');
      return;
    }

    if (!files || files.length === 0) {
      console.error('❌ Không có file nào được chọn');
      alert('❌ Vui lòng chọn file để upload.');
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [jobId]: true }));

    try {
      console.log(`📤 Bắt đầu upload ${files.length} file(s) cho công việc ${jobId}`);
      
      // Test server connection first
      const serverOk = await testServerConnection();
      if (!serverOk) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra server có đang chạy không.');
      }
      
      // Validate file types and sizes
      const maxFileSize = 50 * 1024 * 1024; // 50MB (phù hợp với server limit)
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'
      ];
      
      for (let file of files) {
        if (file.size > maxFileSize) {
          throw new Error(`File ${file.name} quá lớn (tối đa 50MB)`);
        }
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận hình ảnh và video.`);
        }
      }

      // Convert files to base64 for storage
      const filePromises = Array.from(files).map((file, index) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            console.log(`✅ Đã đọc file ${index + 1}/${files.length}: ${file.name}`);
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result,
              uploadDate: new Date().toISOString()
            });
          };
          reader.onerror = (error) => {
            console.error(`❌ Lỗi đọc file ${file.name}:`, error);
            reject(new Error(`Lỗi đọc file ${file.name}`));
          };
          reader.readAsDataURL(file);
        });
      });

      const uploadedFiles = await Promise.all(filePromises);
      console.log(`✅ Đã convert ${uploadedFiles.length} file(s) thành base64`);
      
      // Update job with new evidence
      const updatedJobs = jobs.map(j => 
        j.id === jobId 
          ? { 
              ...j, 
              completionEvidence: [...(j.completionEvidence || []), ...uploadedFiles],
              status: 'thành công' // Auto-complete when evidence is uploaded
            }
          : j
      );
      
      console.log('💾 Đang lưu dữ liệu vào server...');
      
      // Save to server
      const currentApiBase = window.API_BASE || API_BASE;
      const response = await fetch(`${currentApiBase}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs: updatedJobs }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Server response:', result);
        onUpdateJobs(updatedJobs);
        alert(`✅ Đã upload ${uploadedFiles.length} file(s) và cập nhật trạng thái thành "thành công"`);
      } else {
        const errorText = await response.text();
        console.error('❌ Server error response:', response.status, errorText);
        throw new Error(`Server trả về lỗi ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ Lỗi upload file chi tiết:', error);
      alert(`❌ Lỗi khi upload file: ${error.message || 'Vui lòng thử lại.'}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const removeEvidence = async (jobId, evidenceIndex) => {
    try {
      const updatedJobs = jobs.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              completionEvidence: job.completionEvidence.filter((_, index) => index !== evidenceIndex)
            }
          : job
      );
      
      // Save to server
      const currentApiBase = window.API_BASE || API_BASE;
      const response = await fetch(`${currentApiBase}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs: updatedJobs }),
      });

      if (response.ok) {
        onUpdateJobs(updatedJobs);
        alert('✅ Đã xóa bằng chứng thành công');
      } else {
        throw new Error('Lỗi khi lưu dữ liệu vào server');
      }
    } catch (error) {
      console.error('❌ Lỗi xóa bằng chứng:', error);
      alert('❌ Lỗi khi xóa bằng chứng. Vui lòng thử lại.');
    }
  };

  const openEvidenceModal = (job) => {
    setSelectedJob(job);
    setShowEvidenceModal(true);
  };


    const handleAddJob = async () => {
      if (!newJob.description || !newJob.deliveryDate || !newJob.assignee) {
        alert('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      try {
      const job = {
        id: Date.now(),
        ...newJob
      };

      const updatedJobs = [...jobs, job];
        
        // Save to server
        const response = await fetch(`${API_BASE}/api/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobs: updatedJobs }),
        });

        if (response.ok) {
      onUpdateJobs(updatedJobs);
          alert('✅ Đã thêm công việc thành công');
      
      setNewJob({
        deliveryDate: '',
        department: currentUser?.department || '',
        description: '',
        completionTime: '',
        status: '',
            jobType: 'management',
            assignee: '',
            assigner: currentUser?.fullName || '',
            completionEvidence: []
      });
      setIsAdding(false);
        } else {
          throw new Error('Lỗi khi lưu dữ liệu vào server');
        }
      } catch (error) {
        console.error('❌ Lỗi thêm công việc:', error);
        alert('❌ Lỗi khi thêm công việc. Vui lòng thử lại.');
      }
    };

    const handleDeleteJob = async (id) => {
      // Chỉ Admin mới được xóa công việc
      if (currentUser?.role !== 'admin') {
        alert('Chỉ Quản lý mới có quyền xóa công việc!');
        return;
      }
      
      if (confirm('Bạn có chắc muốn xóa công việc này?')) {
        try {
        const updatedJobs = jobs.filter(job => job.id !== id);
          
          // Save to server
          const response = await fetch(`${API_BASE}/api/jobs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobs: updatedJobs }),
          });

          if (response.ok) {
        onUpdateJobs(updatedJobs);
            alert('✅ Đã xóa công việc thành công');
          } else {
            throw new Error('Lỗi khi lưu dữ liệu vào server');
          }
        } catch (error) {
          console.error('❌ Lỗi xóa công việc:', error);
          alert('❌ Lỗi khi xóa công việc. Vui lòng thử lại.');
        }
      }
    };

    const handleUpdateJob = async (id, field, value) => {
      const job = jobs.find(j => j.id === id);
      
      // Không cho phép chỉnh sửa công việc đã hoàn thành
      if (job && job.status === 'thành công') {
        alert('Không thể chỉnh sửa công việc đã hoàn thành!');
        return;
      }
      
      // Chỉ cho phép thay đổi trạng thái nếu không phải admin hoặc tổ trưởng
      if (currentUser?.role !== 'admin' && currentUser?.position !== 'Tổ trưởng' && field !== 'status') {
        alert('Bạn chỉ được phép thay đổi trạng thái công việc!');
        return;
      }
      
      try {
      const updatedJobs = jobs.map(job => 
        job.id === id ? { ...job, [field]: value } : job
      );
        
        // Save to server
        const response = await fetch(`${API_BASE}/api/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobs: updatedJobs }),
        });

        if (response.ok) {
      onUpdateJobs(updatedJobs);
        } else {
          throw new Error('Lỗi khi lưu dữ liệu vào server');
        }
      } catch (error) {
        console.error('❌ Lỗi cập nhật công việc:', error);
        alert('❌ Lỗi khi cập nhật công việc. Vui lòng thử lại.');
      }
    };

    return (
      <div className="job-management">
        <div className="job-header">
          <h2>📋 Quản lý công việc</h2>
          <div className="header-actions">
            <button 
              onClick={testServerConnection}
              className="test-connection-btn"
              title="Kiểm tra kết nối server"
            >
              🔍 Test Server
            </button>
            <button className="check-overdue-btn" onClick={checkAndUpdateOverdueJobs}>
              ⚠️ Kiểm tra trễ hạn
            </button>
            {(currentUser?.role === 'admin' || currentUser?.position === 'Tổ trưởng') && (
              <button 
                className="add-btn"
                onClick={() => setIsAdding(true)}
              >
                ➕ Thêm công việc
              </button>
            )}
          </div>
        </div>

        {/* Quick Time Filters */}
        <div className="quick-actions">
          <button 
            className={`quick-action-btn ${filters.timeRange === 'week' ? 'active' : ''}`}
            onClick={() => handleFilterChange('timeRange', 'week')}
          >
            📅 Tuần này
          </button>
          <button 
            className={`quick-action-btn ${filters.timeRange === 'month' ? 'active' : ''}`}
            onClick={() => handleFilterChange('timeRange', 'month')}
          >
            📆 Tháng này
          </button>
          <button 
            className={`quick-action-btn ${filters.timeRange === 'quarter' ? 'active' : ''}`}
            onClick={() => handleFilterChange('timeRange', 'quarter')}
          >
            📊 Quý này
          </button>
          <button 
            className={`quick-action-btn ${filters.timeRange === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('timeRange', 'all')}
          >
            🗓️ Tất cả
          </button>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-group">
              <label>🔍 Tìm kiếm:</label>
              <input
                type="text"
                placeholder="Nhập từ khóa..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>🏢 Bộ phận:</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả bộ phận</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>📊 Trạng thái:</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả trạng thái</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>📅 Thời gian:</label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm này</option>
              </select>
            </div>
            
            <div className="filter-actions">
              <button 
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                🗑️ Xóa bộ lọc
              </button>
          <span className="filter-count">
            Hiển thị: {filteredJobs.length}/{timeFilteredJobs.length} công việc
            {filters.timeRange !== 'all' && (
              <span className="time-info">
                {filters.timeRange === 'week' && ' (Tuần này)'}
                {filters.timeRange === 'month' && ' (Tháng này)'}
                {filters.timeRange === 'quarter' && ' (Quý này)'}
                {filters.timeRange === 'year' && ' (Năm này)'}
              </span>
            )}
            {currentUser?.role !== 'admin' && (
              <span className="department-info"> (Bộ phận: {currentUser?.department})</span>
            )}
            {currentUser?.position === 'Tổ phó' || currentUser?.position === 'Nhân viên' ? (
              <span className="permission-info"> - Chỉ thấy công việc được giao cho mình</span>
            ) : currentUser?.position === 'Tổ trưởng' ? (
              <span className="permission-info"> - Chỉ thấy công việc được giao cho mình</span>
            ) : null}
          </span>
            </div>
          </div>
        </div>

        {isAdding && (
          <div className="add-job-form">
            <h3>Thêm công việc mới</h3>
            <div className="form-row">
              <input
                type="date"
                placeholder="Ngày giao việc"
                value={newJob.deliveryDate}
                onChange={(e) => setNewJob({...newJob, deliveryDate: e.target.value})}
              />
              <select
                value={newJob.department}
                onChange={(e) => setNewJob({...newJob, department: e.target.value})}
              >
                <option value="">Chọn bộ phận</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Mô tả công việc"
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
              />
              <select
                value={newJob.assignee}
                onChange={(e) => setNewJob({...newJob, assignee: e.target.value})}
                className="job-select"
              >
                <option value="">Chọn người nhận việc</option>
                {users.filter(user => user.department === newJob.department).map(user => (
                  <option key={user.id} value={user.fullName}>
                    {user.fullName} ({user.position})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <input
                type="date"
                placeholder="Thời gian hoàn thành"
                value={newJob.completionTime}
                onChange={(e) => setNewJob({...newJob, completionTime: e.target.value})}
              />
            </div>
            <div className="form-row">
              <select
                value={newJob.status}
                onChange={(e) => setNewJob({...newJob, status: e.target.value})}
              >
                <option value="">Chọn trạng thái</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button onClick={handleAddJob} className="save-btn">
                💾 Lưu
              </button>
              <button onClick={() => setIsAdding(false)} className="cancel-btn">
                ❌ Hủy
              </button>
            </div>
          </div>
        )}

        <div className="job-list">
          <div className="job-item header">
            <div>📅 Ngày giao</div>
            <div>🏢 Bộ phận</div>
            <div>📝 Mô tả</div>
            <div>👤 Người giao</div>
            <div>🎯 Người nhận</div>
            <div>⏰ Thời gian</div>
            <div>📊 Trạng thái</div>
            <div>📎 Bằng chứng</div>
            <div>⚙️ Thao tác</div>
          </div>
          {filteredJobs.map(job => {
            const isCompleted = job.status === 'thành công';
            const canDelete = currentUser?.role === 'admin';
            const canEdit = currentUser?.role === 'admin' || currentUser?.position === 'Tổ trưởng';
            
            return (
              <div key={job.id} className={`job-item ${isCompleted ? 'completed' : ''}`}>
                <div data-label="Ngày giao">
                  <input
                    type="date"
                    value={job.deliveryDate}
                    onChange={(e) => handleUpdateJob(job.id, 'deliveryDate', e.target.value)}
                    className="job-input"
                    disabled={isCompleted || !canEdit}
                  />
                </div>
                <div data-label="Bộ phận">
                  <select
                    value={job.department}
                    onChange={(e) => handleUpdateJob(job.id, 'department', e.target.value)}
                    className="job-select"
                    disabled={isCompleted || !canEdit}
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div data-label="Mô tả">
                  <input
                    type="text"
                    value={job.description}
                    onChange={(e) => handleUpdateJob(job.id, 'description', e.target.value)}
                    className="job-input"
                    disabled={isCompleted || !canEdit}
                  />
                </div>
                <div data-label="Người giao">
                  <input
                    type="text"
                    value={job.assigner || ''}
                    onChange={(e) => handleUpdateJob(job.id, 'assigner', e.target.value)}
                    className="job-input"
                    disabled={isCompleted || !canEdit}
                    placeholder="Người giao việc"
                  />
                </div>
                <div data-label="Người nhận">
                  <select
                    value={job.assignee || ''}
                    onChange={(e) => handleUpdateJob(job.id, 'assignee', e.target.value)}
                    className="job-select"
                    disabled={isCompleted || !canEdit}
                  >
                    <option value="">Chọn người nhận việc</option>
                    {users.filter(user => user.department === job.department).map(user => (
                      <option key={user.id} value={user.fullName}>
                        {user.fullName} ({user.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div data-label="Thời gian">
                  <input
                    type="date"
                    value={job.completionTime}
                    onChange={(e) => handleUpdateJob(job.id, 'completionTime', e.target.value)}
                    className="job-input"
                    disabled={isCompleted || !canEdit}
                  />
                </div>
                <div data-label="Trạng thái">
                  <select
                    value={job.status}
                    onChange={(e) => handleUpdateJob(job.id, 'status', e.target.value)}
                    className="job-select"
                    disabled={isCompleted}
                  >
                    <option value="">Chọn trạng thái</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status === 'nhận việc' ? '📋 Nhận việc' :
                         status === 'đang xử lý' ? '⏳ Đang xử lý' :
                         status === 'chờ duyệt' ? '⏸️ Chờ duyệt' :
                         status === 'thành công' ? '✅ Thành công' :
                         status === 'thất bại' ? '❌ Thất bại' : status}
                      </option>
                    ))}
                  </select>
                </div>
                <div data-label="Bằng chứng">
                  <div className="evidence-section">
                    {job.completionEvidence && job.completionEvidence.length > 0 ? (
                      <div className="evidence-preview">
                        <span className="evidence-count">
                          📎 {job.completionEvidence.length} file(s)
                        </span>
                        <button 
                          className="view-evidence-btn"
                          onClick={() => openEvidenceModal(job)}
                          title="Xem bằng chứng"
                        >
                          👁️
                        </button>
                      </div>
                    ) : (
                      <div className="upload-section">
                        <input
                          type="file"
                          id={`upload-${job.id}`}
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => handleFileUpload(job.id, e.target.files)}
                          className="file-input"
                          disabled={uploadingFiles[job.id]}
                          title="Chọn hình ảnh hoặc video (tối đa 50MB mỗi file)"
                        />
                        <label 
                          htmlFor={`upload-${job.id}`}
                          className={`upload-btn ${uploadingFiles[job.id] ? 'uploading' : ''}`}
                        >
                          {uploadingFiles[job.id] ? '⏳ Uploading...' : '📤 Upload'}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div data-label="Thao tác">
                  {canDelete ? (
                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      className="delete-btn"
                    >
                      🗑️ Xóa
                    </button>
                  ) : (
                    <span className="no-permission">❌ Không có quyền</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
          <div className="modal-content evidence-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📎 Bằng chứng hoàn thành: {selectedJob.description}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEvidenceModal(false)}
              >
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <div className="job-info">
                <p><strong>Bộ phận:</strong> {selectedJob.department}</p>
                <p><strong>Người thực hiện:</strong> {selectedJob.assignee}</p>
                <p><strong>Ngày giao:</strong> {new Date(selectedJob.deliveryDate).toLocaleDateString('vi-VN')}</p>
                <p><strong>Hạn hoàn thành:</strong> {selectedJob.completionTime}</p>
              </div>
              
              <div className="evidence-gallery">
                {selectedJob.completionEvidence && selectedJob.completionEvidence.length > 0 ? (
                  selectedJob.completionEvidence.map((evidence, index) => (
                    <div key={index} className="evidence-item">
                      <div className="evidence-header">
                        <span className="evidence-name">{evidence.name}</span>
                        <div className="evidence-actions">
                          <span className="evidence-size">
                            {(evidence.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <button 
                            className="remove-evidence-btn"
                            onClick={() => removeEvidence(selectedJob.id, index)}
                            title="Xóa file"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className="evidence-preview">
                        {evidence.type.startsWith('image/') ? (
                          <img 
                            src={evidence.data} 
                            alt={evidence.name}
                            className="evidence-image"
                            onClick={() => window.open(evidence.data, '_blank')}
                          />
                        ) : evidence.type.startsWith('video/') ? (
                          <video 
                            src={evidence.data}
                            controls
                            className="evidence-video"
                          >
                            Trình duyệt không hỗ trợ video
                          </video>
                        ) : (
                          <div className="evidence-file">
                            <div className="file-icon">📄</div>
                            <div className="file-name">{evidence.name}</div>
                            <a 
                              href={evidence.data} 
                              download={evidence.name}
                              className="download-btn"
                            >
                              📥 Tải xuống
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="evidence-meta">
                        <span className="upload-date">
                          📅 {new Date(evidence.uploadDate).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-evidence">
                    <p>📭 Chưa có bằng chứng nào được upload</p>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <input
                  type="file"
                  id="modal-upload"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    handleFileUpload(selectedJob.id, e.target.files);
                    e.target.value = ''; // Reset input
                  }}
                  className="file-input"
                  disabled={uploadingFiles[selectedJob.id]}
                  title="Chọn hình ảnh hoặc video (tối đa 50MB mỗi file)"
                />
                <label 
                  htmlFor="modal-upload"
                  className={`upload-btn modal-upload-btn ${uploadingFiles[selectedJob.id] ? 'uploading' : ''}`}
                >
                  {uploadingFiles[selectedJob.id] ? '⏳ Đang upload...' : '📤 Thêm bằng chứng'}
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  // User Management Component
  const UserManagement = ({ users, onUpdateUsers, currentUser }) => {
    const [newUser, setNewUser] = useState({
      username: '',
      password: '',
      fullName: '',
      department: currentUser?.department || '',
      position: '',
      role: 'user'
    });
    const [isAdding, setIsAdding] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editUser, setEditUser] = useState({
      username: '',
      password: '',
      fullName: '',
      department: '',
      position: '',
      role: 'user'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [showPasswords, setShowPasswords] = useState({});

    // Lọc users theo bộ phận của user (trừ admin)
    const getFilteredUsersByDepartment = () => {
      if (currentUser?.role === 'admin') {
        return users; // Admin thấy tất cả
      }
      return users.filter(user => user.department === currentUser?.department);
    };

    const departments = [
      'Kho Phôi', 'Sản Xuất', 'Đóng gói',
      'Kho & Trải Cắt', 'Quản lý'
    ];

    const positions = ['Quản lý', 'Tổ trưởng', 'Tổ phó', 'Nhân viên'];

    // Filter users based on search and department (sau khi đã lọc theo bộ phận)
    const departmentFilteredUsers = getFilteredUsersByDepartment();
    const filteredUsers = departmentFilteredUsers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || user.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });

    const totalUsers = departmentFilteredUsers.length;
    const filteredCount = filteredUsers.length;

    const togglePasswordVisibility = (userId) => {
      setShowPasswords(prev => ({
        ...prev,
        [userId]: !prev[userId]
      }));
    };

    const handleAddUser = () => {
      if (!newUser.username || !newUser.password || !newUser.fullName) {
        alert('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      const user = {
        id: Date.now(),
        ...newUser
      };

      const updatedUsers = [...users, user];
      onUpdateUsers(updatedUsers);
      
      setNewUser({
        username: '',
        password: '',
        fullName: '',
        department: '',
        position: '',
        role: 'user'
      });
      setIsAdding(false);
    };

    const handleDeleteUser = (id) => {
      if (id === currentUser.id) {
        alert('Không thể xóa tài khoản đang đăng nhập');
        return;
      }
      
      if (confirm('Bạn có chắc muốn xóa người dùng này?')) {
        const updatedUsers = users.filter(user => user.id !== id);
        onUpdateUsers(updatedUsers);
      }
    };

    const handleEditUser = (user) => {
      setEditingUser(user.id);
      setEditUser({
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        department: user.department,
        position: user.position,
        role: user.role
      });
    };

    const handleSaveEdit = () => {
      if (!editUser.username || !editUser.fullName) {
        alert('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      const updatedUsers = users.map(user => 
        user.id === editingUser ? { ...user, ...editUser } : user
      );
      onUpdateUsers(updatedUsers);
      setEditingUser(null);
      setEditUser({
        username: '',
        password: '',
        fullName: '',
        department: '',
        position: '',
        role: 'user'
      });
    };

    const handleCancelEdit = () => {
      setEditingUser(null);
      setEditUser({
        username: '',
        password: '',
        fullName: '',
        department: '',
        position: '',
        role: 'user'
      });
    };

  return (
      <div className="user-management">
        <div className="user-header">
            <div className="header-info">
            <h2>👥 Quản lý người dùng</h2>
            <div className="user-stats">
              <span className="total-users">Tổng: {totalUsers} người dùng</span>
              <span className="filtered-users">Hiển thị: {filteredCount}/{totalUsers}</span>
              {currentUser?.role !== 'admin' && (
                <span className="department-info"> (Bộ phận: {currentUser?.department})</span>
              )}
            </div>
              </div>
          {(currentUser?.role === 'admin' || currentUser?.position === 'Tổ trưởng') && (
            <button 
              className="add-btn"
              onClick={() => setIsAdding(true)}
            >
              ➕ Thêm người dùng
            </button>
          )}
            </div>

        <div className="user-filters">
          <div className="filter-group">
            <label>🔍 Tìm kiếm:</label>
            <input
              type="text"
              placeholder="Nhập tên, username hoặc bộ phận..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            </div>
          
          <div className="filter-group">
            <label>🏢 Bộ phận:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="department-select"
            >
              <option value="">Tất cả bộ phận</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
          <button 
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('');
              }}
              className="clear-filters-btn"
            >
              🗑️ Xóa bộ lọc
          </button>
          </div>
        </div>

        {isAdding && (
          <div className="add-user-form">
            <h3>Thêm người dùng mới</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Họ tên"
                value={newUser.fullName}
                onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
              />
              <select
                value={newUser.department}
                onChange={(e) => setNewUser({...newUser, department: e.target.value})}
              >
                <option value="">Chọn bộ phận</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <select
                value={newUser.position}
                onChange={(e) => setNewUser({...newUser, position: e.target.value})}
              >
                <option value="">Chọn vị trí</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
            <div className="form-actions">
              <button onClick={handleAddUser} className="save-btn">
                💾 Lưu
            </button>
              <button onClick={() => setIsAdding(false)} className="cancel-btn">
                ❌ Hủy
              </button>
            </div>
          </div>
        )}

        <div className="user-list">
          <div className="user-item header">
            <div>Họ tên</div>
            <div>Tên đăng nhập</div>
            <div>Mật khẩu</div>
            <div>Bộ phận</div>
            <div>Vị trí</div>
            <div>Quyền</div>
            <div>Thao tác</div>
          </div>
          {filteredUsers.map(user => (
            <div key={user.id} className="user-item">
              {editingUser === user.id ? (
                <>
                  <div data-label="Họ tên">
                    <input
                      type="text"
                      value={editUser.fullName}
                      onChange={(e) => setEditUser({...editUser, fullName: e.target.value})}
                      className="edit-input"
                    />
                  </div>
                  <div data-label="Tên đăng nhập">
                    <input
                      type="text"
                      value={editUser.username}
                      onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                      className="edit-input"
                    />
                  </div>
                  <div data-label="Mật khẩu">
                    <input
                      type="password"
                      value={editUser.password}
                      onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                      className="edit-input"
                      placeholder="Mật khẩu mới"
                    />
                  </div>
                  <div data-label="Bộ phận">
                    <select
                      value={editUser.department}
                      onChange={(e) => setEditUser({...editUser, department: e.target.value})}
                      className="edit-select"
                    >
                      <option value="">Chọn bộ phận</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div data-label="Vị trí">
                    <select
                      value={editUser.position}
                      onChange={(e) => setEditUser({...editUser, position: e.target.value})}
                      className="edit-select"
                    >
                      <option value="">Chọn vị trí</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div data-label="Quyền">
                    <select
                      value={editUser.role}
                      onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                      className="edit-select"
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                  <div data-label="Thao tác">
                    <button onClick={handleSaveEdit} className="save-btn">
                      💾 Lưu
                    </button>
                    <button onClick={handleCancelEdit} className="cancel-btn">
                      ❌ Hủy
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div data-label="Họ tên">{user.fullName}</div>
                  <div data-label="Tên đăng nhập">{user.username}</div>
                  <div data-label="Mật khẩu" className="password-display">
                    <span className="password-text">
                      {showPasswords[user.id] ? user.password : '••••••••'}
                    </span>
                    <button 
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility(user.id)}
                      title={showPasswords[user.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPasswords[user.id] ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div data-label="Bộ phận">{user.department}</div>
                  <div data-label="Vị trí">{user.position}</div>
                  <div data-label="Quyền">{user.role === 'admin' ? 'Quản trị' : 'Người dùng'}</div>
                  <div data-label="Thao tác">
                    {(currentUser?.role === 'admin' || currentUser?.position === 'Tổ trưởng') && (
                      <>
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="edit-btn"
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="delete-btn"
                          disabled={user.id === currentUser.id}
                        >
                          🗑️ Xóa
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
  };

  // Render
  if (!isAuthenticated) {
    return <LoginForm />;
}

  return <MainApp />;
}

export default App;