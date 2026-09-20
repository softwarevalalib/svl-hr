// Vercel serverless entry — Express API at /api/* (repo-root deploys)
try {
  module.exports = require('../frontend/backend/server');
} catch (err) {
  console.error('Failed to load API server:', err);
  module.exports = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: 'API failed to start',
        error: err && err.message ? err.message : String(err),
      })
    );
  };
}
