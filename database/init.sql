-- SQLite Database Schema for SVL Human Resource Management - React + Node.js Version
-- Enhanced with all major HR features

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    employee_id INTEGER,
    user_level TEXT CHECK(user_level IN ('Admin', 'Employee', 'Manager')) DEFAULT 'Employee',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE SET NULL
);

-- Employees table (Enhanced)
CREATE TABLE IF NOT EXISTS Employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    marital_status TEXT,
    nationality TEXT,
    email TEXT,
    phone TEXT,
    mobile_phone TEXT,
    address1 TEXT,
    address2 TEXT,
    city TEXT,
    country TEXT,
    postal_code TEXT,
    joined_date DATE,
    employment_status TEXT,
    job_title TEXT,
    department TEXT,
    supervisor_id INTEGER,
    pay_grade TEXT,
    status TEXT CHECK(status IN ('Active', 'Inactive', 'Terminated')) DEFAULT 'Active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supervisor_id) REFERENCES Employees(id) ON DELETE SET NULL
);

-- Departments table
CREATE TABLE IF NOT EXISTS Departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    manager_id INTEGER,
    parent_department_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(manager_id) REFERENCES Employees(id) ON DELETE SET NULL,
    FOREIGN KEY(parent_department_id) REFERENCES Departments(id) ON DELETE SET NULL
);

-- Job Titles table
CREATE TABLE IF NOT EXISTS JobTitles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active'
);

-- Employment Status table
CREATE TABLE IF NOT EXISTS EmploymentStatus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- ============= QUALIFICATIONS =============
-- Skills table
CREATE TABLE IF NOT EXISTS Skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Educations table
CREATE TABLE IF NOT EXISTS Educations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Certifications table
CREATE TABLE IF NOT EXISTS Certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Languages table
CREATE TABLE IF NOT EXISTS Languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Employee Skills
CREATE TABLE IF NOT EXISTS EmployeeSkills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    skill_id INTEGER,
    skill_name TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(skill_id) REFERENCES Skills(id) ON DELETE SET NULL,
    UNIQUE(employee_id, skill_id)
);

-- Employee Educations
CREATE TABLE IF NOT EXISTS EmployeeEducations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    education_id INTEGER,
    education_name TEXT,
    institute TEXT,
    date_start DATE,
    date_end DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(education_id) REFERENCES Educations(id) ON DELETE SET NULL
);

-- Employee Certifications
CREATE TABLE IF NOT EXISTS EmployeeCertifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    certification_id INTEGER,
    certification_name TEXT,
    institute TEXT,
    date_start DATE,
    date_end DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(certification_id) REFERENCES Certifications(id) ON DELETE SET NULL,
    UNIQUE(employee_id, certification_id)
);

-- Employee Languages
CREATE TABLE IF NOT EXISTS EmployeeLanguages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    language_id INTEGER,
    language_name TEXT,
    reading TEXT,
    speaking TEXT,
    writing TEXT,
    understanding TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(language_id) REFERENCES Languages(id) ON DELETE SET NULL,
    UNIQUE(employee_id, language_id)
);

-- ============= EMERGENCY & DEPENDENTS =============
-- Emergency Contacts
CREATE TABLE IF NOT EXISTS EmergencyContacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT,
    home_phone TEXT,
    work_phone TEXT,
    mobile_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE
);

-- Employee Dependents
CREATE TABLE IF NOT EXISTS EmployeeDependents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT,
    date_of_birth DATE,
    id_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE
);

-- ============= ATTENDANCE & LEAVE =============
-- Attendance table
CREATE TABLE IF NOT EXISTS Attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    in_time DATETIME,
    out_time DATETIME,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
);

-- Overtime Categories
CREATE TABLE IF NOT EXISTS OvertimeCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Employee Overtime
CREATE TABLE IF NOT EXISTS EmployeeOvertime (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    category_id INTEGER,
    notes TEXT,
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(category_id) REFERENCES OvertimeCategories(id) ON DELETE SET NULL
);

