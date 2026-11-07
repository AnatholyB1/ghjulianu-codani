// node --test --conditions=react-server --import ./scripts/ts-register.mjs scripts/test-salt-failclosed.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const rl = await import('../src/lib/server/rateLimit.ts');
const ev = await import('../src/lib/server/events.ts');
const req = { headers: new Headers({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'x' }) };

test('hashIdentifier / visitorHash throw when IP_HASH_SALT is unset or shorter than 16', () => {
  for (const s of [undefined, '', 'short', 'x'.repeat(15)]) {
    if (s === undefined) delete process.env.IP_HASH_SALT; else process.env.IP_HASH_SALT = s;
    assert.throws(() => rl.hashIdentifier('1.2.3.4'), /IP_HASH_SALT/);
    assert.throws(() => ev.visitorHash(req), /IP_HASH_SALT/);
    assert.equal(ev.safeVisitorHash(req), null);
  }
});

test('hashIdentifier / visitorHash work with a >=16 char salt', () => {
  process.env.IP_HASH_SALT = 'unit-test-salt-0123456789';
  assert.match(rl.hashIdentifier('1.2.3.4'), /^[0-9a-f]{32}$/);
  assert.match(ev.visitorHash(req), /^[0-9a-f]{32}$/);
  assert.equal(ev.safeVisitorHash(req), ev.visitorHash(req));
});

test('verifyUnsubscribe never throws without DOWNLOAD_TOKEN_SECRET (returns null)', async () => {
  const tk = await import('../src/lib/server/tokens.ts');
  process.env.DOWNLOAD_TOKEN_SECRET = 'unit-test-secret-0123456789abcdef';
  const sig = tk.signUnsubscribe('A@Example.org');
  assert.equal(tk.verifyUnsubscribe(sig), 'a@example.org');
  for (const s of [undefined, '', 'short']) {
    if (s === undefined) delete process.env.DOWNLOAD_TOKEN_SECRET; else process.env.DOWNLOAD_TOKEN_SECRET = s;
    assert.equal(tk.isSecretConfigured(), false);
    assert.doesNotThrow(() => tk.verifyUnsubscribe(sig));
    assert.equal(tk.verifyUnsubscribe(sig), null);
  }
});

test('logEvent never throws (no DB configured)', async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  await assert.doesNotReject(ev.logEvent({ type: 'view' }));
});
