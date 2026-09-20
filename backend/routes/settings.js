const express = require('express');
const router = express.Router();
const { authenticate, requirePermission, requireAnyPermission } = require('../middleware/auth');

router.use(authenticate);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

router.get('/', requirePermission('settings.manage'), (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Settings ORDER BY name', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
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
