const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body;
      
      // Load users data
      const usersPath = path.join(__dirname, '../data/users.json');
      const usersData = fs.readFileSync(usersPath, 'utf8');
      const users = JSON.parse(usersData);
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        res.status(200).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            department: user.department,
            role: user.role,
            position: user.position
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Sai tên đăng nhập hoặc mật khẩu'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
};
