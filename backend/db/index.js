const path = require('path');

/** Neon schema uses quoted PascalCase table names; SQLite-style SQL leaves them unquoted. */
const PG_TABLES = [
  'AccountTypes',
  'Attendance',
  'BidItems',
  'BidOpportunities',
  'Bids',
  'BudgetCategories',
  'Budgets',
  'Certifications',
  'Courses',
  'Departments',
  'Documents',
  'Educations',
  'EmergencyContacts',
  'EmployeeCertifications',
  'EmployeeDependents',
  'EmployeeEducations',
  'EmployeeExpenses',
  'EmployeeImmigrations',
  'EmployeeLanguages',
  'EmployeeOvertime',
  'EmployeeProjects',
  'EmployeeSalaries',
  'EmployeeSkills',
  'EmployeeTrainingSessions',
  'Employees',
  'EmploymentStatus',
  'ExpenseCategories',
  'ExpensePaymentMethods',
  'FinancialAccounts',
  'FinancialTransactions',
  'ImmigrationDocuments',
  'ItemCategories',
  'Items',
  'JobTitles',
  'Languages',
  'LeaveRequests',
  'LeaveTypes',
  'Notifications',
  'OvertimeCategories',
  'Payroll',
  'PayrollData',
  'Payslips',
  'PerformanceReviews',
  'Permissions',
  'Projects',
  'PurchaseOrderItems',
  'PurchaseOrders',
  'PurchaseRequestItems',
  'PurchaseRequests',
  'RolePermissions',
  'Roles',
  'SalaryComponentTypes',
  'SalaryComponents',
  'Settings',
  'Skills',
  'TimeSheets',
  'TrainingSessions',
  'TransactionTypes',
  'UserRoles',
  'Users',
  'Vendors',
  'WorkSchedules',
].sort((a, b) => b.length - a.length);

const PG_TABLE_RE = new RegExp(`\\b(${PG_TABLES.join('|')})\\b`, 'g');

function quotePgTables(sql) {
  // Preserve already-quoted identifiers
  const parts = sql.split(/("(?:[^"]*)")/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part.replace(PG_TABLE_RE, '"$1"');
    })
    .join('');
}

function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function normalizeSql(sql) {
  let out = sql;
  const wasIgnore = /INSERT\s+OR\s+IGNORE/i.test(sql);
  out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  if (wasIgnore && !/ON\s+CONFLICT/i.test(out)) {
    out = out.replace(/;?\s*$/, ' ON CONFLICT DO NOTHING');
  }
  out = out.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  out = quotePgTables(out);
  return out;
}

function createPgDb(connectionString) {
  // Prefer Neon serverless driver on Vercel (TCP pg often fails in serverless)
  let Pool;
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    try {
      const neon = require('@neondatabase/serverless');
      const ws = require('ws');
      neon.neonConfig.webSocketConstructor = ws;
      Pool = neon.Pool;
    } catch (e) {
      Pool = require('pg').Pool;
    }
  } else {
    Pool = require('pg').Pool;
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: isServerless ? 1 : 10,
  });

  const db = {
    driver: 'postgres',
    pool,

    all(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const text = convertPlaceholders(normalizeSql(sql));
      pool.query(text, params || [], (err, result) => {
        callback(err, result ? result.rows : undefined);
      });
    },

    get(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const text = convertPlaceholders(normalizeSql(sql));
      pool.query(text, params || [], (err, result) => {
        callback(err, result && result.rows ? result.rows[0] : undefined);
      });
    },

    run(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      let text = normalizeSql(sql);
      const isInsert = /^\s*INSERT\s+/i.test(text);
      if (isInsert && !/RETURNING\s+/i.test(text)) {
        text = text.replace(/;?\s*$/, ' RETURNING id');
      }
      text = convertPlaceholders(text);

      const ctx = { lastID: 0, changes: 0 };
      pool.query(text, params || [], function (err, result) {
        if (!err && result) {
          ctx.changes = result.rowCount || 0;
          if (result.rows && result.rows[0] && result.rows[0].id != null) {
            ctx.lastID = result.rows[0].id;
          }
        }
        if (typeof callback === 'function') {
          callback.call(ctx, err);
        }
      });
    },

    serialize(fn) {
      if (typeof fn === 'function') fn();
    },

    close(cb) {
      pool.end(cb);
    },
  };

  return db;
}

function createSqliteDb(dbPath) {
  // Lazy-load so Vercel/Neon deploys do not need native sqlite3
  const sqlite3 = require('sqlite3').verbose();
  const raw = new sqlite3.Database(dbPath);
  raw.run('PRAGMA foreign_keys = ON');
  raw.driver = 'sqlite';
  return raw;
}

function normalizeDatabaseUrl(raw) {
  if (!raw) return '';
  let url = String(raw).trim().replace(/^["']+|["']+$/g, '');
  // Common paste mistakes
  url = url.replace(/^DATABASE_URL=/i, '');
  return url;
}

function createDatabase() {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (databaseUrl && /^postgres(ql)?:\/\//i.test(databaseUrl)) {
    console.log('✅ Using Neon/PostgreSQL (DATABASE_URL)');
    return createPgDb(databaseUrl);
  }

  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../database/hr_system.db');
  console.log('✅ Using SQLite database:', dbPath);
  return createSqliteDb(dbPath);
}

module.exports = { createDatabase, createPgDb, createSqliteDb, quotePgTables };
