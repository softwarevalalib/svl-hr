-- Extra tables for documents and notifications

CREATE TABLE IF NOT EXISTS "Documents" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES "Employees"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    file_data TEXT,
    file_path TEXT,
    description TEXT,
    uploaded_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Notifications" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    status TEXT DEFAULT 'Unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ImmigrationDocuments" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    details TEXT,
    required TEXT DEFAULT 'Yes'
);

CREATE TABLE IF NOT EXISTS "EmployeeImmigrations" (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES "Employees"(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES "ImmigrationDocuments"(id) ON DELETE SET NULL,
    document_name TEXT NOT NULL,
    valid_until DATE,
    status TEXT DEFAULT 'Active',
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Permissions" (code, name, module, description) VALUES
('documents.view', 'View Documents', 'documents', 'View employee documents'),
('documents.manage', 'Manage Documents', 'documents', 'Upload and manage documents')
ON CONFLICT (code) DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 1, id FROM "Permissions" WHERE code IN ('documents.view', 'documents.manage')
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 3, id FROM "Permissions" WHERE code IN ('documents.view', 'documents.manage')
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 2, id FROM "Permissions" WHERE code = 'documents.view'
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermissions" (role_id, permission_id)
SELECT 5, id FROM "Permissions" WHERE code = 'documents.view'
ON CONFLICT DO NOTHING;
