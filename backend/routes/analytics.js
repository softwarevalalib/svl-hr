const express = require('express');
const router = express.Router();
const { authenticate, requireAnyPermission } = require('../middleware/auth');

router.use(authenticate);

function isPostgres(db) {
  return db.driver === 'postgres';
}

router.get('/overview', requireAnyPermission('analytics.view', 'dashboard.view'), (req, res) => {
  const db = req.app.get('db');
  const pg = isPostgres(db);

  const monthlyAttendance = pg
    ? `SELECT TO_CHAR(date::date, 'YYYY-MM') as month, COUNT(*) as attendance
       FROM Attendance
       WHERE date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY 1 ORDER BY 1`
    : `SELECT strftime('%Y-%m', date) as month, COUNT(*) as attendance
       FROM Attendance
       WHERE date >= date('now', '-6 months')
       GROUP BY 1 ORDER BY 1`;

  const monthlyEmployees = pg
    ? `SELECT TO_CHAR(joined_date::date, 'YYYY-MM') as month, COUNT(*) as employees
       FROM Employees
       WHERE joined_date IS NOT NULL AND joined_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY 1 ORDER BY 1`
    : `SELECT strftime('%Y-%m', joined_date) as month, COUNT(*) as employees
       FROM Employees
       WHERE joined_date IS NOT NULL AND joined_date >= date('now', '-12 months')
       GROUP BY 1 ORDER BY 1`;

  const leaveByType = `
    SELECT lt.name as leave_type, COUNT(*) as count
    FROM LeaveRequests lr
    JOIN LeaveTypes lt ON lr.leave_type_id = lt.id
    GROUP BY lt.name ORDER BY count DESC`;

  const expensesByMonth = pg
    ? `SELECT TO_CHAR(expense_date::date, 'YYYY-MM') as month, COALESCE(SUM(amount),0) as total
       FROM EmployeeExpenses
       WHERE expense_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY 1 ORDER BY 1`
    : `SELECT strftime('%Y-%m', expense_date) as month, COALESCE(SUM(amount),0) as total
       FROM EmployeeExpenses
       WHERE expense_date >= date('now', '-6 months')
       GROUP BY 1 ORDER BY 1`;

  const deptHeadcount = `
    SELECT COALESCE(department, 'Unassigned') as department, COUNT(*) as count
    FROM Employees WHERE status = 'Active'
    GROUP BY department ORDER BY count DESC`;

  const result = {};
  let done = 0;
  const total = 5;

  const finish = () => {
    done++;
    if (done === total) res.json({ success: true, data: result });
  };

  db.all(monthlyAttendance, [], (e, rows) => {
    result.monthlyAttendance = rows || [];
    finish();
  });
  db.all(monthlyEmployees, [], (e, rows) => {
    result.monthlyEmployees = rows || [];
    finish();
  });
  db.all(leaveByType, [], (e, rows) => {
    result.leaveByType = rows || [];
    finish();
  });
  db.all(expensesByMonth, [], (e, rows) => {
    result.expensesByMonth = rows || [];
    finish();
  });
  db.all(deptHeadcount, [], (e, rows) => {
    result.departmentHeadcount = rows || [];
    finish();
  });
});

module.exports = router;
