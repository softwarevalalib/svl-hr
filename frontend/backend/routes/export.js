const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const router = express.Router();
const { authenticate, requirePermission, requireAnyPermission } = require('../middleware/auth');
const pdf = require('../services/pdfService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/payslip/:id.pdf', requirePermission('export.pdf'), (req, res) => {
    const db = req.app.get('db');
    db.get(
        `SELECT ps.*, p.name as payroll_name FROM Payslips ps
         LEFT JOIN Payroll p ON ps.payroll_id = p.id WHERE ps.id = ?`,
        [req.params.id],
        (err, payslip) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });
            db.get('SELECT * FROM Employees WHERE id = ?', [payslip.employee_id], (eErr, employee) => {
                if (eErr) return res.status(500).json({ success: false, message: eErr.message });
                pdf.payslipPdf(res, payslip, employee);
            });
        }
    );
});

router.get('/expense/:id.pdf', requirePermission('export.pdf'), (req, res) => {
    const db = req.app.get('db');
    db.get(
        `SELECT ee.*, ec.name as category_name, epm.name as payment_method_name,
                e.first_name || ' ' || e.last_name as employee_name
         FROM EmployeeExpenses ee
         LEFT JOIN ExpenseCategories ec ON ee.category_id = ec.id
         LEFT JOIN ExpensePaymentMethods epm ON ee.payment_method_id = epm.id
         LEFT JOIN Employees e ON ee.employee_id = e.id
         WHERE ee.id = ?`,
        [req.params.id],
        (err, expense) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
            pdf.expenseReceiptPdf(res, expense);
        }
    );
});

router.get('/invoice/:id.pdf', requirePermission('export.pdf'), (req, res) => {
    const db = req.app.get('db');
    db.get(
        `SELECT ft.*, fa.account_name, tt.name as transaction_type_name
         FROM FinancialTransactions ft
         LEFT JOIN FinancialAccounts fa ON ft.account_id = fa.id
         LEFT JOIN TransactionTypes tt ON ft.transaction_type_id = tt.id
         WHERE ft.id = ?`,
        [req.params.id],
        (err, txn) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
            pdf.invoicePdf(res, txn);
        }
    );
});

router.get('/purchase-order/:id.pdf', requirePermission('export.pdf'), (req, res) => {
    const db = req.app.get('db');
    db.get(
        `SELECT po.*, v.name as vendor_name FROM PurchaseOrders po
         LEFT JOIN Vendors v ON po.vendor_id = v.id WHERE po.id = ?`,
        [req.params.id],
        (err, order) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!order) return res.status(404).json({ success: false, message: 'PO not found' });
            db.all('SELECT * FROM PurchaseOrderItems WHERE purchase_order_id = ?', [order.id], (iErr, items) => {
                if (iErr) return res.status(500).json({ success: false, message: iErr.message });
                pdf.purchaseOrderPdf(res, order, items || []);
            });
        }
    );
});

router.get('/attendance.pdf', requireAnyPermission('export.pdf', 'attendance.view', 'attendance.manage'), (req, res) => {
    const db = req.app.get('db');
    const { from, to, employee_id } = req.query;
    let query = `
        SELECT a.*, e.first_name || ' ' || e.last_name as employee_name
        FROM Attendance a JOIN Employees e ON a.employee_id = e.id WHERE 1=1`;
    const params = [];
    const canManage = (req.permissions || []).some((p) => p === 'attendance.manage' || p === 'attendance.view');
    if (!canManage && req.user.employee_id) {
        query += ' AND a.employee_id = ?';
        params.push(req.user.employee_id);
    } else if (employee_id) {
        query += ' AND a.employee_id = ?';
        params.push(employee_id);
    }
    if (from) {
        query += ' AND a.date >= ?';
        params.push(from);
    }
    if (to) {
        query += ' AND a.date <= ?';
        params.push(to);
    }
    query += ' ORDER BY a.date DESC';
    db.all(query, params, (err, records) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        pdf.attendanceReportPdf(res, records, { range: `${from || ''} – ${to || ''}` });
    });
});

