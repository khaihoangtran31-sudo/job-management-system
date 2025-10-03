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
    const evaluationsPath = path.join(__dirname, '../data/kpi_evaluations.json');
    const evaluationsData = fs.readFileSync(evaluationsPath, 'utf8');
    const evaluations = JSON.parse(evaluationsData);
    
    if (req.method === 'GET') {
      res.status(200).json(evaluations);
    } else if (req.method === 'POST') {
      const newEvaluation = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      evaluations.push(newEvaluation);
      
      fs.writeFileSync(evaluationsPath, JSON.stringify(evaluations, null, 2));
      res.status(200).json(newEvaluation);
    } else if (req.method === 'PUT') {
      const evaluationId = parseInt(req.query.id || req.body.id);
      const evaluationIndex = evaluations.findIndex(e => e.id === evaluationId);
      
      if (evaluationIndex !== -1) {
        evaluations[evaluationIndex] = { ...evaluations[evaluationIndex], ...req.body };
        fs.writeFileSync(evaluationsPath, JSON.stringify(evaluations, null, 2));
        res.status(200).json(evaluations[evaluationIndex]);
      } else {
        res.status(404).json({ error: 'Không tìm thấy đánh giá' });
      }
    } else if (req.method === 'DELETE') {
      const evaluationId = parseInt(req.query.id);
      const filteredEvaluations = evaluations.filter(e => e.id !== evaluationId);
      
      fs.writeFileSync(evaluationsPath, JSON.stringify(filteredEvaluations, null, 2));
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('KPI Evaluations API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
