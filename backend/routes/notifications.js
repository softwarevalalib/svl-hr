const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { notifyUser, sendEmail } = require('../services/emailService');

router.use(authenticate);

router.get('/', (req, res) => {
  const db = req.app.get('db');
  db.all(
    `SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, data: rows });
    }
  );
});

router.get('/unread-count', (req, res) => {
  const db = req.app.get('db');
  db.get(
    `SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND status = 'Unread'`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, count: row?.count || 0 });
    }
  );
});

router.put('/read-all', (req, res) => {
  const db = req.app.get('db');
  db.run(
    `UPDATE Notifications SET status = 'Read' WHERE user_id = ? AND status = 'Unread'`,
    [req.user.id],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    }
  );
});

router.put('/:id/read', (req, res) => {
  const db = req.app.get('db');
  db.run(
    `UPDATE Notifications SET status = 'Read' WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    }
  );
});

router.post('/test-email', async (req, res) => {
  const { to, subject, message } = req.body;
  try {
    const result = await sendEmail({
      to: to || req.user.email,
      subject: subject || 'SVL HRM test notification',
      text: message || 'This is a test email from SVL HRM.',
    });
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
module.exports.notifyUser = notifyUser;