router.get('/employees.pdf', requireAnyPermission('export.pdf', 'employees.view'), (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Employees ORDER BY last_name, first_name', (err, employees) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        pdf.employeeListPdf(res, employees);
    });
});

router.get('/leave.pdf', requireAnyPermission('export.pdf', 'leave.view', 'leave.self'), (req, res) => {
    const db = req.app.get('db');
    let query = `
        SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name, lt.name as leave_type_name
        FROM LeaveRequests lr
        JOIN Employees e ON lr.employee_id = e.id
        JOIN LeaveTypes lt ON lr.leave_type_id = lt.id
        WHERE 1=1`;
    const params = [];
    const canViewAll = (req.permissions || []).includes('leave.view') || (req.permissions || []).includes('leave.manage');
    if (!canViewAll && req.user.employee_id) {
        query += ' AND lr.employee_id = ?';
        params.push(req.user.employee_id);
    }
    query += ' ORDER BY lr.date_start DESC';
    db.all(query, params, (err, leaves) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        pdf.leaveSummaryPdf(res, leaves);
    });
});

router.post('/import/employees', requirePermission('import.data'), upload.single('file'), (req, res) => {
    const db = req.app.get('db');
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    try {
        const records = parse(req.file.buffer.toString('utf8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        let done = 0;
        let inserted = 0;
        if (!records.length) return res.json({ success: true, inserted: 0 });
        records.forEach((r) => {
            db.run(
                `INSERT INTO Employees (employee_id, first_name, last_name, email, phone, department, job_title, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    r.employee_id || r.EmployeeID || null,
                    r.first_name || r.FirstName || '',
                    r.last_name || r.LastName || '',
                    r.email || r.Email || null,
                    r.phone || r.Phone || null,
                    r.department || r.Department || null,
                    r.job_title || r.JobTitle || null,
                    r.status || 'Active',
                ],
                (err) => {
                    if (!err) inserted++;
                    done++;
                    if (done === records.length) {
                        res.json({ success: true, inserted, total: records.length });
                    }
                }
            );
        });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});

router.post('/import/attendance', requirePermission('import.data'), upload.single('file'), (req, res) => {
    const db = req.app.get('db');
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    try {
        const records = parse(req.file.buffer.toString('utf8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        let done = 0;
        let inserted = 0;
        if (!records.length) return res.json({ success: true, inserted: 0 });
        records.forEach((r) => {
            db.run(
                `INSERT INTO Attendance (employee_id, date, in_time, out_time, note, status)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON CONFLICT(employee_id, date) DO UPDATE SET
                   in_time = excluded.in_time, out_time = excluded.out_time,
                   note = excluded.note, status = excluded.status`,
                [
                    r.employee_id || r.EmployeeID,
                    r.date || r.Date,
                    r.in_time || r.InTime || null,
                    r.out_time || r.OutTime || null,
                    r.note || null,
                    r.status || 'Present',
                ],
                (err) => {
                    if (!err) inserted++;
                    done++;
                    if (done === records.length) {
                        res.json({ success: true, inserted, total: records.length });
                    }
                }
            );
        });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});

router.post('/import/vendors', requirePermission('import.data'), upload.single('file'), (req, res) => {
    const db = req.app.get('db');
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    try {
        const records = parse(req.file.buffer.toString('utf8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        let done = 0;
        let inserted = 0;
        if (!records.length) return res.json({ success: true, inserted: 0 });
        records.forEach((r) => {
            const code = r.vendor_code || r.VendorCode || `V-${Date.now()}-${done}`;
            db.run(
                `INSERT OR IGNORE INTO Vendors (vendor_code, name, contact_person, email, phone, city, country)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    code,
                    r.name || r.Name || '',
                    r.contact_person || r.ContactPerson || null,
                    r.email || null,
                    r.phone || null,
                    r.city || null,
                    r.country || null,
                ],
                (err) => {
                    if (!err) inserted++;
                    done++;
                    if (done === records.length) {
                        res.json({ success: true, inserted, total: records.length });
                    }
                }
            );
        });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});

module.exports = router;
