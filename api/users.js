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
  
  try {
    const usersPath = path.join(__dirname, '../data/users.json');
    const usersData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    if (req.method === 'GET') {
      res.status(200).json(users);
    } else if (req.method === 'POST') {
      const newUser = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      res.status(200).json(newUser);
    } else if (req.method === 'PUT') {
      const userId = parseInt(req.query.id || req.body.id);
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...req.body };
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        res.status(200).json(users[userIndex]);
      } else {
        res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
    } else if (req.method === 'DELETE') {
      const userId = parseInt(req.query.id);
      const filteredUsers = users.filter(u => u.id !== userId);
      
      fs.writeFileSync(usersPath, JSON.stringify(filteredUsers, null, 2));
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};