-- Migration: Add Payroll, Finance, and Procurement Management Features
-- This script adds comprehensive payroll, finance, and procurement capabilities

-- ============= CURRENCIES =============
CREATE TABLE IF NOT EXISTS CurrencyTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT,
    decimal_places INTEGER DEFAULT 2
);

-- ============= PAYROLL - SALARY COMPONENTS =============
CREATE TABLE IF NOT EXISTS PayFrequency (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    days INTEGER,
    description TEXT
);

CREATE TABLE IF NOT EXISTS PayGrades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    currency TEXT DEFAULT 'USD',
    min_salary REAL DEFAULT 0,
    max_salary REAL DEFAULT 0,
    description TEXT,
    FOREIGN KEY(currency) REFERENCES CurrencyTypes(code)
);

CREATE TABLE IF NOT EXISTS SalaryComponentTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS SalaryComponents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    component_type_id INTEGER,
    details TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(component_type_id) REFERENCES SalaryComponentTypes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS EmployeeSalaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    component_id INTEGER NOT NULL,
    pay_frequency TEXT CHECK(pay_frequency IN ('Hourly', 'Daily', 'Bi Weekly', 'Weekly', 'Semi Monthly', 'Monthly')),
    currency TEXT DEFAULT 'USD',
    amount REAL NOT NULL,
    effective_date DATE,
    end_date DATE,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(component_id) REFERENCES SalaryComponents(id) ON DELETE CASCADE
);

-- ============= PAYROLL - DEDUCTIONS =============
CREATE TABLE IF NOT EXISTS DeductionGroups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS Deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    deduction_group_id INTEGER,
    component_type TEXT,
    component_id INTEGER,
    calculation_method TEXT,
    amount REAL,
    percentage REAL,
    is_active INTEGER DEFAULT 1,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(deduction_group_id) REFERENCES DeductionGroups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS PayrollEmployees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL UNIQUE,
    pay_frequency TEXT,
    currency TEXT DEFAULT 'USD',
    deduction_group_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(deduction_group_id) REFERENCES DeductionGroups(id) ON DELETE SET NULL
);

-- ============= PAYROLL - PROCESSING =============
CREATE TABLE IF NOT EXISTS PayrollColumns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    column_order INTEGER,
    calculation_hook TEXT,
    editable INTEGER DEFAULT 1,
    enabled INTEGER DEFAULT 1,
    default_value TEXT,
    calculation_function TEXT,
    details TEXT
);

CREATE TABLE IF NOT EXISTS PayrollColumnTemplates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    columns TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pay_period TEXT,
    department_id INTEGER,
    column_template_id INTEGER,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    status TEXT CHECK(status IN ('Draft', 'Processing', 'Completed', 'Approved')) DEFAULT 'Draft',
    total_amount REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(department_id) REFERENCES Departments(id) ON DELETE SET NULL,
    FOREIGN KEY(column_template_id) REFERENCES PayrollColumnTemplates(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS PayrollData (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    payroll_column_id INTEGER,
    amount REAL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(payroll_id) REFERENCES Payroll(id) ON DELETE CASCADE,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(payroll_column_id) REFERENCES PayrollColumns(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Payslips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    pay_period_start DATE,
    pay_period_end DATE,
    gross_salary REAL DEFAULT 0,
    total_deductions REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK(status IN ('Generated', 'Sent', 'Approved')) DEFAULT 'Generated',
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME,
    FOREIGN KEY(payroll_id) REFERENCES Payroll(id) ON DELETE CASCADE,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE
);

-- ============= FINANCE - ACCOUNTS =============
CREATE TABLE IF NOT EXISTS AccountTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS FinancialAccounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_number TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    account_type_id INTEGER,
    currency TEXT DEFAULT 'USD',
    opening_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    bank_name TEXT,
    branch TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_type_id) REFERENCES AccountTypes(id) ON DELETE SET NULL
);

-- ============= FINANCE - TRANSACTIONS =============
CREATE TABLE IF NOT EXISTS TransactionTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    category TEXT CHECK(category IN ('Income', 'Expense', 'Transfer', 'Adjustment')),
    description TEXT
);

CREATE TABLE IF NOT EXISTS FinancialTransactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_number TEXT UNIQUE,
    account_id INTEGER NOT NULL,
    transaction_type_id INTEGER,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_number TEXT,
    category TEXT,
    status TEXT CHECK(status IN ('Pending', 'Completed', 'Cancelled', 'Reversed')) DEFAULT 'Pending',
    created_by INTEGER,
    approved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES FinancialAccounts(id) ON DELETE CASCADE,
    FOREIGN KEY(transaction_type_id) REFERENCES TransactionTypes(id) ON DELETE SET NULL,
    FOREIGN KEY(created_by) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY(approved_by) REFERENCES Users(id) ON DELETE SET NULL
);

