const express = require('express');
const router = express.Router();

// ============= SALARY COMPONENTS =============
// Get all salary components
router.get('/components', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM SalaryComponents ORDER BY name', (err, components) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: components });
    });
});

// Create salary component
router.post('/components', (req, res) => {
    const db = req.app.get('db');
    const { name, component_type_id, details } = req.body;
    db.run(
        'INSERT INTO SalaryComponents (name, component_type_id, details) VALUES (?, ?, ?)',
        [name, component_type_id, details],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= EMPLOYEE SALARIES =============
// Get employee salaries
router.get('/employees/:id/salaries', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT es.*, sc.name as component_name, sct.name as component_type_name
         FROM EmployeeSalaries es
         LEFT JOIN SalaryComponents sc ON es.component_id = sc.id
         LEFT JOIN SalaryComponentTypes sct ON sc.component_type_id = sct.id
         WHERE es.employee_id = ?
         ORDER BY es.effective_date DESC`,
        [req.params.id],
        (err, salaries) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: salaries });
        }
    );
});

// Add salary to employee
router.post('/employees/:id/salaries', (req, res) => {
    const db = req.app.get('db');
    const { component_id, pay_frequency, currency, amount, effective_date, end_date, details } = req.body;
    db.run(
        `INSERT INTO EmployeeSalaries (employee_id, component_id, pay_frequency, currency, amount, effective_date, end_date, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, component_id, pay_frequency, currency || 'USD', amount, effective_date, end_date, details],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= PAYROLL PROCESSING =============
// Get all payrolls
router.get('/', (req, res) => {
    const db = req.app.get('db');
    const { status, department_id } = req.query;
    let query = `
        SELECT p.*, d.name as department_name
        FROM Payroll p
        LEFT JOIN Departments d ON p.department_id = d.id
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        query += ' AND p.status = ?';
        params.push(status);
    }
    if (department_id) {
        query += ' AND p.department_id = ?';
        params.push(department_id);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    db.all(query, params, (err, payrolls) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: payrolls });
    });
});

// Create payroll
router.post('/', (req, res) => {
    const db = req.app.get('db');
    const { name, pay_period, department_id, date_start, date_end, notes } = req.body;
    
    db.run(
        `INSERT INTO Payroll (name, pay_period, department_id, date_start, date_end, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, pay_period, department_id, date_start, date_end, notes],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// Get payroll details
router.get('/:id', (req, res) => {
    const db = req.app.get('db');
    db.get(
        `SELECT p.*, d.name as department_name
         FROM Payroll p
         LEFT JOIN Departments d ON p.department_id = d.id
         WHERE p.id = ?`,
        [req.params.id],
        (err, payroll) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
            res.json({ success: true, data: payroll });
        }
    );
});

// Get payroll employees and data
router.get('/:id/employees', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT DISTINCT 
            e.id, e.first_name, e.last_name, e.employee_id,
            SUM(CASE WHEN pd.payroll_column_id = 1 THEN pd.amount ELSE 0 END) as gross_salary,
            SUM(CASE WHEN pd.payroll_column_id = 2 THEN pd.amount ELSE 0 END) as deductions,
            SUM(CASE WHEN pd.payroll_column_id = 3 THEN pd.amount ELSE 0 END) as net_salary
         FROM PayrollData pd
         JOIN Employees e ON pd.employee_id = e.id
         WHERE pd.payroll_id = ?
         GROUP BY e.id, e.first_name, e.last_name, e.employee_id`,
        [req.params.id],
        (err, employees) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: employees });
        }
    );
});

// Update payroll status
router.put('/:id/status', (req, res) => {
    const db = req.app.get('db');
    const { status } = req.body;
    db.run(
        'UPDATE Payroll SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Payroll status updated' });
        }
    );
});

// ============= PAYSLIPS =============
// Get employee payslips
router.get('/employees/:id/payslips', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT ps.*, p.name as payroll_name
         FROM Payslips ps
         LEFT JOIN Payroll p ON ps.payroll_id = p.id
         WHERE ps.employee_id = ?
         ORDER BY ps.generated_at DESC`,
        [req.params.id],
        (err, payslips) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: payslips });
        }
    );
});

// Generate payslip
router.post('/:id/generate-payslips', (req, res) => {
    const db = req.app.get('db');
    const payrollId = req.params.id;
    
    // Get payroll employees and calculate payslip data
    db.all(
        `SELECT DISTINCT e.id as employee_id, p.date_start, p.date_end,
            COALESCE(SUM(CASE WHEN pd.payroll_column_id = 1 THEN pd.amount ELSE 0 END), 0) as gross_salary,
            COALESCE(SUM(CASE WHEN pd.payroll_column_id = 2 THEN pd.amount ELSE 0 END), 0) as total_deductions
         FROM Payroll p
         JOIN PayrollData pd ON p.id = pd.payroll_id
         JOIN Employees e ON pd.employee_id = e.id
         WHERE p.id = ?
         GROUP BY e.id, p.date_start, p.date_end`,
        [payrollId],
        (err, employees) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            
            let completed = 0;
            employees.forEach(emp => {
                const netSalary = (emp.gross_salary || 0) - (emp.total_deductions || 0);
                db.run(
                    `INSERT INTO Payslips (payroll_id, employee_id, pay_period_start, pay_period_end, gross_salary, total_deductions, net_salary, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'Generated')`,
                    [payrollId, emp.employee_id, emp.date_start, emp.date_end, emp.gross_salary, emp.total_deductions, netSalary],
                    () => {
                        completed++;
                        if (completed === employees.length) {
                            res.json({ success: true, message: `Generated ${employees.length} payslips` });
                        }
                    }
                );
            });
            
            if (employees.length === 0) {
                res.json({ success: true, message: 'No employees found in payroll' });
            }
        }
    );
});

module.exports = router;
