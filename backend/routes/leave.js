const express = require('express');
const router = express.Router();
const { notifyUser } = require('../services/emailService');

// Get leave types
router.get('/types', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM LeaveTypes ORDER BY name', [], (err, types) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching leave types' });
        }
        res.json({ success: true, data: types });
    });
});

// Get leave requests (scoped by permission)
router.get('/', (req, res) => {
    const db = req.app.get('db');
    const { employee_id, status } = req.query;
    const canManage = (req.permissions || []).some((p) => p === 'leave.manage' || p === 'leave.view');

    let query = `
        SELECT lr.*, 
               e.first_name || ' ' || e.last_name as employee_name,
               lt.name as leave_type_name,
               approver.first_name || ' ' || approver.last_name as approved_by_name
        FROM LeaveRequests lr
        JOIN Employees e ON lr.employee_id = e.id
        JOIN LeaveTypes lt ON lr.leave_type_id = lt.id
        LEFT JOIN Employees approver ON lr.approved_by = approver.id
        WHERE 1=1
    `;
    const params = [];

    if (!canManage && req.user?.employee_id) {
        query += ' AND lr.employee_id = ?';
        params.push(req.user.employee_id);
    } else if (employee_id) {
        query += ' AND lr.employee_id = ?';
        params.push(employee_id);
    }

    if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
    }

    query += ' ORDER BY lr.created_at DESC';

    db.all(query, params, (err, requests) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message || 'Error fetching leave requests' });
        }
        res.json({ success: true, data: requests });
    });
});

// Create leave request
router.post('/', (req, res) => {
    const db = req.app.get('db');
    let { employee_id, leave_type_id, date_start, date_end, days, reason } = req.body;

    if (!employee_id && req.user?.employee_id) {
        employee_id = req.user.employee_id;
    }

    if (!employee_id || !leave_type_id || !date_start || !date_end) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    db.run(
        `INSERT INTO LeaveRequests (employee_id, leave_type_id, date_start, date_end, days, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [employee_id, leave_type_id, date_start, date_end, days, reason],
        function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message || 'Error creating leave request' });
            }

            // Notify managers/admins (users with leave.manage)
            db.all(
                `SELECT DISTINCT u.id, u.email FROM Users u
                 JOIN UserRoles ur ON ur.user_id = u.id
                 JOIN RolePermissions rp ON rp.role_id = ur.role_id
                 JOIN Permissions p ON p.id = rp.permission_id
                 WHERE p.code = 'leave.manage' AND u.is_active = 1`,
                [],
                async (nErr, managers) => {
                    if (!nErr && managers) {
                        for (const m of managers) {
                            await notifyUser(db, {
                                user_id: m.id,
                                title: 'New leave request',
                                message: `A leave request (#${this.lastID}) is pending approval.`,
                                type: 'leave',
                                link: '/leave',
                                email: m.email,
                            });
                        }
                    }
                    res.json({ success: true, message: 'Leave request created', id: this.lastID });
                }
            );
        }
    );
});

// Approve / reject leave
router.put('/:id/status', (req, res) => {
    const db = req.app.get('db');
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const canManage = (req.permissions || []).includes('leave.manage');
    if (!canManage && status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    const approverId = req.user?.employee_id || null;

    db.run(
        `UPDATE LeaveRequests SET status = ?, approved_by = ? WHERE id = ?`,
        [status, status === 'Cancelled' ? null : approverId, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });

            db.get(
                `SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name, u.id as user_id, u.email
                 FROM LeaveRequests lr
                 JOIN Employees e ON lr.employee_id = e.id
                 LEFT JOIN Users u ON u.employee_id = e.id
                 WHERE lr.id = ?`,
                [req.params.id],
                async (gErr, leave) => {
                    if (!gErr && leave?.user_id) {
                        await notifyUser(db, {
                            user_id: leave.user_id,
                            title: `Leave ${status.toLowerCase()}`,
                            message: `Your leave request (${leave.date_start} – ${leave.date_end}) was ${status.toLowerCase()}.`,
                            type: 'leave',
                            link: '/leave',
                            email: leave.email,
                        });
                    }
                    res.json({ success: true, message: `Leave ${status.toLowerCase()}` });
                }
            );
        }
    );
});

module.exports = router;
