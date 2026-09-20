#!/usr/bin/env node
/**
 * Apply Postgres schema + seed to Neon (or any DATABASE_URL).
 * Usage: DATABASE_URL=postgres://... node scripts/migrateToNeon.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Postgres');

  const schemaPath = path.join(__dirname, '../../database/postgres/schema.sql');
  const seedPath = path.join(__dirname, '../../database/postgres/seed.sql');

  const schema = fs.readFileSync(schemaPath, 'utf8');
  const seed = fs.readFileSync(seedPath, 'utf8');

  console.log('Applying schema...');
  await client.query(schema);
  console.log('Schema applied');

  console.log('Applying seed...');
  await client.query(seed);
  console.log('Seed applied');

  const users = await client.query('SELECT id, username, user_level FROM "Users"');
  console.log('Users:', users.rows);

  await client.end();
  console.log('Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
