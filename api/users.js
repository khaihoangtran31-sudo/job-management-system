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

// Save users data
const saveUsers = (users) => {
  try {
    fs.writeFileSync(path.join(__dirname, '../data/users.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    return false;
  }
};

// Get all users
app.get('/api/users', (req, res) => {
  const users = loadUsers();
  res.json(users);
});

// Create new user
app.post('/api/users', (req, res) => {
  const users = loadUsers();
  const newUser = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  if (saveUsers(users)) {
    res.json(newUser);
  } else {
    res.status(500).json({ error: 'Không thể lưu người dùng' });
  }
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const users = loadUsers();
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...req.body };
    
    if (saveUsers(users)) {
      res.json(users[userIndex]);
    } else {
      res.status(500).json({ error: 'Không thể cập nhật người dùng' });
    }
  } else {
    res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const users = loadUsers();
  const userId = parseInt(req.params.id);
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (saveUsers(filteredUsers)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Không thể xóa người dùng' });
  }
});

module.exports = app;
