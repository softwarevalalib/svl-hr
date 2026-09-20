const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../../database/hr_system.db');

function addColumnIfMissing(db, table, column, definition) {
    return new Promise((resolve) => {
        db.all(`PRAGMA table_info(${table})`, (err, rows) => {
            if (err) {
                console.error(`PRAGMA error for ${table}:`, err.message);
                return resolve();
            }
            const exists = (rows || []).some((r) => r.name === column);
            if (exists) return resolve();
            db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
                if (alterErr) {
                    console.error(`Failed adding ${table}.${column}:`, alterErr.message);
                } else {
                    console.log(`✅ Added column ${table}.${column}`);
                }
                resolve();
            });
        });
    });
}

function runAlterMigrations(db) {
    return Promise.all([
        addColumnIfMissing(db, 'Attendance', 'status', "TEXT DEFAULT 'Present'"),
        addColumnIfMissing(db, 'Attendance', 'signed_in_at', 'DATETIME'),
        addColumnIfMissing(db, 'Attendance', 'signed_out_at', 'DATETIME'),
        addColumnIfMissing(db, 'Attendance', 'latitude', 'REAL'),
        addColumnIfMissing(db, 'Attendance', 'longitude', 'REAL'),
        addColumnIfMissing(db, 'Users', 'is_active', 'INTEGER DEFAULT 1'),
    ]);
}

if (require.main === module) {
    const db = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }
        await runAlterMigrations(db);
        db.close();
        console.log('✅ Alter migrations done');
    });
}

module.exports = { runAlterMigrations, addColumnIfMissing };
