const express = require('express');
const router = express.Router();

// Get all expenses
router.get('/', (req, res) => {
    const db = req.app.get('db');
    const { employee_id, status } = req.query;
    let query = `
        SELECT ee.*, 
               ec.name as category_name,
               epm.name as payment_method_name,
               e.first_name || ' ' || e.last_name as employee_name
        FROM EmployeeExpenses ee
        LEFT JOIN ExpenseCategories ec ON ee.category_id = ec.id
        LEFT JOIN ExpensePaymentMethods epm ON ee.payment_method_id = epm.id
        LEFT JOIN Employees e ON ee.employee_id = e.id
        WHERE 1=1
    `;
    const params = [];
    if (employee_id) {
        query += ' AND ee.employee_id = ?';
        params.push(employee_id);
    }
    if (status) {
        query += ' AND ee.status = ?';
        params.push(status);
    }
    query += ' ORDER BY ee.expense_date DESC';
    
    db.all(query, params, (err, expenses) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: expenses });
    });
});

// Create expense
router.post('/', (req, res) => {
    const db = req.app.get('db');
    const { employee_id, expense_date, payment_method_id, transaction_no, payee, category_id, notes, amount, currency } = req.body;
    db.run(
        'INSERT INTO EmployeeExpenses (employee_id, expense_date, payment_method_id, transaction_no, payee, category_id, notes, amount, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [employee_id, expense_date, payment_method_id, transaction_no, payee, category_id, notes, amount, currency || 'USD'],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// Get categories
router.get('/categories', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM ExpenseCategories ORDER BY name', (err, categories) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: categories });
    });
});

// Get payment methods
router.get('/payment-methods', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM ExpensePaymentMethods ORDER BY name', (err, methods) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: methods });
    });
});

module.exports = router;
