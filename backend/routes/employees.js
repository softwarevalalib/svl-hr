const express = require('express');
const router = express.Router();

// Get all employees
router.get('/', (req, res) => {
    const db = req.app.get('db');
    const { status, department, search } = req.query;
    
    let query = `
        SELECT e.*, 
               s.first_name || ' ' || s.last_name as supervisor_name,
               d.name as department_name,
               (SELECT COUNT(*) FROM Attendance a WHERE a.employee_id = e.id) as attendance_count
        FROM Employees e
        LEFT JOIN Employees s ON e.supervisor_id = s.id
        LEFT JOIN Departments d ON e.department = d.name
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
        conditions.push('e.status = ?');
        params.push(status);
    }
    
    if (department) {
        conditions.push('e.department = ?');
        params.push(department);
    }
    
    if (search) {
        conditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    db.all(query, params, (err, employees) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching employees' 
            });
        }
        
        res.json({ success: true, data: employees });
    });
});

// Get single employee by ID
router.get('/:id', (req, res) => {
    const db = req.app.get('db');
    const employeeId = req.params.id;
    
    db.get(
        `SELECT e.*, 
                s.first_name || ' ' || s.last_name as supervisor_name,
                d.name as department_name
         FROM Employees e
         LEFT JOIN Employees s ON e.supervisor_id = s.id
         LEFT JOIN Departments d ON e.department = d.name
         WHERE e.id = ?`,
        [employeeId],
        (err, employee) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching employee' 
                });
            }
            
            if (!employee) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Employee not found' 
                });
            }
            
            res.json({ success: true, data: employee });
        }
    );
});

// Create new employee
router.post('/', (req, res) => {
    const db = req.app.get('db');
    const {
        employee_id, first_name, last_name, middle_name, date_of_birth,
        gender, marital_status, nationality, email, phone, mobile_phone,
        joined_date, employment_status, job_title, department, supervisor_id, status
    } = req.body;
    
    if (!first_name || !last_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'First name and last name are required' 
        });
    }
    
    db.run(
        `INSERT INTO Employees 
         (employee_id, first_name, last_name, middle_name, date_of_birth,
          gender, marital_status, nationality, email, phone, mobile_phone,
          joined_date, employment_status, job_title, department, supervisor_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [employee_id, first_name, last_name, middle_name, date_of_birth,
         gender, marital_status, nationality, email, phone, mobile_phone,
         joined_date, employment_status, job_title, department, supervisor_id, status || 'Active'],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error creating employee' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Employee created successfully',
                id: this.lastID 
            });
        }
    );
});

// Update employee
router.put('/:id', (req, res) => {
    const db = req.app.get('db');
    const employeeId = req.params.id;
    const updateData = req.body;
    
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
            fields.push(`${key} = ?`);
            values.push(updateData[key]);
        }
    });
    
    if (fields.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'No fields to update' 
        });
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(employeeId);
    
    db.run(
        `UPDATE Employees SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error updating employee' 
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Employee not found' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Employee updated successfully' 
            });
        }
    );
});

// Delete employee
router.delete('/:id', (req, res) => {
    const db = req.app.get('db');
    const employeeId = req.params.id;
    
    db.run('DELETE FROM Employees WHERE id = ?', [employeeId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting employee' 
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Employee deleted successfully' 
        });
    });
});

// Get employee statistics
router.get('/stats/summary', (req, res) => {
    const db = req.app.get('db');
    
    db.get(
        `SELECT 
            COUNT(*) as total_employees,
            SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_employees,
            SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_employees,
            SUM(CASE WHEN status = 'Terminated' THEN 1 ELSE 0 END) as terminated_employees,
            COUNT(DISTINCT department) as total_departments
         FROM Employees`,
        [],
        (err, stats) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching statistics' 
                });
            }
            
            res.json({ success: true, data: stats });
        }
    );
});

module.exports = router;

