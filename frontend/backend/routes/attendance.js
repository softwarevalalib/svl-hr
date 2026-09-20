const express = require('express');
const router = express.Router();
const { authenticate, requireAnyPermission, requirePermission } = require('../middleware/auth');

router.use(authenticate);

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function nowISO() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function timeOfDay() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getScheduleForToday(db) {
    return new Promise((resolve, reject) => {
        const dow = new Date().getDay();
        db.get('SELECT * FROM WorkSchedules WHERE day_of_week = ?', [dow], (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });
}

function computeStatus(schedule, inTime, outTime) {
    if (!schedule || !schedule.is_workday) return 'Present';
    const grace = schedule.grace_minutes || 0;
    const [sh, sm] = (schedule.sign_in_time || '09:00').split(':').map(Number);
    const [eh, em] = (schedule.sign_out_time || '17:00').split(':').map(Number);
    const scheduledIn = sh * 60 + sm + grace;
    const scheduledOut = eh * 60 + em;

    let status = 'Present';
    if (inTime) {
        const [ih, im] = inTime.split(':').map(Number);
        const actualIn = ih * 60 + im;
        if (actualIn > scheduledIn) status = 'Late';
    }
    if (outTime) {
        const [oh, om] = outTime.split(':').map(Number);
        const actualOut = oh * 60 + om;
        if (actualOut < scheduledOut - grace) {
            status = status === 'Late' ? 'Late / Early Leave' : 'Early Leave';
        }
    }
    return status;
}

router.get('/my', requireAnyPermission('attendance.self', 'attendance.view', 'attendance.manage'), (req, res) => {
    const db = req.app.get('db');
    const employeeId = req.user.employee_id;
    // Admin / system users often have no employee profile — return empty, not 400.
    if (!employeeId) {
        return res.json({ success: true, data: [] });
    }
    db.all(
        `SELECT a.*, e.first_name || ' ' || e.last_name as employee_name
         FROM Attendance a
         JOIN Employees e ON a.employee_id = e.id
         WHERE a.employee_id = ?
         ORDER BY a.date DESC, a.in_time DESC`,
        [employeeId],
        (err, records) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: records });
        }
    );
});

