// node --test scripts/test-request-guards.test.mjs   (Node >= 22.6 strips TS types natively)
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DOWNLOAD_TOKEN_SECRET = 'unit-test-secret-0123456789abcdef';
const g = await import('../src/lib/server/requestGuards.ts');

test('normalizeEmail accepts/rejects', () => {
  assert.equal(g.normalizeEmail('  Julie@Example.ORG '), 'julie@example.org');
  for (const bad of ['', 'a@b', 'a@b.c', 'no-at.example.org', 'a b@example.org', '<x>@example.org', 'a@@example.org', 'a@example..org', 5, null, 'a'.repeat(250) + '@example.org']) {
    assert.equal(g.normalizeEmail(bad), null, String(bad));
  }
});

test('parsePhotoRefs validates ids/sources, dedupes, caps', () => {
  const id = '3f0c9a52-1b2c-4d5e-8f90-123456789abc';
  assert.deepEqual(g.parsePhotoRefs([{ photoId: id, source: 'album_photos' }, { photoId: id.toUpperCase(), source: 'album_photos' }]),
    [{ photoId: id, source: 'album_photos' }]);
  assert.equal(g.parsePhotoRefs([]), null);
  assert.equal(g.parsePhotoRefs([{ photoId: 'x', source: 'album_photos' }]), null);
  assert.equal(g.parsePhotoRefs([{ photoId: id, source: 'photos' }]), null);
  assert.equal(g.parsePhotoRefs([{ photoId: id, source: 'album_photos', src: 'http://evil' }]).length, 1);
  const many = Array.from({ length: g.MAX_PHOTOS_PER_REQUEST + 1 }, (_, i) => ({ photoId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, source: 'album_photos' }));
  assert.equal(g.parsePhotoRefs(many), null);
});

test('form token: too fast / ok / expired / forged', () => {
  const now = Date.now();
  assert.equal(g.checkFormToken(g.signFormToken(now - 500), now), 'too_fast');
  assert.equal(g.checkFormToken(g.signFormToken(now - 3000), now), 'ok');
  assert.equal(g.checkFormToken(g.signFormToken(now - g.MAX_FORM_AGE_MS - 1), now), 'expired');
  const t = g.signFormToken(now - 3000);
  assert.equal(g.checkFormToken(t.slice(0, -2) + 'xx', now), 'invalid');
  assert.equal(g.checkFormToken(`${now - 99999}.${t.split('.')[1]}`, now), 'invalid');
  assert.equal(g.checkFormToken('', now), 'invalid');
  assert.equal(g.checkFormToken(undefined, now), 'invalid');
});

test('album access cookie: valid, expired, wrong slug, rotated key, forged', () => {
  const now = Date.now();
  const c = g.signAlbumAccess('mon-album', 'Ab3$xY', 3600, now);
  assert.equal(g.verifyAlbumAccess(c, 'mon-album', 'Ab3$xY', now), true);
  assert.equal(g.verifyAlbumAccess(c, 'mon-album', 'Ab3$xY', now + 3601 * 1000), false, 'expired');
  assert.equal(g.verifyAlbumAccess(c, 'autre', 'Ab3$xY', now), false, 'other album');
  assert.equal(g.verifyAlbumAccess(c, 'mon-album', 'NEWKEY', now), false, 'rotated key revokes');
  assert.equal(g.verifyAlbumAccess('Ab3$xY', 'mon-album', 'Ab3$xY', now), false, 'legacy raw-key cookie rejected');
  assert.equal(g.verifyAlbumAccess(c.slice(0, -2) + 'zz', 'mon-album', 'Ab3$xY', now), false, 'forged');
  assert.equal(g.verifyAlbumAccess(c, 'mon-album', null, now), false);
  assert.equal(g.verifyAlbumAccess(undefined, 'mon-album', 'Ab3$xY', now), false);
});

test('daily caps: per-IP default 20 (DOWNLOAD_IP_DAILY_CAP), global default 80, bad values fall back, IP cap below global', () => {
  assert.equal(g.downloadIpDailyCap(undefined), 20);
  assert.equal(g.downloadIpDailyCap('5'), 5);
  for (const bad of ['', '0', '-3', 'abc', '2.5']) assert.equal(g.downloadIpDailyCap(bad), 20, bad);
  assert.equal(g.downloadEmailDailyCap(undefined), 80);
  assert.equal(g.downloadEmailDailyCap('120'), 120);
  assert.ok(g.downloadIpDailyCap(undefined) < g.downloadEmailDailyCap(undefined));
  assert.equal(g.IP_DAILY_WINDOW_SECONDS, 86400);
});

test('verifyAlbumAccess does not throw when DOWNLOAD_TOKEN_SECRET is unset (treated as no cookie)', () => {
  const saved = process.env.DOWNLOAD_TOKEN_SECRET;
  const nowMs = Date.now();
  const good = g.signAlbumAccess('slug', 'key', 600, nowMs);
  assert.equal(g.verifyAlbumAccess(good, 'slug', 'key', nowMs), true);
  process.env.DOWNLOAD_TOKEN_SECRET = '';
  try {
    const fake = String(Math.floor(nowMs / 1000) + 600) + '.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    assert.equal(g.verifyAlbumAccess(fake, 'slug', 'key', nowMs), false);
    assert.equal(g.verifyAlbumAccess(good, 'slug', 'key', nowMs), false);
  } finally {
    process.env.DOWNLOAD_TOKEN_SECRET = saved;
  }
});

test('constantTimeEqual', () => {
  assert.equal(g.constantTimeEqual('abc', 'abc'), true);
  assert.equal(g.constantTimeEqual('abc', 'abd'), false);
  assert.equal(g.constantTimeEqual('abc', 'abcd'), false);
});
