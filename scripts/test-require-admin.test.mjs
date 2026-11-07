// node --test --conditions=react-server --import ./scripts/ts-register.mjs scripts/test-require-admin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const a = await import('../src/lib/server/requireAdmin.ts');

test('parseAdminEmails: trims, lowercases, drops empties', () => {
  assert.deepEqual(a.parseAdminEmails('  A@x.com , b@Y.ORG,, ,'), ['a@x.com', 'b@y.org']);
  assert.deepEqual(a.parseAdminEmails(''), []);
  assert.deepEqual(a.parseAdminEmails(undefined), []);
  assert.deepEqual(a.parseAdminEmails(null), []);
});

test('isAdminEmail: case-insensitive and whitespace tolerant', () => {
  const list = ' Boss@Example.com ,second@example.org';
  assert.equal(a.isAdminEmail('boss@example.com', list), true);
  assert.equal(a.isAdminEmail('  BOSS@EXAMPLE.COM ', list), true);
  assert.equal(a.isAdminEmail('second@example.org', list), true);
});

test('isAdminEmail: non-listed, partial and look-alike addresses are refused', () => {
  const list = 'boss@example.com';
  assert.equal(a.isAdminEmail('other@example.com', list), false);
  assert.equal(a.isAdminEmail('boss@example.com.evil.io', list), false);
  assert.equal(a.isAdminEmail('xboss@example.com', list), false);
  assert.equal(a.isAdminEmail('example.com', list), false);
});

test('isAdminEmail: fails closed on empty / unset allowlist', () => {
  for (const raw of ['', '   ', ',,', undefined, null]) {
    assert.equal(a.isAdminEmail('boss@example.com', raw), false, String(raw));
  }
});

test('isAdminEmail: missing / non-string / blank email is refused', () => {
  const list = 'boss@example.com';
  for (const e of [undefined, null, '', '   ', 42, {}]) assert.equal(a.isAdminEmail(e, list), false, String(e));
});

test('isAdminUser: null user and user without email refused', () => {
  process.env.ADMIN_EMAILS = 'boss@example.com';
  assert.equal(a.isAdminUser(null), false);
  assert.equal(a.isAdminUser({ email: undefined }), false);
  assert.equal(a.isAdminUser({ email: 'Boss@example.com' }), true);
  assert.equal(a.isAdminUser({ email: 'nope@example.com' }), false);
  delete process.env.ADMIN_EMAILS;
  assert.equal(a.isAdminUser({ email: 'boss@example.com' }), false);
});
