// Verifies P5 + P10 SQL on a THROWAWAY local Postgres (data dir inside the worktree, port 55410).
// Take the machine lock yourself before running. Usage: node scripts/verify-kpi-sql.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BIN = 'C:/Users/Anatholy/scoop/apps/postgresql/current/bin';
const ROOT = process.cwd();
const DATA = path.join(ROOT, '.tmp-pg-data');
const PORT = '55410';
const run = (exe, args, opt = {}) => spawnSync(path.join(BIN, exe), args, { encoding: 'utf8', ...opt });
const psql = (args) => run('psql.exe', ['-h', '127.0.0.1', '-p', PORT, '-U', 'postgres', '-d', 'kpi', '-v', 'ON_ERROR_STOP=1', ...args]);

if (existsSync(DATA)) rmSync(DATA, { recursive: true, force: true });
let r = run('initdb.exe', ['-D', DATA, '-U', 'postgres', '--auth=trust', '-E', 'UTF8']);
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
r = run('pg_ctl.exe', ['-D', DATA, '-o', `-p ${PORT} -c listen_addresses=127.0.0.1`, '-w', '-l', path.join(DATA, 'log.txt'), 'start']);
if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
let code = 1;
try {
  run('createdb.exe', ['-h', '127.0.0.1', '-p', PORT, '-U', 'postgres', 'kpi']);
  const stub = `
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    CREATE TABLE albums (id uuid PRIMARY KEY, title text, is_public boolean DEFAULT true, is_day boolean);
    CREATE TABLE album_photos (id uuid PRIMARY KEY, album_id uuid REFERENCES albums(id), src text, alt text, is_day boolean);
    CREATE TABLE portfolio_photos (id uuid PRIMARY KEY, src text, alt text, is_day boolean);`;
  const stubFile = path.join(DATA, 'stub.sql');
  writeFileSync(stubFile, stub);
  for (const f of [stubFile, 'supabase/migrations/20261107000001_v11_email_downloads.sql', 'supabase/migrations/20261107000002_v11_kpi_views.sql']) {
    const x = psql(['-q', '-f', f]);
    if (x.status !== 0) { console.error(`LOAD FAILED ${f}\n`, x.stderr); throw new Error('load'); }
  }
  const t = psql(['-f', 'scripts/kpi-sql-test.sql']);
  console.log(t.stdout); if (t.stderr) console.error(t.stderr);
  code = t.status === 0 && /failed\s*\n-+\n\s*\d+\s*\|\s*0\b/.test(t.stdout) ? 0 : 1;
} finally {
  run('pg_ctl.exe', ['-D', DATA, '-m', 'fast', '-w', 'stop']);
  rmSync(DATA, { recursive: true, force: true });
}
console.log(code === 0 ? 'SQL VERIFY: ALL PASS' : 'SQL VERIFY: FAILURES');
process.exit(code);
