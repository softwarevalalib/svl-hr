-- Migration: Add Advanced HR Features
-- This script adds all missing features for SVL Human Resource Management

-- ============= QUALIFICATIONS =============
CREATE TABLE IF NOT EXISTS Skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS Educations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS Certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS Languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

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

-- ============= TRAINING =============
CREATE TABLE IF NOT EXISTS Courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    coordinator_id INTEGER,
    trainer TEXT,
    payment_type TEXT DEFAULT 'Company Sponsored',
    cost REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(coordinator_id) REFERENCES Employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS TrainingSessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    scheduled DATETIME,
    due_date DATETIME,
    delivery_method TEXT DEFAULT 'Classroom',
    delivery_location TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS EmployeeTrainingSessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    training_session_id INTEGER NOT NULL,
    feedback TEXT,
    status TEXT DEFAULT 'Scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(training_session_id) REFERENCES TrainingSessions(id) ON DELETE CASCADE
);

-- ============= PROJECTS & TIMESHEETS =============
CREATE TABLE IF NOT EXISTS Projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    client_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS TimeSheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    project_id INTEGER,
    date DATE NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    hours REAL,
    notes TEXT,
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES Projects(id) ON DELETE SET NULL
);

-- ============= EXPENSES =============
CREATE TABLE IF NOT EXISTS ExpenseCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    pre_approve TEXT DEFAULT 'Yes'
);

CREATE TABLE IF NOT EXISTS ExpensePaymentMethods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

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
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(payment_method_id) REFERENCES ExpensePaymentMethods(id),
    FOREIGN KEY(category_id) REFERENCES ExpenseCategories(id)
);

-- ============= TRAVEL =============
CREATE TABLE IF NOT EXISTS EmployeeTravelRecords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type TEXT DEFAULT 'Local',
    purpose TEXT NOT NULL,
    travel_from TEXT NOT NULL,
    travel_to TEXT NOT NULL,
    travel_date DATETIME,
    return_date DATETIME,
    details TEXT,
    funding REAL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE
);

-- ============= OVERTIME =============
CREATE TABLE IF NOT EXISTS OvertimeCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS EmployeeOvertime (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    category_id INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(category_id) REFERENCES OvertimeCategories(id) ON DELETE SET NULL
);

-- ============= PERFORMANCE =============
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
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewer_id) REFERENCES Employees(id) ON DELETE SET NULL
);

-- ============= RECRUITMENT =============
CREATE TABLE IF NOT EXISTS JobPositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    department_id INTEGER,
    job_description TEXT,
    requirements TEXT,
    status TEXT DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(department_id) REFERENCES Departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position_id INTEGER,
    resume_path TEXT,
    status TEXT DEFAULT 'Applied',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(position_id) REFERENCES JobPositions(id) ON DELETE SET NULL
);

-- Seed data
INSERT OR IGNORE INTO Skills (name, description) VALUES
('JavaScript', 'Programming in JavaScript'),
('Python', 'Programming in Python'),
('Project Management', 'Project management skills');

INSERT OR IGNORE INTO ExpenseCategories (name, pre_approve) VALUES
('Travel', 'Yes'),
('Meals', 'No'),
('Office Supplies', 'No');

INSERT OR IGNORE INTO ExpensePaymentMethods (name) VALUES
('Cash'), ('Credit Card'), ('Debit Card');

INSERT OR IGNORE INTO OvertimeCategories (name) VALUES
('Regular Overtime'), ('Weekend Overtime');
