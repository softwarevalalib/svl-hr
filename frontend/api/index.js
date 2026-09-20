// Vercel serverless entry (Root Directory = frontend)
try {
  module.exports = require('../backend/server');
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
