// Perf check of kpi_dashboard on a THROWAWAY local Postgres (data dir in the worktree, port 55430).
// Take the machine lock yourself first. Usage:
//   MIGS=a.sql,b.sql [EVENTS=200000] [SNAP=out.json] node scripts/perf-kpi-sql.mjs
// Synthetic data is generated locally only (never touches Supabase). Prints the postgres PID.
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BIN = 'C:/Users/Anatholy/scoop/apps/postgresql/current/bin';
const DATA = path.join(process.cwd(), '.tmp-pg-perf');
const PORT = '55430';
const N = Number(process.env.EVENTS ?? 200000);
const MIGS = (process.env.MIGS ?? 'supabase/migrations/20261107000001_v11_email_downloads.sql,supabase/migrations/20261107000002_v11_kpi_views.sql').split(',');
const run = (exe, args, opt = {}) => spawnSync(path.join(BIN, exe), args, { encoding: 'utf8', ...opt });
const psql = (args) => run('psql.exe', ['-h', '127.0.0.1', '-p', PORT, '-U', 'postgres', '-d', 'kpi', '-v', 'ON_ERROR_STOP=1', ...args]);

if (existsSync(DATA)) rmSync(DATA, { recursive: true, force: true });
let r = run('initdb.exe', ['-D', DATA, '-U', 'postgres', '--auth=trust', '-E', 'UTF8']);
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
r = run('pg_ctl.exe', ['-D', DATA, '-o', `-p ${PORT} -c listen_addresses=127.0.0.1`, '-w', '-l', path.join(DATA, 'log.txt'), 'start'], { stdio: 'ignore' });
if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
try { console.log('postgres pid', readFileSync(path.join(DATA, 'postmaster.pid'), 'utf8').split('\n')[0], 'port', PORT); } catch { /* ignore */ }
let code = 1;
try {
  run('createdb.exe', ['-h', '127.0.0.1', '-p', PORT, '-U', 'postgres', 'kpi']);
  const stub = `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  END $$;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  CREATE TABLE albums (id uuid PRIMARY KEY, title text, is_public boolean DEFAULT true, is_day boolean);
  CREATE TABLE album_photos (id uuid PRIMARY KEY, album_id uuid REFERENCES albums(id), src text, alt text, is_day boolean);
  CREATE TABLE portfolio_photos (id uuid PRIMARY KEY, src text, alt text, is_day boolean);`;
  const stubFile = path.join(DATA, 'stub.sql');
  writeFileSync(stubFile, stub);
  for (const f of [stubFile, ...MIGS]) {
    const x = psql(['-q', '-f', f]);
    if (x.status !== 0) { console.error(`LOAD FAILED ${f}\n`, x.stderr); throw new Error('load'); }
  }
  const nReq = Math.round(N * 0.06);
  const gen = `
  INSERT INTO albums SELECT ('aaaaaaaa-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid, 'Album '||g, g%4<>0, g%2=0 FROM generate_series(1,20) g;
  INSERT INTO album_photos SELECT ('bbbbbbbb-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,
         ('aaaaaaaa-0000-4000-8000-'||lpad((1+g%20)::text,12,'0'))::uuid, 'https://x/'||g||'.jpg', 'P'||g, g%2=0 FROM generate_series(1,500) g;
  INSERT INTO events (type, request_id, created_at)
  SELECT 'request', gen_random_uuid(), (current_date - 1 - (random()*179)::int)::timestamp + random()*interval '1 day'
    FROM generate_series(1, ${nReq});
  INSERT INTO events (type, photo_id, album_id, is_day, device, visitor_hash, created_at)
  SELECT CASE WHEN random() < 0.87 THEN 'view' ELSE 'select_add' END,
         p.id, p.album_id, p.is_day, (ARRAY['mobile','desktop','desktop','tablet'])[1+(random()*3)::int],
         md5((random()*30000)::int::text),
         (current_date - 1 - (random()*179)::int)::timestamp + random()*interval '1 day'
    FROM generate_series(1, ${Math.round(N * 0.76)}) g
    JOIN album_photos p ON p.id = ('bbbbbbbb-0000-4000-8000-'||lpad((1+(g*7919)%500)::text,12,'0'))::uuid
  ON CONFLICT DO NOTHING;
  CREATE TEMP TABLE reqs AS SELECT row_number() OVER () AS rn, request_id, created_at FROM events WHERE type='request';
  INSERT INTO events (type, request_id, photo_id, album_id, bytes, created_at)
  SELECT CASE WHEN g%2=0 THEN 'link_open' ELSE 'download' END, r.request_id,
         CASE WHEN g%2=0 THEN NULL ELSE ('bbbbbbbb-0000-4000-8000-'||lpad((1+(g*13)%500)::text,12,'0'))::uuid END,
         CASE WHEN g%2=0 THEN NULL ELSE ('aaaaaaaa-0000-4000-8000-'||lpad((1+(1+(g*13)%500)%20)::text,12,'0'))::uuid END,
         CASE WHEN g%2=0 THEN NULL ELSE 2500000 END,
         r.created_at + random()*interval '2 hours'
    FROM generate_series(1, ${Math.round(N * 0.18)}) g
    JOIN reqs r ON r.rn = 1 + (g::bigint*104729)%${nReq};
  ANALYZE;`;
  const gf = path.join(DATA, 'gen.sql'); writeFileSync(gf, gen);
  let x = psql(['-q', '-f', gf]); if (x.status !== 0) { console.error(x.stderr); throw new Error('gen'); }
  console.log(psql(['-At', '-c', "SELECT type||'='||count(*) FROM events GROUP BY type ORDER BY 1"]).stdout.trim().replace(/\n/g, ' '), '| total', psql(['-At', '-c', 'SELECT count(*) FROM events']).stdout.trim());
  const q = process.env.QUERY ?? 'SELECT public.kpi_dashboard(90)';
  const tf = path.join(DATA, 'time.sql');
  writeFileSync(tf, `\\timing on\n\\o ${path.join(DATA, 'out.txt').replace(/\\/g, '/')}\n${q};\n${q};\n${q};\n`);
  const t = psql(['-f', tf]);
  if (process.env.DEBUG) console.log(t.stdout, t.stderr, t.status);
  console.log((t.stdout + t.stderr).split('\n').filter((l) => /(Time|Dur|ERR|erreur)/i.test(l)).join('\n'));
  if (process.env.SNAP) writeFileSync(process.env.SNAP, psql(['-At', '-c', 'SELECT jsonb_pretty(public.kpi_dashboard(90))']).stdout);
  if (process.env.EXTRA) { const e = psql(['-f', process.env.EXTRA]); console.log(e.stdout, e.stderr); }
  code = 0;
} finally {
  run('pg_ctl.exe', ['-D', DATA, '-m', 'fast', '-w', 'stop']);
  rmSync(DATA, { recursive: true, force: true });
}
process.exit(code);