router.get('/today', requireAnyPermission('attendance.self', 'attendance.view', 'attendance.manage'), async (req, res) => {
    const db = req.app.get('db');
    const employeeId = req.user.employee_id;
    if (!employeeId) {
        return res.json({ success: true, data: null, schedule: null });
    }
    try {
        const schedule = await getScheduleForToday(db);
        db.get(
            'SELECT * FROM Attendance WHERE employee_id = ? AND date = ?',
            [employeeId, todayISO()],
            (err, record) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.json({ success: true, data: record || null, schedule });
            }
        );
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/clock-in', requireAnyPermission('attendance.self', 'attendance.manage'), async (req, res) => {
    const db = req.app.get('db');
    const employeeId = req.user.employee_id;
    if (!employeeId) {
        return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }

    try {
        const schedule = await getScheduleForToday(db);
        const date = todayISO();
        const inTime = timeOfDay();
        const signedInAt = nowISO();
        let status = computeStatus(schedule, inTime, null);
        if (schedule && !schedule.is_workday) {
            status = 'Off Day';
        }
        const { latitude, longitude, note } = req.body || {};

        db.get('SELECT * FROM Attendance WHERE employee_id = ? AND date = ?', [employeeId, date], (err, existing) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (existing && existing.in_time) {
                return res.status(400).json({ success: false, message: 'Already signed in today', data: existing });
            }

            if (existing) {
                db.run(
                    `UPDATE Attendance SET in_time = ?, signed_in_at = ?, status = ?, note = COALESCE(?, note),
                     latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude) WHERE id = ?`,
                    [inTime, signedInAt, status, note, latitude, longitude, existing.id],
                    function (uErr) {
                        if (uErr) return res.status(500).json({ success: false, message: uErr.message });
                        res.json({ success: true, message: 'Signed in', status, in_time: inTime });
                    }
                );
            } else {
                db.run(
                    `INSERT INTO Attendance (employee_id, date, in_time, signed_in_at, status, note, latitude, longitude)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [employeeId, date, inTime, signedInAt, status, note || null, latitude || null, longitude || null],
                    function (iErr) {
                        if (iErr) return res.status(500).json({ success: false, message: iErr.message });
                        res.json({ success: true, message: 'Signed in', id: this.lastID, status, in_time: inTime });
                    }
                );
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/clock-out', requireAnyPermission('attendance.self', 'attendance.manage'), async (req, res) => {
    const db = req.app.get('db');
    const employeeId = req.user.employee_id;
    if (!employeeId) {
        return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }

    try {
        const schedule = await getScheduleForToday(db);
        const date = todayISO();
        const outTime = timeOfDay();
        const signedOutAt = nowISO();
        const { note } = req.body || {};

        db.get('SELECT * FROM Attendance WHERE employee_id = ? AND date = ?', [employeeId, date], (err, existing) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!existing || !existing.in_time) {
                return res.status(400).json({ success: false, message: 'You must sign in before signing out' });
            }
            if (existing.out_time) {
                return res.status(400).json({ success: false, message: 'Already signed out today', data: existing });
            }

            const status = computeStatus(schedule, existing.in_time, outTime);
            db.run(
                `UPDATE Attendance SET out_time = ?, signed_out_at = ?, status = ?, note = COALESCE(?, note) WHERE id = ?`,
                [outTime, signedOutAt, status, note, existing.id],
                function (uErr) {
                    if (uErr) return res.status(500).json({ success: false, message: uErr.message });
                    res.json({ success: true, message: 'Signed out', status, out_time: outTime });
                }
            );
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/', requireAnyPermission('attendance.view', 'attendance.manage', 'attendance.self'), (req, res) => {
    const db = req.app.get('db');
    const { employee_id, date, from, to } = req.query;
    const canManage = (req.permissions || []).includes('attendance.manage') || (req.permissions || []).includes('attendance.view');

    let query = `
        SELECT a.*, e.first_name || ' ' || e.last_name as employee_name
        FROM Attendance a
        JOIN Employees e ON a.employee_id = e.id
        WHERE 1=1
    `;
    const params = [];

    if (!canManage) {
        if (!req.user.employee_id) {
            return res.json({ success: true, data: [] });
        }
        query += ' AND a.employee_id = ?';
        params.push(req.user.employee_id);
    } else if (employee_id) {
        query += ' AND a.employee_id = ?';
        params.push(employee_id);
    }

    if (date) {
        query += ' AND a.date = ?';
        params.push(date);
    }
    if (from) {
        query += ' AND a.date >= ?';
        params.push(from);
    }
    if (to) {
        query += ' AND a.date <= ?';
        params.push(to);
    }

    query += ' ORDER BY a.date DESC, a.in_time DESC';

    db.all(query, params, (err, records) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: records });
    });
});

router.post('/', requirePermission('attendance.manage'), async (req, res) => {
    const db = req.app.get('db');
    const { employee_id, date, in_time, out_time, note, status } = req.body;

    if (!employee_id || !date) {
        return res.status(400).json({ success: false, message: 'Employee ID and date are required' });
    }

    try {
        const schedule = await getScheduleForToday(db);
        const computed = status || computeStatus(schedule, in_time, out_time);
        db.run(
            `INSERT INTO Attendance (employee_id, date, in_time, out_time, note, status, signed_in_at, signed_out_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(employee_id, date) DO UPDATE SET
               in_time = excluded.in_time,
               out_time = excluded.out_time,
               note = excluded.note,
               status = excluded.status`,
            [employee_id, date, in_time, out_time, note, computed, in_time ? `${date} ${in_time}` : null, out_time ? `${date} ${out_time}` : null],
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.json({ success: true, message: 'Attendance recorded', id: this.lastID });
            }
        );
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
