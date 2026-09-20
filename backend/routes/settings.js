const express = require('express');
const router = express.Router();
const { authenticate, requirePermission, requireAnyPermission } = require('../middleware/auth');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BRANDING_KEYS = ['company_logo', 'login_background', 'company_name'];

function getBranding(db, callback) {
  db.all(
    `SELECT name, value FROM Settings WHERE name IN ('company_logo', 'login_background', 'company_name')`,
    [],
    (err, rows) => {
      if (err) return callback(err);
      const map = {};
      (rows || []).forEach((r) => {
        map[r.name] = r.value;
      });
      callback(null, {
        company_name: map.company_name || 'SVL HRM',
        company_logo: map.company_logo || null,
        login_background: map.login_background || null,
      });
    }
  );
}

function upsertSetting(db, name, value, description) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Settings (name, value, description, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(name) DO UPDATE SET value = excluded.value,
         description = COALESCE(excluded.description, Settings.description),
         updated_at = CURRENT_TIMESTAMP`,
      [name, value, description || null],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

router.use(authenticate);

router.get('/work-schedule', requireAnyPermission('settings.manage', 'attendance.view', 'attendance.self'), (req, res) => {
  const db = req.app.get('db');
  db.all('SELECT * FROM WorkSchedules ORDER BY day_of_week', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    const data = (rows || []).map((r) => ({ ...r, day_name: DAY_NAMES[r.day_of_week] }));
    res.json({ success: true, data });
  });
});

router.put('/work-schedule', requirePermission('settings.manage'), (req, res) => {
  const db = req.app.get('db');
  const { schedules } = req.body;
  if (!Array.isArray(schedules) || !schedules.length) {
    return res.status(400).json({ success: false, message: 'schedules array is required' });
  }

  let done = 0;
  let hasError = false;
  schedules.forEach((s) => {
    db.run(
      `INSERT INTO WorkSchedules (day_of_week, is_workday, sign_in_time, sign_out_time, grace_minutes, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(day_of_week) DO UPDATE SET
         is_workday = excluded.is_workday,
         sign_in_time = excluded.sign_in_time,
         sign_out_time = excluded.sign_out_time,
         grace_minutes = excluded.grace_minutes,
         updated_at = CURRENT_TIMESTAMP`,
      [
        s.day_of_week,
        s.is_workday ? 1 : 0,
        s.sign_in_time || '09:00',
        s.sign_out_time || '17:00',
        s.grace_minutes != null ? s.grace_minutes : 15,
      ],
      (err) => {
        if (err && !hasError) {
          hasError = true;
          return res.status(500).json({ success: false, message: err.message });
        }
        done++;
        if (done === schedules.length && !hasError) {
          res.json({ success: true, message: 'Work schedule updated' });
        }
      }
    );
  });
});

router.get('/branding', requirePermission('settings.manage'), (req, res) => {
  const db = req.app.get('db');
  getBranding(db, (err, data) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data });
  });
});

router.put('/branding', requirePermission('settings.manage'), async (req, res) => {
  const db = req.app.get('db');
  const { company_name, company_logo, login_background, clear_logo, clear_background } = req.body || {};

  try {
    if (company_name !== undefined) {
      await upsertSetting(db, 'company_name', String(company_name).slice(0, 120), 'Company display name');
    }
    if (clear_logo) {
      await upsertSetting(db, 'company_logo', '', 'Company logo (data URL)');
    } else if (company_logo !== undefined) {
      if (company_logo && !String(company_logo).startsWith('data:image/')) {
        return res.status(400).json({ success: false, message: 'company_logo must be an image data URL' });
      }
      if (company_logo && company_logo.length > 4_500_000) {
        return res.status(400).json({ success: false, message: 'Logo too large (max ~3MB)' });
      }
      await upsertSetting(db, 'company_logo', company_logo || '', 'Company logo (data URL)');
    }
    if (clear_background) {
      await upsertSetting(db, 'login_background', '', 'Login page background (data URL)');
    } else if (login_background !== undefined) {
      if (login_background && !String(login_background).startsWith('data:image/')) {
        return res.status(400).json({ success: false, message: 'login_background must be an image data URL' });
      }
      if (login_background && login_background.length > 6_500_000) {
        return res.status(400).json({ success: false, message: 'Background too large (max ~5MB)' });
      }
      await upsertSetting(db, 'login_background', login_background || '', 'Login page background (data URL)');
    }

    getBranding(db, (err, data) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Branding saved', data });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/', requirePermission('settings.manage'), (req, res) => {
  const db = req.app.get('db');
  db.all('SELECT * FROM Settings ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    // Omit huge binary fields from generic list
    const data = (rows || []).map((r) =>
      BRANDING_KEYS.includes(r.name) && r.value && r.value.length > 200
        ? { ...r, value: `[image ${Math.round(r.value.length / 1024)}KB]` }
        : r
    );
    res.json({ success: true, data });
  });
});

router.put('/:name', requirePermission('settings.manage'), (req, res) => {
  const db = req.app.get('db');
  const { value, description } = req.body;
  db.run(
    `INSERT INTO Settings (name, value, description, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(name) DO UPDATE SET value = excluded.value,
       description = COALESCE(excluded.description, Settings.description),
       updated_at = CURRENT_TIMESTAMP`,
    [req.params.name, value, description || null],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Setting saved' });
    }
  );
});

module.exports = router;
