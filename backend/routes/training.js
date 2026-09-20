const express = require('express');
const router = express.Router();

// Get all courses
router.get('/courses', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Courses ORDER BY name', (err, courses) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: courses });
    });
});

// Get single course
router.get('/courses/:id', (req, res) => {
    const db = req.app.get('db');
    db.get('SELECT * FROM Courses WHERE id = ?', [req.params.id], (err, course) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: course });
    });
});

// Create course
router.post('/courses', (req, res) => {
    const db = req.app.get('db');
    const { code, name, description, coordinator_id, trainer, payment_type, cost } = req.body;
    db.run(
        'INSERT INTO Courses (code, name, description, coordinator_id, trainer, payment_type, cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [code, name, description, coordinator_id, trainer, payment_type, cost],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// Get training sessions
router.get('/sessions', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM TrainingSessions ORDER BY scheduled DESC', (err, sessions) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: sessions });
    });
});

// Get employee training sessions
router.get('/employees/:id/sessions', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT ets.*, ts.name as session_name, c.name as course_name
         FROM EmployeeTrainingSessions ets
         JOIN TrainingSessions ts ON ets.training_session_id = ts.id
         JOIN Courses c ON ts.course_id = c.id
         WHERE ets.employee_id = ?`,
        [req.params.id],
        (err, sessions) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: sessions });
        }
    );
});

module.exports = router;