-- ============= FINANCE - BUDGETS =============
CREATE TABLE IF NOT EXISTS BudgetCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    parent_id INTEGER,
    description TEXT,
    FOREIGN KEY(parent_id) REFERENCES BudgetCategories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget_category_id INTEGER,
    fiscal_year INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    allocated_amount REAL NOT NULL,
    spent_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK(status IN ('Draft', 'Active', 'Closed')) DEFAULT 'Draft',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(budget_category_id) REFERENCES BudgetCategories(id) ON DELETE SET NULL
);

-- ============= PROCUREMENT - VENDORS =============
CREATE TABLE IF NOT EXISTS Vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    status TEXT CHECK(status IN ('Active', 'Inactive', 'Blacklisted')) DEFAULT 'Active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============= PROCUREMENT - ITEMS =============
CREATE TABLE IF NOT EXISTS ItemCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    description TEXT,
    parent_id INTEGER,
    FOREIGN KEY(parent_id) REFERENCES ItemCategories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    unit TEXT,
    unit_price REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES ItemCategories(id) ON DELETE SET NULL
);

-- ============= PROCUREMENT - REQUESTS =============
CREATE TABLE IF NOT EXISTS PurchaseRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_number TEXT NOT NULL UNIQUE,
    requested_by INTEGER NOT NULL,
    department_id INTEGER,
    request_date DATE NOT NULL,
    required_date DATE,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    purpose TEXT,
    total_estimated_cost REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK(status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Cancelled')) DEFAULT 'Draft',
    approved_by INTEGER,
    approved_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(requested_by) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES Departments(id) ON DELETE SET NULL,
    FOREIGN KEY(approved_by) REFERENCES Employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS PurchaseRequestItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_request_id INTEGER NOT NULL,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT,
    estimated_unit_price REAL DEFAULT 0,
    estimated_total REAL,
    notes TEXT,
    FOREIGN KEY(purchase_request_id) REFERENCES PurchaseRequests(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES Items(id) ON DELETE SET NULL
);

-- ============= PROCUREMENT - BIDDING =============
CREATE TABLE IF NOT EXISTS BidOpportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_number TEXT NOT NULL UNIQUE,
    purchase_request_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    bid_opening_date DATETIME,
    bid_closing_date DATETIME NOT NULL,
    estimated_value REAL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK(status IN ('Open', 'Closed', 'Awarded', 'Cancelled')) DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(purchase_request_id) REFERENCES PurchaseRequests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bid_opportunity_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    bid_number TEXT NOT NULL UNIQUE,
    total_amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    bid_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    validity_period INTEGER,
    delivery_time INTEGER,
    terms TEXT,
    status TEXT CHECK(status IN ('Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn')) DEFAULT 'Submitted',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bid_opportunity_id) REFERENCES BidOpportunities(id) ON DELETE CASCADE,
    FOREIGN KEY(vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BidItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bid_id INTEGER NOT NULL,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT,
    unit_price REAL NOT NULL,
    total_price REAL,
    notes TEXT,
    FOREIGN KEY(bid_id) REFERENCES Bids(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES Items(id) ON DELETE SET NULL
);

-- ============= PROCUREMENT - PURCHASE ORDERS =============
CREATE TABLE IF NOT EXISTS PurchaseOrders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number TEXT NOT NULL UNIQUE,
    bid_id INTEGER,
    purchase_request_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_terms TEXT,
    shipping_address TEXT,
    status TEXT CHECK(status IN ('Draft', 'Sent', 'Confirmed', 'Partially Received', 'Completed', 'Cancelled')) DEFAULT 'Draft',
    created_by INTEGER,
    approved_by INTEGER,
    approved_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bid_id) REFERENCES Bids(id) ON DELETE SET NULL,
    FOREIGN KEY(purchase_request_id) REFERENCES PurchaseRequests(id) ON DELETE CASCADE,
    FOREIGN KEY(vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE,
    FOREIGN KEY(created_by) REFERENCES Employees(id) ON DELETE SET NULL,
    FOREIGN KEY(approved_by) REFERENCES Employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS PurchaseOrderItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT,
    unit_price REAL NOT NULL,
    total_price REAL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY(purchase_order_id) REFERENCES PurchaseOrders(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES Items(id) ON DELETE SET NULL
);

-- ============= PROCUREMENT - RECEIVING =============
CREATE TABLE IF NOT EXISTS ReceivingNotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receiving_number TEXT NOT NULL UNIQUE,
    purchase_order_id INTEGER NOT NULL,
    received_by INTEGER,
    received_date DATE NOT NULL,
    status TEXT CHECK(status IN ('Draft', 'Completed', 'Cancelled')) DEFAULT 'Draft',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(purchase_order_id) REFERENCES PurchaseOrders(id) ON DELETE CASCADE,
    FOREIGN KEY(received_by) REFERENCES Employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ReceivingNoteItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receiving_note_id INTEGER NOT NULL,
    po_item_id INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL,
    condition TEXT,
    notes TEXT,
    FOREIGN KEY(receiving_note_id) REFERENCES ReceivingNotes(id) ON DELETE CASCADE,
    FOREIGN KEY(po_item_id) REFERENCES PurchaseOrderItems(id) ON DELETE CASCADE
);

