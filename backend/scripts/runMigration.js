const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/hr_system.db');
const migrationsDir = path.join(__dirname, '../../database/migrations');

const { runAlterMigrations } = require('./alterAttendanceColumns');

const migrationFiles = [
    'add_advanced_features.sql',
    'add_payroll_finance_procurement.sql',
    'add_rbac_attendance_settings.sql',
    'add_documents_notifications.sql'
];

if (!fs.existsSync(dbPath)) {
    console.error('❌ Database not found. Please run init-db first.');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

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

    db.run(statements[index] + ';', (err) => {
        if (err && !err.message.includes('already exists') && !err.message.includes('duplicate')) {
            console.error(`❌ Error executing statement ${index + 1}:`, err.message);
            console.error(`Statement: ${statements[index].substring(0, 100)}...`);
        }
        runStatements(statements, index + 1, onDone);
    });
};

const runMigrations = (files, index = 0) => {
    if (index >= files.length) {
        runAlterMigrations(db).then(() => {
            console.log('✅ All migrations completed');
            db.close();
            process.exit(0);
        });
        return;
    }

    const file = files[index];
    const migrationPath = path.join(migrationsDir, file);

    if (!fs.existsSync(migrationPath)) {
        console.warn(`⚠️  Skipping missing migration: ${file}`);
        runMigrations(files, index + 1);
        return;
    }

    console.log(`🔄 Running migration: ${file}`);
    const statements = parseStatements(fs.readFileSync(migrationPath, 'utf8'));
    console.log(`📝 Found ${statements.length} statements to execute`);

    runStatements(statements, 0, () => {
        console.log(`✅ Completed: ${file}`);
        runMigrations(files, index + 1);
    });
};

runMigrations(migrationFiles);
