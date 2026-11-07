// node --test --conditions=react-server --import ./scripts/ts-register.mjs scripts/test-resubscribe.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DOWNLOAD_TOKEN_SECRET = 'unit-test-secret-0123456789abcdef';
const { resubscribePatch } = await import('../src/lib/server/newsletter.ts');
const { CONSENT_TEXT_VERSION } = await import('../src/lib/server/consent.ts');

test('resubscribePatch refreshes consent proof and clears unsubscribed_at', () => {
  const now = new Date('2026-11-07T10:00:00.000Z');
  const p = resubscribePatch(now, 'en', 'download');
  assert.equal(p.status, 'pending');
  assert.equal(p.lang, 'en');
  assert.equal(p.consent_at, '2026-11-07T10:00:00.000Z');
  assert.equal(p.consent_text_version, CONSENT_TEXT_VERSION);
  assert.equal(p.source, 'download');
  assert.equal(p.unsubscribed_at, null);
  assert.equal(p.updated_at, '2026-11-07T10:00:00.000Z');
});

test('resubscribePatch never touches token hash / confirmed_at (set by caller / confirm flow)', () => {
  const p = resubscribePatch(new Date(), 'fr', 'footer');
  for (const k of ['confirm_token_hash', 'confirm_expires_at', 'confirmed_at', 'email']) assert.ok(!(k in p), k);
  assert.equal(p.source, 'footer');
});
