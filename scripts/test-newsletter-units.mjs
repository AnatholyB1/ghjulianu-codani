// Unit-style checks for phase 9 (no DB, no network).
// Run: node --conditions=react-server scripts/test-newsletter-units.mjs
// (Node >= 22.18 strips TypeScript types natively; `react-server` makes `server-only` a no-op.)
import assert from 'node:assert/strict';

process.env.DOWNLOAD_TOKEN_SECRET = 'unit-test-secret-0123456789abcdef-xyz';

const csv = await import('../src/lib/newsletter/csv.ts');
const svix = await import('../src/lib/newsletter/svix.ts');
const { maskEmail } = await import('../src/lib/newsletter/mask.ts');
const tokens = await import('../src/lib/server/tokens.ts');

let n = 0;
function t(name, fn) {
  try {
    fn();
    n++;
    console.log('ok  ', name);
  } catch (e) {
    console.error('FAIL', name, '\n', e.message);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------- CSV
t('csv: formula triggers get a leading apostrophe', () => {
  for (const v of ['=cmd|x', '+1+1', '-2', '@SUM(A1)', '\tTAB', '\rCR']) {
    const cell = csv.csvCell(v);
    assert.ok(cell.replace(/^"/, '').startsWith("'"), `${JSON.stringify(v)} -> ${JSON.stringify(cell)}`);
  }
});
t('csv: leading whitespace before a trigger is neutralised too', () => {
  assert.ok(csv.csvCell(' =HYPERLINK("x")').startsWith("'") || csv.csvCell(' =HYPERLINK("x")').startsWith('"\''));
});
t('csv: harmless values untouched, accents kept', () => {
  assert.equal(csv.csvCell('élodie@exemple.fr'), 'élodie@exemple.fr');
  assert.equal(csv.csvCell('a-b@example.org'), 'a-b@example.org');
  assert.equal(csv.csvCell(null), '');
});
t('csv: semicolons, quotes and newlines are quoted/escaped', () => {
  assert.equal(csv.csvCell('a;b'), '"a;b"');
  assert.equal(csv.csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csv.csvCell('l1\nl2'), '"l1\nl2"');
});
t('csv: file starts with BOM, CRLF, 6 header columns, ; separator', () => {
  const out = csv.buildSubscribersCsv([
    { email: '=evil@example.org', status: 'confirmed', lang: 'fr', source: 'download', consent_at: '2026-11-07T10:00:00Z', consent_text_version: 'v1' },
    { email: 'zoé@example.org', status: 'confirmed', lang: 'en', source: null, consent_at: null, consent_text_version: 'v1' },
  ]);
  const bytes = Buffer.from(out, 'utf8');
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const lines = out.slice(1).split('\r\n');
  assert.equal(lines[0], 'email;statut;langue;source;consentement_le;texte_version');
  assert.equal(lines[0].split(';').length, 6);
  assert.ok(lines[1].startsWith("'=evil@example.org;"));
  assert.ok(lines[2].startsWith('zoé@example.org;'));
  assert.equal(lines[3], '');
});
t('csv: filename abonnes-confirmes-YYYY-MM-DD.csv (Paris day)', () => {
  assert.equal(csv.exportFilename(new Date('2026-11-07T10:00:00Z')), 'abonnes-confirmes-2026-11-07.csv');
  assert.equal(csv.exportFilename(new Date('2026-11-07T23:30:00Z')), 'abonnes-confirmes-2026-11-08.csv');
});

// ---------------------------------------------------------------- mask
t('mask: first char + *** + domain', () => {
  assert.equal(maskEmail('marie@example.org'), 'm***@example.org');
  assert.equal(maskEmail('nope'), '***');
});

// ---------------------------------------------------------------- HMAC unsubscribe token
t('hmac: sign/verify roundtrip lowercases', () => {
  const s = tokens.signUnsubscribe('Marie@Example.org');
  assert.equal(tokens.verifyUnsubscribe(s), 'marie@example.org');
});
t('hmac: tampered payload, tampered mac, truncated, empty are rejected', () => {
  const s = tokens.signUnsubscribe('a@example.org');
  const [p, m] = s.split('.');
  const otherPayload = Buffer.from('b@example.org').toString('base64url');
  assert.equal(tokens.verifyUnsubscribe(`${otherPayload}.${m}`), null);
  assert.equal(tokens.verifyUnsubscribe(`${p}.${m.slice(0, -2)}AA`), null);
  assert.equal(tokens.verifyUnsubscribe(`${p}.`), null);
  assert.equal(tokens.verifyUnsubscribe(p), null);
  assert.equal(tokens.verifyUnsubscribe(''), null);
  assert.equal(tokens.verifyUnsubscribe('x'.repeat(600)), null);
});

// ---------------------------------------------------------------- Svix signature
const SECRET = 'whsec_' + Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
const body = JSON.stringify({ type: 'email.bounced', data: { from: 'J <p@mail.example.com>', to: ['x@example.org'], bounce: { type: 'Permanent' } } });
const now = Date.now();
const ts = String(Math.floor(now / 1000));
const sig = 'v1,' + svix.signSvix(SECRET, 'msg_1', ts, body);

t('svix: valid signature accepted', () => {
  assert.deepEqual(svix.verifySvix(SECRET, { id: 'msg_1', timestamp: ts, signature: sig }, body, now), { ok: true });
});
t('svix: accepts one valid signature among several (key rotation)', () => {
  assert.equal(svix.verifySvix(SECRET, { id: 'msg_1', timestamp: ts, signature: `v1,AAAA ${sig}` }, body, now).ok, true);
});
t('svix: modified body rejected', () => {
  assert.equal(svix.verifySvix(SECRET, { id: 'msg_1', timestamp: ts, signature: sig }, body + ' ', now).ok, false);
});
t('svix: wrong id, wrong secret, missing headers rejected', () => {
  assert.equal(svix.verifySvix(SECRET, { id: 'msg_2', timestamp: ts, signature: sig }, body, now).ok, false);
  const other = 'whsec_' + Buffer.from('ffffffffffffffffffffffffffffffff').toString('base64');
  assert.equal(svix.verifySvix(other, { id: 'msg_1', timestamp: ts, signature: sig }, body, now).ok, false);
  assert.equal(svix.verifySvix(SECRET, { id: null, timestamp: ts, signature: sig }, body, now).ok, false);
  assert.equal(svix.verifySvix(SECRET, { id: 'msg_1', timestamp: ts, signature: 'v2,' + sig.slice(3) }, body, now).ok, false);
});
t('svix: stale and future timestamps rejected (replay window 5 min)', () => {
  const old = String(Math.floor(now / 1000) - 600);
  const s2 = 'v1,' + svix.signSvix(SECRET, 'msg_1', old, body);
  assert.deepEqual(svix.verifySvix(SECRET, { id: 'msg_1', timestamp: old, signature: s2 }, body, now), { ok: false, reason: 'stale' });
  const fut = String(Math.floor(now / 1000) + 600);
  const s3 = 'v1,' + svix.signSvix(SECRET, 'msg_1', fut, body);
  assert.equal(svix.verifySvix(SECRET, { id: 'msg_1', timestamp: fut, signature: s3 }, body, now).ok, false);
  assert.equal(svix.verifySvix(SECRET, { id: 'msg_1', timestamp: 'abc', signature: sig }, body, now).ok, false);
});

// ---------------------------------------------------------------- Event filtering
const OURS = 'Julianu Codani <photos@mail.example.com>';
const evt = (type, extra = {}, from = 'Julianu Codani <photos@mail.example.com>') => ({ type, data: { from, to: ['Marie <M@Example.org>'], ...extra } });
t('events: hard bounce -> suppress hard_bounce, recipient normalised', () => {
  const d = svix.decideSuppression(evt('email.bounced', { bounce: { type: 'Permanent', subType: 'General' } }), OURS);
  assert.deepEqual(d, { suppress: true, reason: 'hard_bounce', recipients: ['m@example.org'] });
});
t('events: soft/undetermined bounce ignored', () => {
  assert.equal(svix.decideSuppression(evt('email.bounced', { bounce: { type: 'Transient' } }), OURS).suppress, false);
  assert.equal(svix.decideSuppression(evt('email.bounced', { bounce: { type: 'Undetermined' } }), OURS).suppress, false);
  assert.equal(svix.decideSuppression(evt('email.bounced', {}), OURS).suppress, false);
});
t('events: complaint -> suppress complaint', () => {
  assert.equal(svix.decideSuppression(evt('email.complained'), OURS).reason, 'complaint');
});
t('events: foreign sender domain ignored', () => {
  assert.equal(svix.decideSuppression(evt('email.complained', {}, 'x@other-site.com'), OURS).suppress, false);
  assert.equal(svix.decideSuppression(evt('email.complained', {}, 'x@evilmail.example.com.attacker.io'), OURS).suppress, false);
  assert.equal(svix.decideSuppression(evt('email.complained', {}, 'x@notmail.example.com'), OURS).suppress, false);
});
t('events: own subdomain of sender domain accepted', () => {
  assert.equal(svix.decideSuppression(evt('email.complained', {}, 'a@x.mail.example.com'), OURS).suppress, true);
});
t('events: other event types / garbage ignored', () => {
  assert.equal(svix.decideSuppression(evt('email.delivered'), OURS).suppress, false);
  assert.equal(svix.decideSuppression(evt('domain.updated'), OURS).suppress, false);
  assert.equal(svix.decideSuppression(null, OURS).suppress, false);
  assert.equal(svix.decideSuppression({ type: 'email.complained' }, OURS).suppress, false);
  assert.equal(svix.decideSuppression(evt('email.complained'), undefined).suppress, false);
});

console.log(`\n${n} checks passed${process.exitCode ? ' (WITH FAILURES)' : ''}`);
