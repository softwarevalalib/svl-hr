-- PostgreSQL schema for SVL HRM on Neon
-- Table names are quoted to match existing SQLite / route SQL

CREATE TABLE IF NOT EXISTS "Employees" (
    id SERIAL PRIMARY KEY,
    employee_id TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    date_of_birth DATE,
    gender TEXT,
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
    supervisor_id INTEGER REFERENCES "Employees"(id) ON DELETE SET NULL,
    pay_grade TEXT,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    employee_id INTEGER REFERENCES "Employees"(id) ON DELETE SET NULL,
    user_level TEXT DEFAULT 'Employee',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Departments" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    manager_id INTEGER REFERENCES "Employees"(id) ON DELETE SET NULL,
    parent_department_id INTEGER REFERENCES "Departments"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "JobTitles" (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS "EmploymentStatus" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "Skills" (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT);
CREATE TABLE IF NOT EXISTS "Educations" (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT);
CREATE TABLE IF NOT EXISTS "Certifications" (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT);
CREATE TABLE IF NOT EXISTS "Languages" (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT);

CREATE TABLE IF NOT EXISTS "EmployeeSkills" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES "Skills"(id) ON DELETE SET NULL,
    skill_name TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmployeeEducations" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    education_id INTEGER REFERENCES "Educations"(id) ON DELETE SET NULL,
    education_name TEXT,
    institute TEXT,
    date_start DATE,
    date_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmployeeCertifications" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    certification_id INTEGER REFERENCES "Certifications"(id) ON DELETE SET NULL,
    certification_name TEXT,
    institute TEXT,
    date_start DATE,
    date_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmployeeLanguages" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES "Languages"(id) ON DELETE SET NULL,
    language_name TEXT,
    reading TEXT, speaking TEXT, writing TEXT, understanding TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmergencyContacts" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    home_phone TEXT, work_phone TEXT, mobile_phone TEXT
);

CREATE TABLE IF NOT EXISTS "EmployeeDependents" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    date_of_birth DATE,
    id_number TEXT
);

CREATE TABLE IF NOT EXISTS "Attendance" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    in_time TEXT,
    out_time TEXT,
    note TEXT,
    status TEXT DEFAULT 'Present',
    signed_in_at TIMESTAMP,
    signed_out_at TIMESTAMP,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS "OvertimeCategories" (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS "EmployeeOvertime" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES "OvertimeCategories"(id) ON DELETE SET NULL,
    start_time TIMESTAMP, end_time TIMESTAMP, notes TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LeaveTypes" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    default_quota REAL DEFAULT 0,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS "LeaveRequests" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES "LeaveTypes"(id),
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    days REAL,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    approved_by INTEGER REFERENCES "Employees"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Courses" (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    coordinator_id INTEGER,
    trainer TEXT,
    payment_type TEXT,
    cost REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TrainingSessions" (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES "Courses"(id) ON DELETE CASCADE,
    name TEXT,
    scheduled TIMESTAMP,
    location TEXT,
    status TEXT DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmployeeTrainingSessions" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    training_session_id INTEGER NOT NULL REFERENCES "TrainingSessions"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Enrolled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Projects" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    client_name TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmployeeProjects" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES "Projects"(id) ON DELETE CASCADE,
    role TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TimeSheets" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES "Projects"(id) ON DELETE SET NULL,
    date DATE,
    hours REAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SalaryComponentTypes" (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "SalaryComponents" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    component_type_id INTEGER REFERENCES "SalaryComponentTypes"(id) ON DELETE SET NULL,
    details TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmployeeSalaries" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES "SalaryComponents"(id) ON DELETE CASCADE,
    pay_frequency TEXT,
    currency TEXT DEFAULT 'USD',
    amount REAL NOT NULL,
    effective_date DATE,
    end_date DATE,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ExpenseCategories" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    pre_approve TEXT
);

