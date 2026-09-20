-- Documents + notifications enhancements (SQLite)

CREATE TABLE IF NOT EXISTS Documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    file_data TEXT,
    file_path TEXT,
    description TEXT,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(uploaded_by) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    status TEXT CHECK(status IN ('Unread', 'Read')) DEFAULT 'Unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ImmigrationDocuments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    details TEXT,
    required TEXT CHECK(required IN ('Yes', 'No')) DEFAULT 'Yes'
);

CREATE TABLE IF NOT EXISTS EmployeeImmigrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    document_id INTEGER,
    document_name TEXT NOT NULL,
    valid_until DATE,
    status TEXT DEFAULT 'Active',
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES Employees(id) ON DELETE CASCADE,
    FOREIGN KEY(document_id) REFERENCES ImmigrationDocuments(id) ON DELETE SET NULL
);

ALTER TABLE Documents ADD COLUMN category TEXT DEFAULT 'General';
ALTER TABLE Documents ADD COLUMN file_name TEXT;
ALTER TABLE Documents ADD COLUMN file_data TEXT;
ALTER TABLE Documents ADD COLUMN uploaded_by INTEGER;
ALTER TABLE Notifications ADD COLUMN link TEXT;

INSERT OR IGNORE INTO Permissions (code, name, module, description) VALUES
('documents.view', 'View Documents', 'documents', 'View employee documents'),
('documents.manage', 'Manage Documents', 'documents', 'Upload and manage documents');

INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 1, id FROM Permissions WHERE code IN ('documents.view', 'documents.manage');

INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 3, id FROM Permissions WHERE code IN ('documents.view', 'documents.manage');

INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 2, id FROM Permissions WHERE code = 'documents.view';

INSERT OR IGNORE INTO RolePermissions (role_id, permission_id)
SELECT 5, id FROM Permissions WHERE code = 'documents.view';
