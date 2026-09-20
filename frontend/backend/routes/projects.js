const express = require('express');
const router = express.Router();

// Get all projects
router.get('/', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Projects ORDER BY created_at DESC', (err, projects) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: projects });
    });
});

// Get single project
router.get('/:id', (req, res) => {
    const db = req.app.get('db');
    db.get('SELECT * FROM Projects WHERE id = ?', [req.params.id], (err, project) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: project });
    });
});

// Create project
router.post('/', (req, res) => {
    const db = req.app.get('db');
    const { name, code, client_name, description, start_date, end_date } = req.body;
    db.run(
        'INSERT INTO Projects (name, code, client_name, description, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
        [name, code, client_name, description, start_date, end_date],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// Get employee projects
router.get('/employees/:id', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT ep.*, p.name as project_name, p.code as project_code
         FROM EmployeeProjects ep
         JOIN Projects p ON ep.project_id = p.id
         WHERE ep.employee_id = ?`,
        [req.params.id],
        (err, projects) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: projects });
        }
    );
});

// Get time sheets
router.get('/timesheets/:employeeId', (req, res) => {
    const db = req.app.get('db');
    db.all(
        'SELECT * FROM TimeSheets WHERE employee_id = ? ORDER BY date DESC',
        [req.params.employeeId],
        (err, timesheets) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: timesheets });
        }
    );
});

module.exports = router;
