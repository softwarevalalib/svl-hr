const express = require('express');
const router = express.Router();

// Get comprehensive dashboard statistics
router.get('/stats', (req, res) => {
    const db = req.app.get('db');
    
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
         WHERE date(date) >= date('now', '-7 days')`,
        
        leaves: `SELECT COUNT(*) as total 
         FROM LeaveRequests 
         WHERE status = 'Pending'`,
        
        projects: `SELECT COUNT(*) as total FROM Projects WHERE status = 'Active'`,
        
        training: `SELECT COUNT(*) as total FROM Courses WHERE status = 'Active'`,
        
        expenses: `SELECT 
            COUNT(*) as total,
            SUM(amount) as total_amount
         FROM EmployeeExpenses 
         WHERE status = 'Pending'`
    };
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    Object.keys(queries).forEach(key => {
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
    
    db.all(
        `SELECT 
            date(date) as date,
            COUNT(*) as count
         FROM Attendance
         WHERE date(date) >= date('now', '-7 days')
         GROUP BY date(date)
         ORDER BY date(date) ASC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: rows });
        }
    );
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
    
    const activities = [];
    let completed = 0;
    const total = 4;
    
    // Recent employees
    db.all('SELECT id, first_name, last_name, joined_date, status FROM Employees ORDER BY created_at DESC LIMIT 5', [], (err, employees) => {
        if (!err && employees) {
            employees.forEach(emp => {
                activities.push({
                    type: 'employee',
                    title: `New employee: ${emp.first_name} ${emp.last_name}`,
                    date: emp.joined_date,
                    status: emp.status
                });
            });
        }
        completed++;
        if (completed === total) {
            res.json({ success: true, data: activities.slice(0, 10) });
        }
    });
    
    // Recent leave requests
    db.all('SELECT id, employee_id, date_start, status FROM LeaveRequests ORDER BY created_at DESC LIMIT 5', [], (err, leaves) => {
        if (!err && leaves) {
            db.all('SELECT id, first_name, last_name FROM Employees WHERE id IN (' + leaves.map(() => '?').join(',') + ')', 
                leaves.map(l => l.employee_id), 
                (err, emps) => {
                    const empMap = {};
                    if (!err && emps) {
                        emps.forEach(e => empMap[e.id] = `${e.first_name} ${e.last_name}`);
                    }
                    leaves.forEach(leave => {
                        activities.push({
                            type: 'leave',
                            title: `Leave request: ${empMap[leave.employee_id] || 'Employee'}`,
                            date: leave.date_start,
                            status: leave.status
                        });
                    });
                    completed++;
                    if (completed === total) {
                        res.json({ success: true, data: activities.slice(0, 10) });
                    }
                });
        } else {
            completed++;
            if (completed === total) {
                res.json({ success: true, data: activities.slice(0, 10) });
            }
        }
    });
    
    // Recent expenses
    db.all('SELECT id, employee_id, amount, expense_date, status FROM EmployeeExpenses ORDER BY created_at DESC LIMIT 3', [], (err, expenses) => {
        if (!err && expenses) {
            expenses.forEach(exp => {
                activities.push({
                    type: 'expense',
                    title: `Expense claim: $${exp.amount}`,
                    date: exp.expense_date,
                    status: exp.status
                });
            });
        }
        completed++;
        if (completed === total) {
            res.json({ success: true, data: activities.slice(0, 10) });
        }
    });
    
    // Recent training
    db.all('SELECT id, name, scheduled FROM TrainingSessions ORDER BY scheduled DESC LIMIT 3', [], (err, trainings) => {
        if (!err && trainings) {
            trainings.forEach(train => {
                activities.push({
                    type: 'training',
                    title: `Training: ${train.name}`,
                    date: train.scheduled,
                    status: 'scheduled'
                });
            });
        }
        completed++;
        if (completed === total) {
            res.json({ success: true, data: activities.slice(0, 10) });
        }
    });
});

module.exports = router;
