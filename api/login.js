const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load users data
const loadUsers = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({
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
});

module.exports = app;