CREATE TABLE IF NOT EXISTS "ExpensePaymentMethods" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "EmployeeExpenses" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES "Employees"(id) ON DELETE CASCADE,
    expense_date DATE,
    payment_method_id INTEGER REFERENCES "ExpensePaymentMethods"(id),
    transaction_no TEXT,
    payee TEXT,
    category_id INTEGER REFERENCES "ExpenseCategories"(id),
    notes TEXT,
    amount REAL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PerformanceReviews" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES "Employees"(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES "Employees"(id),
    review_date DATE,
    rating REAL,
    comments TEXT,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Settings" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Roles" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Permissions" (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "RolePermissions" (
    role_id INTEGER NOT NULL REFERENCES "Roles"(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES "Permissions"(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS "UserRoles" (
    user_id INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES "Roles"(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS "WorkSchedules" (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL UNIQUE CHECK(day_of_week BETWEEN 0 AND 6),
    is_workday INTEGER DEFAULT 1,
    sign_in_time TEXT DEFAULT '09:00',
    sign_out_time TEXT DEFAULT '17:00',
    grace_minutes INTEGER DEFAULT 15,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Payroll" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    pay_period TEXT,
    department_id INTEGER REFERENCES "Departments"(id) ON DELETE SET NULL,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    status TEXT DEFAULT 'Draft',
    total_amount REAL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PayrollData" (
    id SERIAL PRIMARY KEY,
    payroll_id INTEGER NOT NULL REFERENCES "Payroll"(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    payroll_column_id INTEGER,
    amount REAL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Payslips" (
    id SERIAL PRIMARY KEY,
    payroll_id INTEGER NOT NULL REFERENCES "Payroll"(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    pay_period_start DATE,
    pay_period_end DATE,
    gross_salary REAL DEFAULT 0,
    total_deductions REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'Generated',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AccountTypes" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "FinancialAccounts" (
    id SERIAL PRIMARY KEY,
    account_number TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    account_type_id INTEGER REFERENCES "AccountTypes"(id) ON DELETE SET NULL,
    currency TEXT DEFAULT 'USD',
    opening_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    bank_name TEXT,
    branch TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TransactionTypes" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    category TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "FinancialTransactions" (
    id SERIAL PRIMARY KEY,
    transaction_number TEXT UNIQUE,
    account_id INTEGER NOT NULL REFERENCES "FinancialAccounts"(id) ON DELETE CASCADE,
    transaction_type_id INTEGER REFERENCES "TransactionTypes"(id) ON DELETE SET NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_number TEXT,
    category TEXT,
    status TEXT DEFAULT 'Pending',
    created_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BudgetCategories" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    parent_id INTEGER REFERENCES "BudgetCategories"(id) ON DELETE SET NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "Budgets" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    budget_category_id INTEGER REFERENCES "BudgetCategories"(id) ON DELETE SET NULL,
    fiscal_year INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    allocated_amount REAL NOT NULL,
    spent_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Vendors" (
    id SERIAL PRIMARY KEY,
    vendor_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    tax_id TEXT,
    payment_terms TEXT,
    currency TEXT DEFAULT 'USD',
    rating REAL,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ItemCategories" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES "ItemCategories"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Items" (
    id SERIAL PRIMARY KEY,
    item_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES "ItemCategories"(id) ON DELETE SET NULL,
    unit TEXT,
    unit_price REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PurchaseRequests" (
    id SERIAL PRIMARY KEY,
    request_number TEXT NOT NULL UNIQUE,
    requested_by INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES "Departments"(id) ON DELETE SET NULL,
    request_date DATE NOT NULL,
    required_date DATE,
    priority TEXT DEFAULT 'Medium',
    purpose TEXT,
    total_estimated_cost REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'Draft',
    approved_by INTEGER REFERENCES "Employees"(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PurchaseRequestItems" (
    id SERIAL PRIMARY KEY,
    purchase_request_id INTEGER NOT NULL REFERENCES "PurchaseRequests"(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES "Items"(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT,
    estimated_unit_price REAL DEFAULT 0,
    estimated_total REAL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS "BidOpportunities" (
    id SERIAL PRIMARY KEY,
    opportunity_number TEXT NOT NULL UNIQUE,
    purchase_request_id INTEGER NOT NULL REFERENCES "PurchaseRequests"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    bid_opening_date TIMESTAMP,
    bid_closing_date TIMESTAMP NOT NULL,
    estimated_value REAL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Bids" (
    id SERIAL PRIMARY KEY,
    bid_opportunity_id INTEGER NOT NULL REFERENCES "BidOpportunities"(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES "Vendors"(id) ON DELETE CASCADE,
    bid_number TEXT NOT NULL UNIQUE,
    total_amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    bid_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validity_period INTEGER,
    delivery_time INTEGER,
    terms TEXT,
    status TEXT DEFAULT 'Submitted',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BidItems" (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER NOT NULL REFERENCES "Bids"(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES "Items"(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT,
    unit_price REAL NOT NULL,
    total_price REAL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS "PurchaseOrders" (
    id SERIAL PRIMARY KEY,
    po_number TEXT NOT NULL UNIQUE,
    bid_id INTEGER REFERENCES "Bids"(id) ON DELETE SET NULL,
    purchase_request_id INTEGER NOT NULL REFERENCES "PurchaseRequests"(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES "Vendors"(id) ON DELETE CASCADE,
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_terms TEXT,
    shipping_address TEXT,
    status TEXT DEFAULT 'Draft',
    created_by INTEGER REFERENCES "Employees"(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES "Employees"(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PurchaseOrderItems" (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES "PurchaseOrders"(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES "Items"(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT,
    unit_price REAL NOT NULL,
    total_price REAL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT
);
