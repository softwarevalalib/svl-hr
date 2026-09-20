const express = require('express');
const router = express.Router();

function isPostgres(db) {
    return db.driver === 'postgres';
}

// Get comprehensive dashboard statistics
router.get('/stats', (req, res) => {
    const db = req.app.get('db');
    const pg = isPostgres(db);

    const attendanceWhere = pg
        ? `WHERE date::date >= CURRENT_DATE - INTERVAL '7 days'`
        : `WHERE date(date) >= date('now', '-7 days')`;

    const queries = {
        employees: `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN status = 'Terminated' THEN 1 ELSE 0 END) as terminated
         FROM Employees`,

        departments: `SELECT COUNT(*) as total FROM Departments`,

        users: `SELECT COUNT(*) as total FROM Users`,

        attendance: `SELECT COUNT(*) as total 
         FROM Attendance 
         ${attendanceWhere}`,

        leaves: `SELECT COUNT(*) as total 
         FROM LeaveRequests 
         WHERE status = 'Pending'`,

        projects: `SELECT COUNT(*) as total FROM Projects WHERE status = 'Active'`,

        training: `SELECT COUNT(*) as total FROM Courses WHERE status = 'Active'`,

        expenses: `SELECT 
            COUNT(*) as total,
            SUM(amount) as total_amount
         FROM EmployeeExpenses 
         WHERE status = 'Pending'`,
    };

    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.keys(queries).forEach((key) => {
        db.get(queries[key], [], (err, row) => {
            if (err) {
                results[key] = { error: err.message };
            } else {
                results[key] = row || {};
            }

            completed++;
            if (completed === total) {
                res.json({ success: true, data: results });
            }
        });
    });
});

// Get employee distribution by department
router.get('/employee-distribution', (req, res) => {
    const db = req.app.get('db');

    db.all(
        `SELECT 
            COALESCE(d.name, 'Not Assigned') as department,
            COUNT(e.id) as count
         FROM Employees e
         LEFT JOIN Departments d ON e.department = d.name
         WHERE e.status = 'Active'
         GROUP BY d.name
         ORDER BY count DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: rows });
        }
    );
});

// Get attendance trends (last 7 days)
router.get('/attendance-trends', (req, res) => {
    const db = req.app.get('db');
    const pg = isPostgres(db);

    const query = pg
        ? `SELECT 
            date::date as date,
            COUNT(*) as count
         FROM Attendance
         WHERE date::date >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY date::date
         ORDER BY date::date ASC`
        : `SELECT 
            date(date) as date,
            COUNT(*) as count
         FROM Attendance
         WHERE date(date) >= date('now', '-7 days')
         GROUP BY date(date)
         ORDER BY date(date) ASC`;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: rows });
    });
});

// Get leave status distribution
router.get('/leave-distribution', (req, res) => {
    const db = req.app.get('db');

    db.all(
        `SELECT 
            status,
            COUNT(*) as count
         FROM LeaveRequests
         GROUP BY status`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: rows });
        }
    );
});

// Get recent activities
router.get('/recent-activities', (req, res) => {
    const db = req.app.get('db');

    db.all(
        `SELECT 'employee' as type,
                'New employee: ' || first_name || ' ' || last_name as title,
                joined_date as date,
                status
         FROM Employees
         ORDER BY id DESC
         LIMIT 5`,
        [],
        (err, employees) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            db.all(
                `SELECT 'leave' as type,
                        'Leave request: ' || e.first_name || ' ' || e.last_name as title,
                        lr.date_start as date,
                        lr.status
                 FROM LeaveRequests lr
                 JOIN Employees e ON lr.employee_id = e.id
                 ORDER BY lr.id DESC
                 LIMIT 5`,
                [],
                (lErr, leaves) => {
                    if (lErr) {
                        return res.status(500).json({ success: false, message: lErr.message });
                    }

                    const activities = [...(employees || []), ...(leaves || [])]
                        .sort((a, b) => {
                            const da = a.date ? new Date(a.date).getTime() : 0;
                            const db_ = b.date ? new Date(b.date).getTime() : 0;
                            return db_ - da;
                        })
                        .slice(0, 10);

                    res.json({ success: true, data: activities });
                }
            );
        }
    );
});

module.exports = router;