-- Leave Types table
CREATE TABLE IF NOT EXISTS LeaveTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    default_quota INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active'
);

-- Leave Requests table
CREATE TABLE IF NOT EXISTS LeaveRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type_id INTEGER NOT NULL,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    days REAL NOT NULL,
    reason TEXT,
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    approved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(leave_type_id) REFERENCES LeaveTypes(id),
    FOREIGN KEY(approved_by) REFERENCES Employees(id) ON DELETE SET NULL
);

-- ============= TRAINING =============
-- Courses table
CREATE TABLE IF NOT EXISTS Courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    coordinator_id INTEGER,
    trainer TEXT,
    payment_type TEXT CHECK(payment_type IN ('Company Sponsored', 'Paid by Employee')) DEFAULT 'Company Sponsored',
    cost REAL DEFAULT 0,
    status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(coordinator_id) REFERENCES Employees(id) ON DELETE SET NULL
);

-- Training Sessions
CREATE TABLE IF NOT EXISTS TrainingSessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    scheduled DATETIME,
    due_date DATETIME,
    delivery_method TEXT CHECK(delivery_method IN ('Classroom', 'Self Study', 'Online')) DEFAULT 'Classroom',
    delivery_location TEXT,
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

-- Employee Training Sessions
CREATE TABLE IF NOT EXISTS EmployeeTrainingSessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    training_session_id INTEGER NOT NULL,
    feedback TEXT,
    status TEXT CHECK(status IN ('Scheduled', 'Attended', 'Not-Attended', 'Completed')) DEFAULT 'Scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(training_session_id) REFERENCES TrainingSessions(id) ON DELETE CASCADE
);

-- ============= PROJECTS & TIMESHEETS =============
-- Projects table
CREATE TABLE IF NOT EXISTS Projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    client_name TEXT,
    description TEXT,
    status TEXT CHECK(status IN ('Active', 'Completed', 'On Hold')) DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employee Projects
CREATE TABLE IF NOT EXISTS EmployeeProjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    role TEXT,
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES Projects(id) ON DELETE CASCADE
);

-- Time Sheets
CREATE TABLE IF NOT EXISTS TimeSheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    project_id INTEGER,
    date DATE NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    hours REAL,
    notes TEXT,
    status TEXT CHECK(status IN ('Draft', 'Submitted', 'Approved', 'Rejected')) DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES Projects(id) ON DELETE SET NULL
);

-- ============= PAYROLL & SALARY =============
-- Salary Components Type
CREATE TABLE IF NOT EXISTS SalaryComponentTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
);

-- Salary Components
CREATE TABLE IF NOT EXISTS SalaryComponents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    component_type_id INTEGER,
    details TEXT,
    FOREIGN KEY(component_type_id) REFERENCES SalaryComponentTypes(id) ON DELETE SET NULL
);

-- Employee Salary
CREATE TABLE IF NOT EXISTS EmployeeSalary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    component_id INTEGER,
    component_name TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    effective_date DATE,
    end_date DATE,
    status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(component_id) REFERENCES SalaryComponents(id) ON DELETE SET NULL
);

-- ============= EXPENSES =============
-- Expense Categories
CREATE TABLE IF NOT EXISTS ExpenseCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    pre_approve TEXT CHECK(pre_approve IN ('Yes', 'No')) DEFAULT 'Yes'
);

-- Expense Payment Methods
CREATE TABLE IF NOT EXISTS ExpensePaymentMethods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Employee Expenses
CREATE TABLE IF NOT EXISTS EmployeeExpenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    expense_date DATE NOT NULL,
    payment_method_id INTEGER NOT NULL,
    transaction_no TEXT,
    payee TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    notes TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(payment_method_id) REFERENCES ExpensePaymentMethods(id),
    FOREIGN KEY(category_id) REFERENCES ExpenseCategories(id)
);

