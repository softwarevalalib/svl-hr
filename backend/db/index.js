const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function normalizeSql(sql) {
  let out = sql;
  const wasIgnore = /INSERT\s+OR\s+IGNORE/i.test(sql);
  out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  if (wasIgnore && !/ON\s+CONFLICT/i.test(out)) {
    out = out.replace(/;?\s*$/, ' ON CONFLICT DO NOTHING');
  }
  out = out.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  return out;
}

function createPgDb(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
  });

  const db = {
    driver: 'postgres',
    pool,

    all(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const text = convertPlaceholders(normalizeSql(sql));
      pool.query(text, params || [], (err, result) => {
        callback(err, result ? result.rows : undefined);
      });
    },

    get(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const text = convertPlaceholders(normalizeSql(sql));
      pool.query(text, params || [], (err, result) => {
        callback(err, result && result.rows ? result.rows[0] : undefined);
      });
    },

    run(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      let text = normalizeSql(sql);
      const isInsert = /^\s*INSERT\s+/i.test(text);
      if (isInsert && !/RETURNING\s+/i.test(text)) {
        text = text.replace(/;?\s*$/, ' RETURNING id');
      }
      text = convertPlaceholders(text);

      const ctx = { lastID: 0, changes: 0 };
      pool.query(text, params || [], function (err, result) {
        if (!err && result) {
          ctx.changes = result.rowCount || 0;
          if (result.rows && result.rows[0] && result.rows[0].id != null) {
            ctx.lastID = result.rows[0].id;
          }
        }
        if (typeof callback === 'function') {
          callback.call(ctx, err);
        }
      });
    },

    serialize(fn) {
      if (typeof fn === 'function') fn();
    },

    close(cb) {
      pool.end(cb);
    },
  };

  return db;
}

function createSqliteDb(dbPath) {
  const raw = new sqlite3.Database(dbPath);
  raw.run('PRAGMA foreign_keys = ON');
  raw.driver = 'sqlite';
  return raw;
}

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.startsWith('postgres')) {
    console.log('✅ Using Neon/PostgreSQL (DATABASE_URL)');
    return createPgDb(databaseUrl);
  }

  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../database/hr_system.db');
  console.log('✅ Using SQLite database:', dbPath);
  return createSqliteDb(dbPath);
}

module.exports = { createDatabase, createPgDb, createSqliteDb };