-- ============= SEED DATA =============
-- Currencies
INSERT OR IGNORE INTO CurrencyTypes (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 2),
('JPY', 'Japanese Yen', '¥', 0);

-- Pay Frequencies
INSERT OR IGNORE INTO PayFrequency (name, days, description) VALUES
('Monthly', 30, 'Monthly payment'),
('Semi Monthly', 15, 'Twice per month'),
('Bi Weekly', 14, 'Every two weeks'),
('Weekly', 7, 'Weekly payment'),
('Daily', 1, 'Daily payment'),
('Hourly', 0, 'Hourly payment');

-- Salary Component Types
INSERT OR IGNORE INTO SalaryComponentTypes (code, name, description) VALUES
('BASE', 'Base Salary', 'Base salary component'),
('BONUS', 'Bonus', 'Bonus payment'),
('ALLOWANCE', 'Allowance', 'Various allowances'),
('DEDUCTION', 'Deduction', 'Salary deductions'),
('BENEFIT', 'Benefit', 'Employee benefits');

-- Salary Components
INSERT OR IGNORE INTO SalaryComponents (name, component_type_id, details) VALUES
('Basic Salary', 1, 'Basic monthly salary'),
('Housing Allowance', 3, 'Housing accommodation allowance'),
('Transport Allowance', 3, 'Transportation allowance'),
('Tax Deduction', 4, 'Income tax deduction'),
('Insurance Deduction', 4, 'Health insurance deduction');

-- Account Types
INSERT OR IGNORE INTO AccountTypes (name, code, description) VALUES
('Bank Account', 'BANK', 'Bank accounts'),
('Cash Account', 'CASH', 'Cash accounts'),
('Accounts Receivable', 'AR', 'Money owed to company'),
('Accounts Payable', 'AP', 'Money company owes'),
('Revenue Account', 'REV', 'Income accounts'),
('Expense Account', 'EXP', 'Expense accounts');

-- Transaction Types
INSERT OR IGNORE INTO TransactionTypes (name, code, category, description) VALUES
('Salary Payment', 'SAL', 'Expense', 'Employee salary payments'),
('Vendor Payment', 'VEN', 'Expense', 'Vendor invoice payments'),
('Purchase Payment', 'PUR', 'Expense', 'Purchase order payments'),
('Revenue', 'REV', 'Income', 'Business revenue'),
('Transfer', 'TRF', 'Transfer', 'Account transfers'),
('Adjustment', 'ADJ', 'Adjustment', 'Account adjustments');

-- Budget Categories
INSERT OR IGNORE INTO BudgetCategories (name, code, description) VALUES
('Operations', 'OPS', 'Operational expenses'),
('Payroll', 'PAY', 'Employee compensation'),
('Procurement', 'PRO', 'Purchasing budget'),
('Capital Expenditure', 'CAPEX', 'Capital investments'),
('Marketing', 'MKT', 'Marketing expenses');

-- Item Categories
INSERT OR IGNORE INTO ItemCategories (name, code, description) VALUES
('Office Supplies', 'OFF', 'Office equipment and supplies'),
('IT Equipment', 'IT', 'Computers and IT equipment'),
('Furniture', 'FUR', 'Office furniture'),
('Maintenance', 'MAIN', 'Maintenance supplies'),
('Raw Materials', 'RAW', 'Raw materials for production');
