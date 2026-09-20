// Vercel serverless entry — Express API for /api/*
const hasDbUrl = !!(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim());

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

let app = null;
let loadError = null;

try {
  app = require('../backend/server');
} catch (err) {
  loadError = err;
  console.error('Failed to load API server:', err);
}

module.exports = (req, res) => {
  try {
    if (loadError) {
      return sendJson(res, 500, {
        success: false,
        message: 'API failed to start',
        error: loadError.message || String(loadError),
        hasDATABASE_URL: hasDbUrl,
      });
    }
    if (typeof app === 'function') {
      return app(req, res);
    }
    return sendJson(res, 500, {
      success: false,
      message: 'API app export is invalid',
      hasDATABASE_URL: hasDbUrl,
    });
  } catch (err) {
    console.error('API request failed:', err);
    return sendJson(res, 500, {
      success: false,
      message: 'API request failed',
      error: err.message || String(err),
      hasDATABASE_URL: hasDbUrl,
    });
  }
};
