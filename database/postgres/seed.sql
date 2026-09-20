-- Seed data for Neon / PostgreSQL

INSERT INTO "Roles" (id, name, description, is_system) VALUES
(1, 'Admin', 'Full system access', 1),
(2, 'Manager', 'Team and department oversight', 1),
(3, 'HR', 'Human resources operations', 1),
(4, 'Finance', 'Finance and payroll access', 1),
(5, 'Employee', 'Self-service employee access', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Roles"', 'id'), (SELECT MAX(id) FROM "Roles"));

INSERT INTO "Permissions" (code, name, module, description) VALUES
('dashboard.view', 'View Dashboard', 'dashboard', 'Access dashboard'),
('users.manage', 'Manage Users', 'admin', 'Create and manage user accounts'),
('roles.manage', 'Manage Roles', 'admin', 'Manage roles and permissions'),
('settings.manage', 'Manage Settings', 'admin', 'Manage work schedules and settings'),
('employees.view', 'View Employees', 'employees', 'View employee list and profiles'),
('employees.manage', 'Manage Employees', 'employees', 'Create and edit employees'),
('attendance.view', 'View Attendance', 'attendance', 'View attendance records'),
('attendance.manage', 'Manage Attendance', 'attendance', 'Manage all attendance records'),
('attendance.self', 'Self Attendance', 'attendance', 'Clock in/out and view own attendance'),
('leave.view', 'View Leave', 'leave', 'View leave requests'),
('leave.manage', 'Manage Leave', 'leave', 'Approve and manage leave'),
('leave.self', 'Self Leave', 'leave', 'Submit and view own leave'),
('training.view', 'View Training', 'training', 'View training'),
('training.manage', 'Manage Training', 'training', 'Manage training'),
('projects.view', 'View Projects', 'projects', 'View projects'),
('projects.manage', 'Manage Projects', 'projects', 'Manage projects'),
('expenses.view', 'View Expenses', 'expenses', 'View expenses'),
('expenses.manage', 'Manage Expenses', 'expenses', 'Manage all expenses'),
('expenses.self', 'Self Expenses', 'expenses', 'Submit and view own expenses'),
('payroll.view', 'View Payroll', 'payroll', 'View payroll'),
('payroll.manage', 'Manage Payroll', 'payroll', 'Manage payroll'),
('finance.view', 'View Finance', 'finance', 'View finance'),
('finance.manage', 'Manage Finance', 'finance', 'Manage finance'),
('procurement.view', 'View Procurement', 'procurement', 'View procurement'),
('procurement.manage', 'Manage Procurement', 'procurement', 'Manage procurement'),
('performance.view', 'View Performance', 'performance', 'View performance'),
('performance.manage', 'Manage Performance', 'performance', 'Manage performance'),
('reports.view', 'View Reports', 'reports', 'View reports'),
('analytics.view', 'View Analytics', 'analytics', 'View analytics'),
('export.pdf', 'Export PDF', 'export', 'Export documents as PDF'),
('import.data', 'Import Data', 'export', 'Import CSV/data')
ON CONFLICT (code) DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 1, id FROM "Permissions"
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 2, id FROM "Permissions" WHERE code IN (
  'dashboard.view','employees.view','attendance.view','attendance.manage','attendance.self',
  'leave.view','leave.manage','leave.self','training.view','projects.view','projects.manage',
  'expenses.view','expenses.self','performance.view','reports.view','analytics.view',
  'export.pdf','payroll.view'
) ON CONFLICT DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 3, id FROM "Permissions" WHERE code IN (
  'dashboard.view','employees.view','employees.manage','attendance.view','attendance.manage','attendance.self',
  'leave.view','leave.manage','leave.self','training.view','training.manage','projects.view',
  'expenses.view','expenses.manage','performance.view','performance.manage','reports.view',
  'analytics.view','export.pdf','import.data','payroll.view','users.manage'
) ON CONFLICT DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 4, id FROM "Permissions" WHERE code IN (
  'dashboard.view','employees.view','expenses.view','expenses.manage','payroll.view','payroll.manage',
  'finance.view','finance.manage','procurement.view','procurement.manage','reports.view',
  'analytics.view','export.pdf','import.data','attendance.self','leave.self'
) ON CONFLICT DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 5, id FROM "Permissions" WHERE code IN (
  'dashboard.view','attendance.self','leave.self','expenses.self','training.view',
  'projects.view','export.pdf'
) ON CONFLICT DO NOTHING;

INSERT INTO "WorkSchedules" (day_of_week, is_workday, sign_in_time, sign_out_time, grace_minutes) VALUES
(0, 0, '09:00', '17:00', 15),
(1, 1, '09:00', '17:00', 15),
(2, 1, '09:00', '17:00', 15),
(3, 1, '09:00', '17:00', 15),
(4, 1, '09:00', '17:00', 15),
(5, 1, '09:00', '17:00', 15),
(6, 0, '09:00', '17:00', 15)
ON CONFLICT (day_of_week) DO NOTHING;

INSERT INTO "Departments" (name, description) VALUES
('Human Resources', 'HR Department'),
('IT', 'Information Technology'),
('Finance', 'Finance and Accounting'),
('Sales', 'Sales and Marketing'),
('Operations', 'Operations Department')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "LeaveTypes" (name, default_quota, status) VALUES
('Annual Leave', 21, 'Active'),
('Sick Leave', 7, 'Active'),
('Personal Leave', 3, 'Active'),
('Maternity Leave', 90, 'Active'),
('Paternity Leave', 7, 'Active')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "ExpenseCategories" (name, pre_approve) VALUES
('Travel', 'Yes'),
('Meals', 'No'),
('Accommodation', 'Yes'),
('Office Supplies', 'No'),
('Training', 'Yes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "ExpensePaymentMethods" (name) VALUES
('Cash'), ('Credit Card'), ('Debit Card'), ('Bank Transfer'), ('Company Card')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SalaryComponentTypes" (code, name) VALUES
('BASE', 'Base Salary'),
('BONUS', 'Bonus'),
('ALLOWANCE', 'Allowance'),
('DEDUCTION', 'Deduction'),
('BENEFIT', 'Benefit')
ON CONFLICT (code) DO NOTHING;

INSERT INTO "AccountTypes" (name, code, description) VALUES
('Bank Account', 'BANK', 'Bank accounts'),
('Cash Account', 'CASH', 'Cash accounts'),
('Accounts Receivable', 'AR', 'Money owed to company'),
('Accounts Payable', 'AP', 'Money company owes'),
('Revenue Account', 'REV', 'Income accounts'),
('Expense Account', 'EXP', 'Expense accounts')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "TransactionTypes" (name, code, category, description) VALUES
('Salary Payment', 'SAL', 'Expense', 'Employee salary payments'),
('Vendor Payment', 'VEN', 'Expense', 'Vendor invoice payments'),
('Purchase Payment', 'PUR', 'Expense', 'Purchase order payments'),
('Revenue', 'REV', 'Income', 'Business revenue'),
('Transfer', 'TRF', 'Transfer', 'Account transfers'),
('Adjustment', 'ADJ', 'Adjustment', 'Account adjustments')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "BudgetCategories" (name, code, description) VALUES
('Operations', 'OPS', 'Operational expenses'),
('Payroll', 'PAY', 'Employee compensation'),
('Procurement', 'PRO', 'Purchasing budget'),
('Capital Expenditure', 'CAPEX', 'Capital investments'),
('Marketing', 'MKT', 'Marketing expenses')
ON CONFLICT (name) DO NOTHING;

-- Default admin / admin123
INSERT INTO "Users" (username, email, password, user_level, is_active)
VALUES ('admin', 'admin@svlhrm.com', '$2b$10$VFFfne.tF6R8gpmcfHMJU.irD7z85qOJ9IdkiM/SO8nbcwAGSJWEm', 'Admin', 1)
ON CONFLICT (username) DO NOTHING;

INSERT INTO "UserRoles" (user_id, role_id)
SELECT u.id, 1 FROM "Users" u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;
