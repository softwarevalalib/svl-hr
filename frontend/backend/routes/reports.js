const express = require('express');
const router = express.Router();
const { authenticate, requireAnyPermission } = require('../middleware/auth');
const { sendExcel } = require('../services/excelService');
const pdf = require('../services/pdfService');

router.use(authenticate);

function isPostgres(db) {
  return db.driver === 'postgres';
}

function fetchReport(db, type, from, to, callback) {
  const params = [];
  let query;

  switch (type) {
    case 'attendance':
      query = `
        SELECT a.date, e.first_name || ' ' || e.last_name as name, e.department,
               a.in_time, a.out_time, a.status
        FROM Attendance a
        JOIN Employees e ON a.employee_id = e.id
        WHERE 1=1`;
      if (from) {
        query += ' AND a.date >= ?';
        params.push(from);
      }
      if (to) {
        query += ' AND a.date <= ?';
        params.push(to);
      }
      query += ' ORDER BY a.date DESC';
      break;
    case 'leave':
      query = `
        SELECT e.first_name || ' ' || e.last_name as name, e.department, lt.name as leave_type,
               lr.date_start, lr.date_end, lr.days, lr.status, lr.reason
        FROM LeaveRequests lr
        JOIN Employees e ON lr.employee_id = e.id
        JOIN LeaveTypes lt ON lr.leave_type_id = lt.id
        WHERE 1=1`;
      if (from) {
        query += ' AND lr.date_start >= ?';
        params.push(from);
      }
      if (to) {
        query += ' AND lr.date_end <= ?';
        params.push(to);
      }
      query += ' ORDER BY lr.date_start DESC';
      break;
    case 'expenses':
      query = `
        SELECT e.first_name || ' ' || e.last_name as name, ee.expense_date as date,
               ec.name as category, ee.amount, ee.currency, ee.status, ee.payee
        FROM EmployeeExpenses ee
        LEFT JOIN Employees e ON ee.employee_id = e.id
        LEFT JOIN ExpenseCategories ec ON ee.category_id = ec.id
        WHERE 1=1`;
      if (from) {
        query += ' AND ee.expense_date >= ?';
        params.push(from);
      }
      if (to) {
        query += ' AND ee.expense_date <= ?';
        params.push(to);
      }
      query += ' ORDER BY ee.expense_date DESC';
      break;
    case 'payroll':
      query = `
        SELECT p.name, p.pay_period, p.date_start, p.date_end, p.total_amount, p.status
        FROM Payroll p WHERE 1=1`;
      if (from) {
        query += ' AND p.date_start >= ?';
        params.push(from);
      }
      if (to) {
        query += ' AND p.date_end <= ?';
        params.push(to);
      }
      query += ' ORDER BY p.date_start DESC';
      break;
    case 'training':
      query = `SELECT code, name, trainer, payment_type, cost, status FROM Courses ORDER BY name`;
      break;
    case 'employees':
    default:
      query = `
        SELECT employee_id as id, first_name || ' ' || last_name as name,
               department, job_title, email, phone, status, joined_date
        FROM Employees
        ORDER BY last_name, first_name`;
      break;
  }

  db.all(query, params, callback);
}

router.get('/preview', requireAnyPermission('reports.view', 'export.pdf'), (req, res) => {
  const db = req.app.get('db');
  const { type = 'employees', from, to } = req.query;
  fetchReport(db, type, from, to, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

router.get('/:type.xlsx', requireAnyPermission('reports.view', 'export.pdf', 'import.data'), async (req, res) => {
  const db = req.app.get('db');
  const type = req.params.type;
  const { from, to } = req.query;
  fetchReport(db, type, from, to, async (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    const data = rows || [];
    const keys = data.length ? Object.keys(data[0]) : ['info'];
    try {
      await sendExcel(res, `${type}-report.xlsx`, [
        {
          name: type,
          columns: keys.map((k) => ({ header: k, key: k, width: 18 })),
          rows: data.length ? data : [{ info: 'No data' }],
        },
      ]);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
});

router.get('/:type.pdf', requireAnyPermission('reports.view', 'export.pdf'), (req, res) => {
  const db = req.app.get('db');
  const type = req.params.type;
  const { from, to } = req.query;

  fetchReport(db, type, from, to, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    const data = rows || [];
    const keys = data.length ? Object.keys(data[0]) : ['Message'];
    pdf.streamGenericReport(
      res,
      `${type}-report.pdf`,
      type.toUpperCase() + ' Report',
      keys,
      data.map((r) => keys.map((k) => r[k]))
    );
  });
});

module.exports = router;
