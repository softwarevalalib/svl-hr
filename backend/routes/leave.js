const express = require('express');
const router = express.Router();

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

// Get leave requests
router.get('/', (req, res) => {
    const db = req.app.get('db');
    const { employee_id, status } = req.query;
    
    let query = `
        SELECT lr.*, 
               e.first_name || ' ' || e.last_name as employee_name,
               lt.name as leave_type_name,
               approver.first_name || ' ' || approver.last_name as approved_by_name
        FROM LeaveRequests lr
        JOIN Employees e ON lr.employee_id = e.id
        JOIN LeaveTypes lt ON lr.leave_type_id = lt.id
        LEFT JOIN Employees approver ON lr.approved_by = approver.id
    `;
    
    const params = [];
    
    if (employee_id) {
        query += ' WHERE lr.employee_id = ?';
        params.push(employee_id);
    }
    
    if (status) {
        query += params.length > 0 ? ' AND lr.status = ?' : ' WHERE lr.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY lr.created_at DESC';
    
    db.all(query, params, (err, requests) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching leave requests' });
        }
        res.json({ success: true, data: requests });
    });
});

// Create leave request
router.post('/', (req, res) => {
    const db = req.app.get('db');
    const { employee_id, leave_type_id, date_start, date_end, days, reason } = req.body;
    
    if (!employee_id || !leave_type_id || !date_start || !date_end) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    
    db.run(
        `INSERT INTO LeaveRequests (employee_id, leave_type_id, date_start, date_end, days, reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employee_id, leave_type_id, date_start, date_end, days, reason],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error creating leave request' });
            }
            res.json({ success: true, message: 'Leave request created', id: this.lastID });
        }
    );
});

module.exports = router;

