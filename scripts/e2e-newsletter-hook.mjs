// Runs enqueueConfirmation() for real against the DB (mail guarded) + renders the email.
// Spawned by e2e-newsletter.mjs with: node --conditions=react-server --import ./scripts/ts-register.mjs
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

const email = process.argv[2];
assert.ok(email && email.endsWith('@example.org'), 'test address must be on example.org');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { enqueueConfirmation } = await import('../src/lib/server/newsletter.ts');
const { ConfirmSubscriptionEmail, confirmText } = await import('../src/lib/server/email/ConfirmSubscription.tsx');
const { render } = await import('@react-email/render');
const { listUnsubscribeHeaders } = await import('../src/lib/server/email/layout.tsx');

const lines = [];
const ok = (m) => lines.push('ok   ' + m);

// 1. no row yet -> creates a pending row with hash + 48h expiry, mail guarded
await enqueueConfirmation(email, 'en');
let { data: row } = await db.from('subscribers').select('*').eq('email', email).single();
assert.equal(row.status, 'pending');
assert.equal(row.lang, 'en');
assert.match(row.confirm_token_hash, /^[0-9a-f]{64}$/);
const ttlH = (new Date(row.confirm_expires_at) - Date.now()) / 3_600_000;
assert.ok(ttlH > 47.9 && ttlH <= 48.01, 'ttl ' + ttlH);
ok(`enqueueConfirmation inserts pending row, sha256 hash stored, expiry ${ttlH.toFixed(2)} h`);
const firstHash = row.confirm_token_hash;

// 2. second call replaces the token (old link dies)
await enqueueConfirmation(email, 'fr');
({ data: row } = await db.from('subscribers').select('*').eq('email', email).single());
assert.notEqual(row.confirm_token_hash, firstHash);
assert.equal(row.lang, 'fr');
ok('re-enqueue rotates the token hash and updates lang');

// 3. confirmed / suppressed rows are left alone
await db.from('subscribers').update({ status: 'suppressed', suppressed_reason: 'complaint' }).eq('email', email);
const h2 = row.confirm_token_hash;
await enqueueConfirmation(email, 'fr');
({ data: row } = await db.from('subscribers').select('*').eq('email', email).single());
assert.equal(row.status, 'suppressed');
assert.equal(row.confirm_token_hash, h2);
ok('suppressed address is never re-enabled by enqueueConfirmation');

// 4. email rendering: both languages, button + fallback URL, no unsubscribe link, plain text mirrors
for (const lang of ['fr', 'en']) {
  const html = await render(ConfirmSubscriptionEmail({ lang, token: 'TESTTOKEN' }));
  assert.match(html, /newsletter\/confirmer\?t=TESTTOKEN/);
  assert.ok(!/desinscription|unsubscribe/i.test(html), 'confirm mail must not carry an unsubscribe link');
  assert.match(html, new RegExp(`<html[^>]*lang="${lang}"`));
  assert.match(html, /prefers-color-scheme: dark/);
  const text = confirmText(lang, 'TESTTOKEN');
  assert.match(text, /confirmer\?t=TESTTOKEN/);
}
ok('confirm email renders FR/EN (html + text), dark-mode css, no unsubscribe link');

// 5. List-Unsubscribe headers helper
const hs = listUnsubscribeHeaders('SIG');
assert.match(hs['List-Unsubscribe'], /^<https?:\/\/[^>]+\/api\/newsletter\/unsubscribe\?s=SIG>$/);
assert.equal(hs['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
ok('listUnsubscribeHeaders = List-Unsubscribe + List-Unsubscribe-Post: One-Click');

void createHash;
console.log(lines.join('\n'));
