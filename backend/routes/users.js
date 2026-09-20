const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requirePermission('users.manage'), (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT u.id, u.username, u.email, u.user_level, u.employee_id, u.is_active, u.created_at,
                e.first_name || ' ' || e.last_name as employee_name,
                GROUP_CONCAT(r.name, ', ') as roles
         FROM Users u
         LEFT JOIN Employees e ON u.employee_id = e.id
         LEFT JOIN UserRoles ur ON ur.user_id = u.id
         LEFT JOIN Roles r ON r.id = ur.role_id
         GROUP BY u.id
         ORDER BY u.created_at DESC`,
        (err, users) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: users });
        }
    );
});

router.get('/:id', requirePermission('users.manage'), (req, res) => {
    const db = req.app.get('db');
    db.get(
        `SELECT id, username, email, user_level, employee_id, is_active, created_at FROM Users WHERE id = ?`,
        [req.params.id],
        (err, user) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            db.all(
                `SELECT r.id, r.name FROM Roles r JOIN UserRoles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
                [user.id],
                (rErr, roles) => {
                    if (rErr) return res.status(500).json({ success: false, message: rErr.message });
                    res.json({ success: true, data: { ...user, roles } });
                }
            );
        }
    );
});

router.post('/', requirePermission('users.manage'), async (req, res) => {
    const db = req.app.get('db');
    const { username, email, password, employee_id, user_level, role_ids, is_active } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(
            `INSERT INTO Users (username, email, password, employee_id, user_level, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, hash, employee_id || null, user_level || 'Employee', is_active === 0 ? 0 : 1],
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                const userId = this.lastID;
                const roles = Array.isArray(role_ids) && role_ids.length ? role_ids : [5];
                let done = 0;
                roles.forEach((roleId) => {
                    db.run('INSERT OR IGNORE INTO UserRoles (user_id, role_id) VALUES (?, ?)', [userId, roleId], () => {
                        done++;
                        if (done === roles.length) {
                            res.json({ success: true, data: { id: userId } });
                        }
                    });
                });
            }
        );
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/:id', requirePermission('users.manage'), (req, res) => {
    const db = req.app.get('db');
    const { email, employee_id, user_level, role_ids, is_active } = req.body;
    const userId = req.params.id;

    db.run(
        `UPDATE Users SET email = COALESCE(?, email),
                        employee_id = COALESCE(?, employee_id),
                        user_level = COALESCE(?, user_level),
                        is_active = COALESCE(?, is_active),
                        updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [email, employee_id, user_level, is_active, userId],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });

            if (!Array.isArray(role_ids)) {
                return res.json({ success: true, message: 'User updated' });
            }

            db.run('DELETE FROM UserRoles WHERE user_id = ?', [userId], () => {
                if (!role_ids.length) {
                    return res.json({ success: true, message: 'User updated' });
                }
                let done = 0;
                role_ids.forEach((roleId) => {
                    db.run('INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)', [userId, roleId], () => {
                        done++;
                        if (done === role_ids.length) {
                            res.json({ success: true, message: 'User updated' });
                        }
                    });
                });
            });
        }
    );
});

router.post('/:id/reset-password', requirePermission('users.manage'), async (req, res) => {
    const db = req.app.get('db');
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(
            'UPDATE Users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hash, req.params.id],
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.json({ success: true, message: 'Password reset' });
            }
        );
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/:id', requirePermission('users.manage'), (req, res) => {
    const db = req.app.get('db');
    if (Number(req.params.id) === Number(req.user.id)) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }
    db.run('UPDATE Users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'User deactivated' });
    });
});

module.exports = router;
