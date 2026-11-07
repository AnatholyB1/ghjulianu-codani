#!/usr/bin/env node
/**
 * Phase 7 e2e: delivery routes against a running server and the real Supabase project.
 *   BASE=http://localhost:3106 node scripts/e2e-delivery.mjs
 * Creates download_requests rows whose email starts with E2E_PREFIX (clearly marked test data),
 * and deletes them (and their events) at the end. Touches only download_requests, events,
 * rate_limits (via the app) and reads albums/album_photos.
 */
import fs from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { unzipSync } from 'fflate';

const BASE = process.env.BASE ?? 'http://localhost:3106';
const E2E_PREFIX = 'e2e-delivery-TEST-';
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' };
const rest = (p, init = {}) => fetch(`${U}/rest/v1/${p}`, { ...init, headers: { ...H, Prefer: 'return=representation', ...(init.headers ?? {}) } });
const sha = (b) => createHash('sha256').update(b).digest('hex');

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); };

const mk = (n) => { const t = randomBytes(32).toString('base64url'); return { t, h: sha(t) }; };
async function seed(photos, over = {}) {
  const { t, h } = mk();
  const body = {
    email: `${E2E_PREFIX}${randomBytes(4).toString('hex')}@example.invalid`, lang: 'fr', token_hash: h,
    expires_at: new Date(Date.now() + 48 * 3600e3).toISOString(), max_uses: 3, album_id: photos[0].album_id,
    photos: photos.map((p) => ({ photo_id: p.id, source: 'album_photos' })), email_status: 'guarded', ...over,
  };
  const r = await rest('download_requests', { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error('seed failed: ' + (await r.text()));
  return { token: t, id: (await r.json())[0].id, photos };
}
const row = async (id) => (await (await rest(`download_requests?id=eq.${id}&select=used_count,window_started_at`)).json())[0];
const expireWindow = (id) => rest(`download_requests?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ window_started_at: new Date(Date.now() - 20 * 60e3).toISOString() }) });
const get = (path, init) => fetch(BASE + path, { redirect: 'manual', ...init });

async function cleanup() {
  const r = await rest(`download_requests?email=like.${E2E_PREFIX}*&select=id`);
  const ids = (await r.json()).map((x) => x.id);
  if (ids.length) {
    await rest(`events?request_id=in.(${ids.join(',')})`, { method: 'DELETE' });
    await rest(`download_requests?id=in.(${ids.join(',')})`, { method: 'DELETE' });
  }
  return ids.length;
}

try {
  await cleanup();
  const albums = await (await rest('albums?select=id,slug&is_public=eq.true')).json();
  let photos = [];
  for (const a of albums) {
    photos = await (await rest(`album_photos?select=id,album_id,src&album_id=eq.${a.id}&order=sort_order&limit=8`)).json();
    if (photos.length >= 4) break;
  }
  if (photos.length < 4) throw new Error('need an album with >= 4 photos');
  console.log(`using ${photos.length} photos of one public album`);

  // ---- 1. concurrency inside one session window: 10 parallel => exactly 1 use
  const A = await seed(photos);
  const pid = photos[0].id;
  const rs = await Promise.all(Array.from({ length: 10 }, () => get(`/api/download/${A.token}/photo/${pid}`)));
  const bodies = await Promise.all(rs.map(async (r) => sha(Buffer.from(await r.arrayBuffer()))));
  ok(rs.every((r) => r.status === 200), '10 concurrent photo requests in one window all served (200)');
  ok((await row(A.id)).used_count === 1, 'used_count == 1 after 10 concurrent requests (no over-consumption)');
  const src0 = Buffer.from(await (await fetch(photos[0].src)).arrayBuffer());
  ok(bodies.every((b) => b === sha(src0)), 'photo bytes identical to the source (sha256)');
  ok(/attachment; filename="[A-Z0-9]+_001\.jpg"/.test(rs[0].headers.get('content-disposition') ?? ''), `Content-Disposition ${rs[0].headers.get('content-disposition')}`);
  ok(rs[0].headers.get('referrer-policy') === 'no-referrer' && /noindex/.test(rs[0].headers.get('x-robots-tag') ?? '') && /no-store/.test(rs[0].headers.get('cache-control') ?? ''), 'privacy headers on download route');

  // ---- 2. new sessions: boundary race then 3 sessions max
  await expireWindow(A.id);
  const rs2 = await Promise.all(Array.from({ length: 10 }, () => get(`/api/download/${A.token}/photo/${pid}`)));
  await Promise.all(rs2.map((r) => r.arrayBuffer()));
  ok(rs2.every((r) => r.status === 200), '10 concurrent requests at window expiry all served');
  ok((await row(A.id)).used_count === 2, 'used_count == 2 (exactly one new session opened by 10 racers)');
  await expireWindow(A.id);
  const r3 = await get(`/api/download/${A.token}/photo/${pid}`); await r3.arrayBuffer();
  ok(r3.status === 200 && (await row(A.id)).used_count === 3, '3rd distinct session served, used_count == 3');
  const r3b = await get(`/api/download/${A.token}/photo/${pid}`); await r3b.arrayBuffer();
  ok(r3b.status === 200 && (await row(A.id)).used_count === 3, 'inside the 3rd window still free');
  await expireWindow(A.id);
  const r4 = await get(`/api/download/${A.token}/photo/${pid}`);
  ok(r4.status === 410 && (await row(A.id)).used_count === 3, `4th distinct session refused: ${r4.status}, used_count stays 3`);
  const r4p = await get(`/api/download/${A.token}/photo/${pid}`, { headers: { 'sec-fetch-dest': 'document', accept: 'text/html' } });
  ok(r4p.status === 303 && r4p.headers.get('location') === `/telechargement/${A.token}`, 'browser navigation refusal => 303 to landing page');
  const z4 = await get(`/api/download/${A.token}/zip?part=1`);
  ok(z4.status === 410, 'zip also refused after 3 sessions');

  // ---- 3. refusals that consume nothing
  const B = await seed(photos);
  const wrong = await get(`/api/download/${B.token}/photo/00000000-0000-4000-8000-000000000000`);
  ok(wrong.status === 404 && (await row(B.id)).used_count === 0, 'photo not in request => 404, nothing consumed');
  const badPart = await get(`/api/download/${B.token}/zip?part=9`);
  ok(badPart.status === 404 && (await row(B.id)).used_count === 0, 'part out of range => 404, nothing consumed');
  const rnd = await get(`/api/download/${randomBytes(32).toString('base64url')}/photo/${pid}`);
  ok(rnd.status === 404, 'random token => 404');
  const mal = await get(`/api/download/short/photo/${pid}`);
  ok(mal.status === 404, 'malformed token => 404');
  const Ex = await seed(photos, { expires_at: new Date(Date.now() - 1000).toISOString() });
  ok((await get(`/api/download/${Ex.token}/photo/${pid}`)).status === 410, 'expired => 410');
  const Rv = await seed(photos, { revoked_at: new Date().toISOString() });
  ok((await get(`/api/download/${Rv.token}/photo/${pid}`)).status === 404, 'revoked => 404');

  // ---- 4. ZIP integrity: store mode, names, hashes
  const t0 = Date.now();
  const z = await get(`/api/download/${B.token}/zip?part=1`);
  const zbuf = Buffer.from(await z.arrayBuffer());
  ok(z.status === 200 && z.headers.get('content-type') === 'application/zip', `zip 200 application/zip (${zbuf.length} bytes, ${Date.now() - t0} ms)`);
  ok(!z.headers.get('content-length'), 'zip has no Content-Length (streamed)');
  ok((await row(B.id)).used_count === 1, 'zip consumed exactly 1 use');
  const files = unzipSync(new Uint8Array(zbuf));
  const names = Object.keys(files);
  ok(names.length === photos.length, `zip has ${names.length}/${photos.length} files`);
  // STORE check: local header method field == 0 for every entry
  let stored = true;
  for (let i = 0; i + 30 < zbuf.length;) {
    if (zbuf.readUInt32LE(i) === 0x04034b50) { if (zbuf.readUInt16LE(i + 8) !== 0) stored = false; i += 30; } else i++;
  }
  ok(stored, 'every entry stored (method 0, no recompression)');
  let hashesOk = true;
  for (let i = 0; i < photos.length; i++) {
    const src = Buffer.from(await (await fetch(photos[i].src)).arrayBuffer());
    const entry = names.find((n) => n.endsWith(`_${String(i + 1).padStart(3, '0')}.jpg`));
    if (!entry || sha(Buffer.from(files[entry])) !== sha(src)) hashesOk = false;
  }
  ok(hashesOk, 'every file in the zip is byte-identical to its source (sha256)');
  ok(/attachment; filename="[A-Z0-9]+\.zip"/.test(z.headers.get('content-disposition') ?? ''), `zip name ${z.headers.get('content-disposition')}`);
  fs.writeFileSync(process.env.ZIP_OUT ?? 'e2e-last.zip', zbuf);

  // ---- 5. events with bytes (written via after())
  await new Promise((r) => setTimeout(r, 2500));
  const evs = await (await rest(`events?request_id=in.(${A.id},${B.id})&type=eq.download&select=bytes,photo_id,session_key`)).json();
  ok(evs.length >= 11 + photos.length && evs.every((e) => e.bytes > 0), `download events with bytes recorded (${evs.length})`);
  ok(evs.some((e) => e.session_key === 'zip:1'), 'zip events tagged zip:1');

  // ---- 6. landing page does not consume
  const C = await seed(photos);
  for (let i = 0; i < 3; i++) { await get(`/telechargement/${C.token}`); await fetch(`${BASE}/telechargement/${C.token}`, { method: 'HEAD' }); }
  ok((await row(C.id)).used_count === 0, 'landing GET x3 + HEAD x3 leaves used_count at 0');
  const landing = await get(`/telechargement/${C.token}`);
  const html = await landing.text();
  ok(landing.status === 200 && !html.includes('/api/download/') === false, 'landing contains download links (not fetched)');
  ok(landing.headers.get('referrer-policy') === 'no-referrer' && /noindex/.test(landing.headers.get('x-robots-tag') ?? '') && /no-store/.test(landing.headers.get('cache-control') ?? ''), 'landing privacy headers');
  ok(/<meta name="robots" content="[^"]*noindex/.test(html) && /<meta name="referrer" content="no-referrer"/.test(html), 'landing meta robots + referrer');
  const lExp = await get(`/telechargement/${Ex.token}`); const lRv = await get(`/telechargement/${Rv.token}`);
  const lRnd = await get(`/telechargement/${randomBytes(32).toString('base64url')}`);
  ok(lRv.status === 404 && lRnd.status === 404, `revoked (${lRv.status}) and random (${lRnd.status}) tokens => 404`);
  const bRv = (await lRv.text()).replace(/<script[\s\S]*?<\/script>/g, ''), bRnd = (await lRnd.text()).replace(/<script[\s\S]*?<\/script>/g, '');
  ok(bRv.replace(Rv.token, 'T') === bRnd, 'revoked and random bodies identical');
  console.log(`  (expired landing status: ${lExp.status})`);

  // ---- 7. rate limit: > per-token limit in a minute => 429, uses never exceed 1 session
  const D = await seed(photos);
  const codes = [];
  // Fixed 60 s window: a burst can straddle a window boundary, so retry the burst once.
  for (let round = 0; round < 3 && !codes.includes(429); round++) {
    const batch = await Promise.all(Array.from({ length: 100 }, () => get(`/api/download/${D.token}/photo/${pid}`).then(async (r) => { await r.arrayBuffer(); return r.status; })));
    codes.push(...batch);
  }
  ok(codes.includes(429), `rate limit kicks in (${codes.filter((c) => c === 200).length} x200, ${codes.filter((c) => c === 429).length} x429)`);
  ok((await row(D.id)).used_count === 1, 'rate-limited requests consumed nothing extra (used_count == 1)');
  const rl = await get(`/api/download/${D.token}/photo/${pid}`, { headers: { 'sec-fetch-dest': 'document', accept: 'text/html' } });
  ok(rl.status === 303 && rl.headers.get('location') === `/telechargement/${D.token}?e=rate`, 'rate-limited browser navigation => 303 landing ?e=rate');
} catch (e) {
  fail++; console.log('ERROR', e);
} finally {
  const n = await cleanup();
  console.log(`cleanup: deleted ${n} test download_requests (+events)`);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
