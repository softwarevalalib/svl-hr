const express = require('express');
const router = express.Router();

// Get all departments
router.get('/', (req, res) => {
    const db = req.app.get('db');
    
    db.all(
        `SELECT d.*, 
                m.first_name || ' ' || m.last_name as manager_name,
                COUNT(e.id) as employee_count
         FROM Departments d
         LEFT JOIN Employees m ON d.manager_id = m.id
         LEFT JOIN Employees e ON e.department = d.name
         GROUP BY d.id
         ORDER BY d.name`,
        [],
        (err, departments) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching departments' 
                });
            }
            
            res.json({ success: true, data: departments });
        }
    );
});

// Get single department
router.get('/:id', (req, res) => {
    const db = req.app.get('db');
    const deptId = req.params.id;
    
    db.get(
        `SELECT * FROM Departments WHERE id = ?`,
        [deptId],
        (err, department) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error fetching department' });
            }
            if (!department) {
                return res.status(404).json({ success: false, message: 'Department not found' });
            }
            res.json({ success: true, data: department });
        }
    );
});

module.exports = router;

