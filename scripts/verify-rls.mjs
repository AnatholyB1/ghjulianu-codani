#!/usr/bin/env node
// FND-03 proof: with the ANON key, every v1.1 server-only table and RPC must be denied.
// Usage: node scripts/verify-rls.mjs   (reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
//        from the environment or .env.local; never prints keys). Exit 0 = all denied.
// Safe: only sends payloads that cannot create valid rows; RPC calls use harmless arguments.
import { readFileSync, existsSync } from 'node:fs';

function loadEnv() {
  const env = { ...process.env };
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(2);
}

const headers = { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' };
const tables = ['subscribers', 'download_requests', 'events', 'rate_limits'];
const rpcs = [
  ['rate_limit_hit', { p_key: 'verify-rls', p_limit: 1, p_window_seconds: 60 }],
  ['consume_download_use', { p_token_hash: 'verify-rls-nonexistent' }],
  ['purge_old_events', { p_months: 1200 }],
];

const results = [];
let notFound = 0;
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
}

// A denial is HTTP 401/403 (permission denied 42501) or 404 (not exposed). 200 with rows = leak.
const denied = (status) => status === 401 || status === 403 || status === 404;

for (const t of tables) {
  // SELECT
  let r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers });
  let body = await r.text();
  if (denied(r.status)) record(`SELECT ${t}`, true, `HTTP ${r.status}`);
  else if (r.status === 200 && body.trim() === '[]') record(`SELECT ${t}`, true, 'HTTP 200 empty (RLS only; grants not revoked? check)');
  else record(`SELECT ${t}`, false, `HTTP ${r.status} (rows returned or unexpected)`);

  // INSERT with an invalid payload: must be refused for privilege, not for constraint (23502/23514 => INSERT allowed!)
  r = await fetch(`${url}/rest/v1/${t}`, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: '{}' });
  body = await r.text();
  const privilegeDenied = denied(r.status) || /42501|permission denied|row-level security/i.test(body);
  record(`INSERT ${t}`, privilegeDenied, `HTTP ${r.status}`);

  // UPDATE / DELETE with an impossible filter
  r = await fetch(`${url}/rest/v1/${t}?id=eq.00000000-0000-0000-0000-000000000000`, { method: 'DELETE', headers });
  record(`DELETE ${t}`, denied(r.status), `HTTP ${r.status}`);
  if (r.status === 404) notFound++;
}

for (const [fn, args] of rpcs) {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(args) });
  record(`RPC ${fn}`, denied(r.status), `HTTP ${r.status}`);
}

if (notFound > 0) {
  console.log('\nWARNING: HTTP 404 means PostgREST does not expose the table (migration NOT applied yet, or schema cache stale).');
  console.log('A 404 here is a denial but NOT proof of RLS: run again after applying the migration; expect 401/403 (42501).');
}
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
