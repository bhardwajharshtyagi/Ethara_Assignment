import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

try {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await pool.query(sql);
  console.log('✅ Migration complete');
  process.exit(0);
} catch (err) {
  console.error('❌ Migration failed:', err);
  process.exit(1);
}
