const express = require('express');
const router = express.Router();

// ============= FINANCIAL ACCOUNTS =============
// Get all accounts
router.get('/accounts', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT fa.*, at.name as account_type_name
         FROM FinancialAccounts fa
         LEFT JOIN AccountTypes at ON fa.account_type_id = at.id
         ORDER BY fa.account_name`,
        (err, accounts) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: accounts });
        }
    );
});

// Create account
router.post('/accounts', (req, res) => {
    const db = req.app.get('db');
    const { account_number, account_name, account_type_id, currency, opening_balance, bank_name, branch } = req.body;
    db.run(
        `INSERT INTO FinancialAccounts (account_number, account_name, account_type_id, currency, opening_balance, current_balance, bank_name, branch)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [account_number, account_name, account_type_id, currency || 'USD', opening_balance || 0, opening_balance || 0, bank_name, branch],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= TRANSACTIONS =============
// Get all transactions
router.get('/transactions', (req, res) => {
    const db = req.app.get('db');
    const { account_id, status, start_date, end_date } = req.query;
    let query = `
        SELECT ft.*, fa.account_name, tt.name as transaction_type_name, tt.category
        FROM FinancialTransactions ft
        LEFT JOIN FinancialAccounts fa ON ft.account_id = fa.id
        LEFT JOIN TransactionTypes tt ON ft.transaction_type_id = tt.id
        WHERE 1=1
    `;
    const params = [];
    
    if (account_id) {
        query += ' AND ft.account_id = ?';
        params.push(account_id);
    }
    if (status) {
        query += ' AND ft.status = ?';
        params.push(status);
    }
    if (start_date) {
        query += ' AND ft.transaction_date >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND ft.transaction_date <= ?';
        params.push(end_date);
    }
    
    query += ' ORDER BY ft.transaction_date DESC, ft.created_at DESC';
    
    db.all(query, params, (err, transactions) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: transactions });
    });
});

// Create transaction
router.post('/transactions', (req, res) => {
    const db = req.app.get('db');
    const { account_id, transaction_type_id, amount, currency, transaction_date, description, reference_number, category } = req.body;
    
    const transaction_number = `TXN-${Date.now()}`;
    
    db.run(
        `INSERT INTO FinancialTransactions (transaction_number, account_id, transaction_type_id, amount, currency, transaction_date, description, reference_number, category, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transaction_number, account_id, transaction_type_id, amount, currency || 'USD', transaction_date, description, reference_number, category, 1],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            
            // Update account balance
            db.run(
                'UPDATE FinancialAccounts SET current_balance = current_balance + ? WHERE id = ?',
                [amount, account_id],
                () => {
                    res.json({ success: true, data: { id: this.lastID, transaction_number } });
                }
            );
        }
    );
});

// ============= BUDGETS =============
// Get all budgets
router.get('/budgets', (req, res) => {
    const db = req.app.get('db');
    const { status, fiscal_year } = req.query;
    let query = `
        SELECT b.*, bc.name as category_name
        FROM Budgets b
        LEFT JOIN BudgetCategories bc ON b.budget_category_id = bc.id
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        query += ' AND b.status = ?';
        params.push(status);
    }
    if (fiscal_year) {
        query += ' AND b.fiscal_year = ?';
        params.push(fiscal_year);
    }
    
    query += ' ORDER BY b.fiscal_year DESC, b.created_at DESC';
    
    db.all(query, params, (err, budgets) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: budgets });
    });
});

// Create budget
router.post('/budgets', (req, res) => {
    const db = req.app.get('db');
    const { name, budget_category_id, fiscal_year, period_start, period_end, allocated_amount, currency, notes } = req.body;
    db.run(
        `INSERT INTO Budgets (name, budget_category_id, fiscal_year, period_start, period_end, allocated_amount, currency, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, budget_category_id, fiscal_year, period_start, period_end, allocated_amount, currency || 'USD', notes],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// Get budget summary
router.get('/budgets/summary', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT 
            bc.name as category,
            SUM(b.allocated_amount) as total_allocated,
            SUM(b.spent_amount) as total_spent,
            SUM(b.allocated_amount) - SUM(b.spent_amount) as remaining
         FROM Budgets b
         LEFT JOIN BudgetCategories bc ON b.budget_category_id = bc.id
         WHERE b.status = 'Active'
         GROUP BY bc.id, bc.name`,
        (err, summary) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: summary });
        }
    );
});

module.exports = router;
