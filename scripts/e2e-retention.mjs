#!/usr/bin/env node
/**
 * Retention purge check against the real (shared) Supabase project, MARKED ROWS ONLY.
 *   node --env-file=.env.local --conditions=react-server --import ./scripts/ts-register.mjs scripts/e2e-retention.mjs
 * Rows: subscribers/download_requests with email ret-e2e-*@example.org, rate_limits key 'ret-e2e:%'.
 * purgeExpired() is called with a scope so nothing else is ever deleted. Rows are removed at start and end.
 */
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { purgeExpired, retentionCutoffs } = await import('../src/lib/server/retention.ts');

const DAY = 86_400_000;
const ago = (d) => new Date(Date.now() - d * DAY).toISOString();
const ahead = (d) => new Date(Date.now() + d * DAY).toISOString();
const E = (n) => `ret-e2e-${n}@example.org`;

async function cleanup() {
  await db.from('download_requests').delete().like('email', 'ret-e2e-%@example.org');
  await db.from('subscribers').delete().like('email', 'ret-e2e-%@example.org');
  await db.from('rate_limits').delete().like('key', 'ret-e2e:%');
}

const out = [];
try {
  await cleanup();

  const dr = (n, expires) => ({ email: E(n), lang: 'fr', token_hash: `ret-e2e-${n}-${Date.now()}`, expires_at: expires, photos: [] });
  let r = await db.from('download_requests').insert([
    dr('dr-old', ago(100)),     // expired 100 d ago -> purged
    dr('dr-recent', ago(60)),   // expired 60 d ago  -> kept (< 90 d)
    dr('dr-live', ahead(1)),    // still valid       -> kept
  ]);
  assert.ifError(r.error);

  r = await db.from('rate_limits').insert([
    { key: 'ret-e2e:old', window_start: ago(3), count: 1 },    // purged
    { key: 'ret-e2e:fresh', window_start: ago(0.01), count: 1 }, // kept
  ]);
  assert.ifError(r.error);

  const sub = (n, status, updated) => ({ email: E(n), status, lang: 'fr', created_at: updated, updated_at: updated });
  r = await db.from('subscribers').insert([
    sub('sub-stale-pending', 'pending', ago(40)),   // purged
    sub('sub-fresh-pending', 'pending', ago(5)),    // kept
    sub('sub-old-confirmed', 'confirmed', ago(400)), // kept (status != pending)
    sub('sub-old-unsub', 'unsubscribed', ago(400)),  // kept
    { ...sub('sub-null-stale', 'pending', ago(60)), updated_at: null },  // purged: created_at fallback
    { ...sub('sub-null-fresh', 'pending', ago(3)), updated_at: null },   // kept
  ]);
  assert.ifError(r.error);

  const res = await purgeExpired(db, new Date(), { emailLike: 'ret-e2e-%@example.org', keyLike: 'ret-e2e:%' });
  assert.deepEqual(res.failed, []);
  assert.equal(res.downloadRequests, 1);
  assert.equal(res.rateLimits, 1);
  assert.equal(res.pendingSubscribers, 2);
  out.push('ok   purgeExpired deleted exactly 1 download_request, 1 rate_limit, 2 stale pending subscribers (one with NULL updated_at)');

  const emails = async (t) => (await db.from(t).select('email').like('email', 'ret-e2e-%@example.org')).data.map((x) => x.email).sort();
  assert.deepEqual(await emails('download_requests'), [E('dr-live'), E('dr-recent')].sort());
  assert.deepEqual(await emails('subscribers'), [E('sub-fresh-pending'), E('sub-null-fresh'), E('sub-old-confirmed'), E('sub-old-unsub')].sort());
  const keys = (await db.from('rate_limits').select('key').like('key', 'ret-e2e:%')).data.map((x) => x.key);
  assert.deepEqual(keys, ['ret-e2e:fresh']);
  out.push('ok   recent/valid/confirmed/unsubscribed/fresh rows survived');

  const again = await purgeExpired(db, new Date(), { emailLike: 'ret-e2e-%@example.org', keyLike: 'ret-e2e:%' });
  assert.deepEqual([again.downloadRequests, again.rateLimits, again.pendingSubscribers], [0, 0, 0]);
  out.push('ok   second run is a no-op (idempotent)');

  const c = retentionCutoffs(new Date('2026-11-07T00:00:00Z'));
  assert.equal(c.downloadRequestsExpiredBefore, '2026-08-09T00:00:00.000Z');
  assert.equal(c.rateLimitsOlderThan, '2026-11-05T00:00:00.000Z');
  assert.equal(c.pendingSubscribersOlderThan, '2026-10-08T00:00:00.000Z');
  out.push('ok   cutoffs = 90 d / 2 d / 30 d');
} finally {
  await cleanup();
}
console.log(out.join('\n'));