-- ============= TRAVEL =============
-- Employee Travel Records
CREATE TABLE IF NOT EXISTS EmployeeTravelRecords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('Local', 'International')) DEFAULT 'Local',
    purpose TEXT NOT NULL,
    travel_from TEXT NOT NULL,
    travel_to TEXT NOT NULL,
    travel_date DATETIME,
    return_date DATETIME,
    details TEXT,
    funding REAL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE
);

-- ============= LOANS =============
-- Company Loans
CREATE TABLE IF NOT EXISTS CompanyLoans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    details TEXT
);

-- Employee Company Loans
CREATE TABLE IF NOT EXISTS EmployeeCompanyLoans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    loan_id INTEGER,
    start_date DATE NOT NULL,
    last_installment_date DATE NOT NULL,
    period_months INTEGER,
    currency TEXT DEFAULT 'USD',
    amount REAL NOT NULL,
    monthly_installment REAL NOT NULL,
    status TEXT CHECK(status IN ('Approved', 'Repayment', 'Paid', 'Suspended')) DEFAULT 'Approved',
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(loan_id) REFERENCES CompanyLoans(id) ON DELETE SET NULL
);

-- ============= DOCUMENTS =============
-- Documents table
CREATE TABLE IF NOT EXISTS Documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE
);

-- ============= IMMIGRATION =============
-- Immigration Documents
CREATE TABLE IF NOT EXISTS ImmigrationDocuments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    details TEXT,
    required TEXT CHECK(required IN ('Yes', 'No')) DEFAULT 'Yes'
);

-- Employee Immigration
CREATE TABLE IF NOT EXISTS EmployeeImmigrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    document_id INTEGER,
    document_name TEXT NOT NULL,
    valid_until DATE NOT NULL,
    status TEXT CHECK(status IN ('Active', 'Inactive', 'Draft')) DEFAULT 'Active',
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(document_id) REFERENCES ImmigrationDocuments(id) ON DELETE SET NULL
);

-- ============= PERFORMANCE =============
-- Performance Reviews (Advanced Feature)
CREATE TABLE IF NOT EXISTS PerformanceReviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_date DATE,
    reviewer_id INTEGER,
    overall_rating REAL,
    comments TEXT,
    goals TEXT,
    achievements TEXT,
    areas_for_improvement TEXT,
    status TEXT CHECK(status IN ('Draft', 'Submitted', 'Completed')) DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewer_id) REFERENCES Employees(id) ON DELETE SET NULL
);

-- ============= RECRUITMENT =============
-- Job Positions
CREATE TABLE IF NOT EXISTS JobPositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    department_id INTEGER,
    job_description TEXT,
    requirements TEXT,
    status TEXT CHECK(status IN ('Open', 'Closed', 'On Hold')) DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(department_id) REFERENCES Departments(id) ON DELETE SET NULL
);

-- Candidates
CREATE TABLE IF NOT EXISTS Candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position_id INTEGER,
    resume_path TEXT,
    status TEXT CHECK(status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Hired')) DEFAULT 'Applied',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(position_id) REFERENCES JobPositions(id) ON DELETE SET NULL
);

-- ============= NOTIFICATIONS =============
-- Notifications
CREATE TABLE IF NOT EXISTS Notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    status TEXT CHECK(status IN ('Unread', 'Read')) DEFAULT 'Unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ============= REPORTS =============
-- User Reports
CREATE TABLE IF NOT EXISTS UserReports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    query TEXT,
    parameters TEXT,
    output_type TEXT DEFAULT 'CSV',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============= SETTINGS & AUDIT =============
-- Settings table
CREATE TABLE IF NOT EXISTS Settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS AuditLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES Users(id)
);

-- ============= SEED DATA =============
-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO Users (username, email, password, user_level) 
VALUES ('admin', 'admin@svlhrm.com', '$2b$10$VFFfne.tF6R8gpmcfHMJU.irD7z85qOJ9IdkiM/SO8nbcwAGSJWEm', 'Admin');

