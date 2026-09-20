const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../database/hr_system.db');
const sqlPath = path.join(__dirname, '../../../database/init.sql');

// Remove existing database
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Removed existing database');
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        process.exit(1);
    }
});

console.log('✅ Database created');

// Read and execute SQL file
const sql = fs.readFileSync(sqlPath, 'utf8');

// Split by semicolons and execute sequentially
const statements = sql
    .toString()
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

const parseStatements = (sql) =>
    sql
        .toString()
        .replace(/--.*$/gm, '')
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*'));

const runStatements = (statements, index, onDone) => {
    if (index >= statements.length) {
        onDone();
        return;
    }

    db.run(statements[index], (err) => {
        if (err && !err.message.includes('already exists')) {
            console.error(`Error executing statement ${index + 1}:`, err.message);
        }
        runStatements(statements, index + 1, onDone);
    });
};

const { runAlterMigrations } = require('./alterAttendanceColumns');

const migrationFiles = [
    'add_advanced_features.sql',
    'add_payroll_finance_procurement.sql',
    'add_rbac_attendance_settings.sql'
];

const runMigrations = (files, index = 0) => {
    if (index >= files.length) {
        runAlterMigrations(db).then(() => {
            console.log('✅ Database initialized with core schema and migrations');
            db.close();
            process.exit(0);
        });
        return;
    }

    const migrationPath = path.join(__dirname, '../../../database/migrations', files[index]);
    if (!fs.existsSync(migrationPath)) {
        console.warn(`⚠️  Skipping missing migration: ${files[index]}`);
        runMigrations(files, index + 1);
        return;
    }

    console.log(`🔄 Applying migration: ${files[index]}`);
    const migrationStatements = parseStatements(fs.readFileSync(migrationPath, 'utf8'));
    runStatements(migrationStatements, 0, () => runMigrations(files, index + 1));
};

runStatements(statements, 0, () => {
    console.log(`✅ Core schema applied (${statements.length} statements)`);
    runMigrations(migrationFiles);
});

