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
    const jobsPath = path.join(__dirname, '../data/jobs.json');
    const jobsData = fs.readFileSync(jobsPath, 'utf8');
    const jobs = JSON.parse(jobsData);
    
    if (req.method === 'GET') {
      res.status(200).json(jobs);
    } else if (req.method === 'POST') {
      const newJob = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      jobs.push(newJob);
      
      fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
      res.status(200).json(newJob);
    } else if (req.method === 'PUT') {
      const jobId = parseInt(req.query.id || req.body.id);
      const jobIndex = jobs.findIndex(j => j.id === jobId);
      
      if (jobIndex !== -1) {
        jobs[jobIndex] = { ...jobs[jobIndex], ...req.body };
        fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
        res.status(200).json(jobs[jobIndex]);
      } else {
        res.status(404).json({ error: 'Không tìm thấy công việc' });
      }
    } else if (req.method === 'DELETE') {
      const jobId = parseInt(req.query.id);
      const filteredJobs = jobs.filter(j => j.id !== jobId);
      
      fs.writeFileSync(jobsPath, JSON.stringify(filteredJobs, null, 2));
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Jobs API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
