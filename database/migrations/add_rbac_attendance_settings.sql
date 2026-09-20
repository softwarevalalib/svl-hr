-- Migration: RBAC, Work Schedules, Attendance enhancements

CREATE TABLE IF NOT EXISTS Roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS RolePermissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY(role_id) REFERENCES Roles(id) ON DELETE CASCADE,
    FOREIGN KEY(permission_id) REFERENCES Permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS UserRoles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(role_id) REFERENCES Roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS WorkSchedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL UNIQUE CHECK(day_of_week BETWEEN 0 AND 6),
    is_workday INTEGER DEFAULT 1,
    sign_in_time TEXT DEFAULT '09:00',
    sign_out_time TEXT DEFAULT '17:00',
    grace_minutes INTEGER DEFAULT 15,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extend Users with active flag if missing (SQLite ignores if column exists via separate ALTERs below)
-- Attendance extensions applied via ALTER in migration runner if needed

INSERT OR IGNORE INTO Roles (id, name, description, is_system) VALUES
(1, 'Admin', 'Full system access', 1),
(2, 'Manager', 'Team and department oversight', 1),
(3, 'HR', 'Human resources operations', 1),
(4, 'Finance', 'Finance and payroll access', 1),
(5, 'Employee', 'Self-service employee access', 1);

INSERT OR IGNORE INTO Permissions (code, name, module, description) VALUES
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
('import.data', 'Import Data', 'export', 'Import CSV/data');

-- Admin: all permissions
INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 1, id FROM Permissions;

-- Manager
INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 2, id FROM Permissions WHERE code IN (
  'dashboard.view','employees.view','attendance.view','attendance.manage','attendance.self',
  'leave.view','leave.manage','leave.self','training.view','projects.view','projects.manage',
  'expenses.view','expenses.self','performance.view','reports.view','analytics.view',
  'export.pdf','payroll.view'
);

-- HR
INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 3, id FROM Permissions WHERE code IN (
  'dashboard.view','employees.view','employees.manage','attendance.view','attendance.manage','attendance.self',
  'leave.view','leave.manage','leave.self','training.view','training.manage','projects.view',
  'expenses.view','expenses.manage','performance.view','performance.manage','reports.view',
  'analytics.view','export.pdf','import.data','payroll.view','users.manage'
);

-- Finance
INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 4, id FROM Permissions WHERE code IN (
  'dashboard.view','employees.view','expenses.view','expenses.manage','payroll.view','payroll.manage',
  'finance.view','finance.manage','procurement.view','procurement.manage','reports.view',
  'analytics.view','export.pdf','import.data','attendance.self','leave.self'
);

-- Employee
INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 5, id FROM Permissions WHERE code IN (
  'dashboard.view','attendance.self','leave.self','expenses.self','training.view',
  'projects.view','export.pdf'
);

-- Default work schedule Mon-Fri 09:00-17:00
INSERT OR IGNORE INTO WorkSchedules (day_of_week, is_workday, sign_in_time, sign_out_time, grace_minutes) VALUES
(0, 0, '09:00', '17:00', 15),
(1, 1, '09:00', '17:00', 15),
(2, 1, '09:00', '17:00', 15),
(3, 1, '09:00', '17:00', 15),
(4, 1, '09:00', '17:00', 15),
(5, 1, '09:00', '17:00', 15),
(6, 0, '09:00', '17:00', 15);

-- Assign Admin role to existing Admin users
INSERT OR IGNORE INTO UserRoles (user_id, role_id)
SELECT id, 1 FROM Users WHERE user_level = 'Admin';

INSERT OR IGNORE INTO UserRoles (user_id, role_id)
SELECT id, 2 FROM Users WHERE user_level = 'Manager';

INSERT OR IGNORE INTO UserRoles (user_id, role_id)
SELECT id, 5 FROM Users WHERE user_level = 'Employee';