-- Insert default employee statuses
INSERT OR IGNORE INTO EmploymentStatus (name, description) VALUES
('Full Time', 'Full-time permanent employee'),
('Part Time', 'Part-time employee'),
('Contract', 'Contract-based employee'),
('Intern', 'Internship position');

-- Insert default leave types
INSERT OR IGNORE INTO LeaveTypes (name, default_quota, status) VALUES
('Annual Leave', 21, 'Active'),
('Sick Leave', 7, 'Active'),
('Personal Leave', 3, 'Active'),
('Maternity Leave', 90, 'Active'),
('Paternity Leave', 7, 'Active');

-- Insert default departments
INSERT OR IGNORE INTO Departments (name, description) VALUES
('Human Resources', 'HR Department'),
('IT', 'Information Technology'),
('Finance', 'Finance and Accounting'),
('Sales', 'Sales and Marketing'),
('Operations', 'Operations Department');

-- Insert default job titles
INSERT OR IGNORE INTO JobTitles (code, name, description, status) VALUES
('CEO', 'Chief Executive Officer', 'Top-level executive', 'Active'),
('HR_MGR', 'HR Manager', 'Human Resources Manager', 'Active'),
('DEV', 'Developer', 'Software Developer', 'Active'),
('ACC', 'Accountant', 'Financial Accountant', 'Active'),
('MGR', 'Manager', 'General Manager', 'Active');

-- Insert default skills
INSERT OR IGNORE INTO Skills (name, description) VALUES
('JavaScript', 'Programming in JavaScript'),
('Python', 'Programming in Python'),
('Project Management', 'Project management skills'),
('Communication', 'Communication skills'),
('Leadership', 'Leadership abilities');

-- Insert default educations
INSERT OR IGNORE INTO Educations (name, description) VALUES
('Bachelor Degree', 'Bachelor\'s degree'),
('Master Degree', 'Master\'s degree'),
('PhD', 'Doctoral degree'),
('Diploma', 'Diploma certification');

-- Insert default certifications
INSERT OR IGNORE INTO Certifications (name, description) VALUES
('PMP', 'Project Management Professional'),
('AWS Certified', 'Amazon Web Services Certification'),
('Google Cloud', 'Google Cloud Platform Certification'),
('Microsoft Certified', 'Microsoft Technology Certification');

-- Insert default languages
INSERT OR IGNORE INTO Languages (name, description) VALUES
('English', 'English language'),
('Spanish', 'Spanish language'),
('French', 'French language'),
('German', 'German language');

-- Insert default expense categories
INSERT OR IGNORE INTO ExpenseCategories (name, pre_approve) VALUES
('Travel', 'Yes'),
('Meals', 'No'),
('Accommodation', 'Yes'),
('Office Supplies', 'No'),
('Training', 'Yes');

-- Insert default expense payment methods
INSERT OR IGNORE INTO ExpensePaymentMethods (name) VALUES
('Cash'),
('Credit Card'),
('Debit Card'),
('Bank Transfer'),
('Company Card');

-- Insert default overtime categories
INSERT OR IGNORE INTO OvertimeCategories (name) VALUES
('Regular Overtime'),
('Weekend Overtime'),
('Holiday Overtime'),
('Emergency Overtime');

-- Insert default salary component types
INSERT OR IGNORE INTO SalaryComponentTypes (code, name) VALUES
('BASE', 'Base Salary'),
('BONUS', 'Bonus'),
('ALLOWANCE', 'Allowance'),
('DEDUCTION', 'Deduction'),
('BENEFIT', 'Benefit');

-- Insert default immigration documents
INSERT OR IGNORE INTO ImmigrationDocuments (name, details, required) VALUES
('Passport', 'Valid passport', 'Yes'),
('Work Visa', 'Work authorization visa', 'Yes'),
('Work Permit', 'Work permit document', 'Yes'),
('Residence Permit', 'Residence permit', 'No');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_status ON Employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON Employees(department);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON Attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON LeaveRequests(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_date ON AuditLog(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON Notifications(user_id, status);

