require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createDatabase } = require('./db');
const { authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const qualificationsRoutes = require('./routes/qualifications');
const trainingRoutes = require('./routes/training');
const projectRoutes = require('./routes/projects');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const payrollRoutes = require('./routes/payroll');
const financeRoutes = require('./routes/finance');
const procurementRoutes = require('./routes/procurement');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const settingsRoutes = require('./routes/settings');
const exportRoutes = require('./routes/export');
const documentRoutes = require('./routes/documents');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

const db = createDatabase();
app.set('db', db);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SVL Human Resource Management API is running',
    database: process.env.DATABASE_URL ? 'Neon/PostgreSQL' : 'SQLite',
    env: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRoutes);

// Public branding for login page (no auth)
app.get('/api/branding', (req, res) => {
  const db = req.app.get('db');
  db.all(
    `SELECT name, value FROM Settings WHERE name IN ('company_logo', 'login_background', 'company_name')`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      const map = {};
      (rows || []).forEach((r) => {
        map[r.name] = r.value;
      });
      res.json({
        success: true,
        data: {
          company_name: map.company_name || 'SVL HRM',
          company_logo: map.company_logo || null,
          login_background: map.login_background || null,
        },
      });
    }
  );
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth') || req.path === '/branding') {
    return next();
  }
  return authenticate(req, res, next);
});

app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/qualifications', qualificationsRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/procurement', procurementRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SVL HRM API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
