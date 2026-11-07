#!/usr/bin/env node
/**
 * Phase 7: multi-part ZIP + memory profile of the streaming server.
 *   SERVER_PID=<pid of `next start`> BASE=http://localhost:3106 node scripts/e2e-delivery-memory.mjs
 * Seeds ONE marked download_requests row with ~250 photos (several albums), downloads every ZIP part
 * over HTTP (part 1 with a deliberately slow reader to prove backpressure), samples the server RSS
 * every 500 ms, checks the part split against the caps, spot-checks file hashes, then deletes the row.
 */
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { unzipSync } from 'fflate';

const BASE = process.env.BASE ?? 'http://localhost:3106';
const PID = process.env.SERVER_PID;
const WANT = Number(process.env.PHOTOS ?? 250);
const MAX_BYTES = 120 * 1024 * 1024, MAX_FILES = 60; // keep in sync with deliveryPlan.ts
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const sha = (b) => createHash('sha256').update(b).digest('hex');
// Async sampling (a sync tasklist call would starve the download loop).
const rssMB = () => new Promise((resolve) => {
  if (!PID) return resolve(NaN);
  execFile('tasklist', ['/FI', `PID eq ${PID}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8' }, (_e, out) => {
    const kb = Number((out ?? '').split('","')[4]?.replace(/[^0-9]/g, ''));
    resolve(kb / 1024);
  });
});

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); };
let reqId = null;
try {
  const all = await (await fetch(`${U}/rest/v1/album_photos?select=id,album_id,src&order=album_id,sort_order&limit=1000`, { headers: H })).json();
  const photos = all.slice(0, WANT);
  const token = randomBytes(32).toString('base64url');
  const r = await fetch(`${U}/rest/v1/download_requests`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      email: 'e2e-delivery-TEST-memory@example.invalid', token_hash: sha(token),
      expires_at: new Date(Date.now() + 48 * 3600e3).toISOString(), album_id: null, email_status: 'guarded',
      photos: photos.map((p) => ({ photo_id: p.id, source: 'album_photos' })),
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  reqId = (await r.json())[0].id;

  // expected plan from real sizes
  const sizes = [];
  for (let i = 0; i < photos.length; i += 16) {
    sizes.push(...(await Promise.all(photos.slice(i, i + 16).map(async (p) => +(await fetch(p.src, { method: 'HEAD' })).headers.get('content-length')))));
  }
  const parts = []; let cur = null;
  sizes.forEach((s, i) => { if (!cur || cur.n >= MAX_FILES || (cur.n > 0 && cur.b + s > MAX_BYTES)) { cur = { start: i, n: 0, b: 0 }; parts.push(cur); } cur.n++; cur.b += s; });
  console.log(`${photos.length} photos, ${(sizes.reduce((a, b) => a + b, 0) / 1048576).toFixed(0)} MB total => expected ${parts.length} parts`);

  const samples = [];
  const base = await rssMB();
  const timer = setInterval(async () => samples.push(await rssMB()), 500);
  let totalBytes = 0;
  for (let p = 1; p <= parts.length; p++) {
    const slow = p === 1;
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/download/${token}/zip?part=${p}`);
    if (res.status !== 200 || !res.headers.get('x-zip-part')) console.log(res.status, [...res.headers].map(([k,v])=>k+': '+v.slice(0,60)).join(' | '));
    ok(res.status === 200, `part ${p}/${parts.length}: 200 (${res.headers.get('x-zip-part')})`);
    const chunks = []; let n = 0;
    for await (const ch of res.body) { chunks.push(ch); n += ch.length; if (slow) await new Promise((x) => setTimeout(x, 4)); }
    totalBytes += n;
    console.log(`  part ${p} streamed ${(n / 1048576).toFixed(1)} MB in ${Date.now() - t0} ms`);
    const buf = Buffer.concat(chunks);
    const files = unzipSync(new Uint8Array(buf));
    const names = Object.keys(files).sort();
    const exp = parts[p - 1];
    ok(names.length === exp.n && exp.n <= MAX_FILES && exp.b <= MAX_BYTES + 1, `part ${p}: ${names.length} files (expected ${exp.n}), ${(n / 1048576).toFixed(1)} MB zip, cap ok`);
    // spot check three files by hash + exact size of all
    let sizesOk = true, hashOk = true;
    for (let k = 0; k < exp.n; k++) {
      const idx = exp.start + k;
      const name = names.find((x) => x.endsWith(`_${String(idx + 1).padStart(3, '0')}.jpg`));
      if (!name || files[name].length !== sizes[idx]) sizesOk = false;
      if ([0, Math.floor(exp.n / 2), exp.n - 1].includes(k)) {
        const src = Buffer.from(await (await fetch(photos[idx].src)).arrayBuffer());
        if (sha(Buffer.from(files[name])) !== sha(src)) hashOk = false;
      }
    }
    ok(sizesOk && hashOk, `part ${p}: all file sizes match sources, 3 sampled sha256 match`);
  }
  // one past the last part
  const past = await fetch(`${BASE}/api/download/${token}/zip?part=${parts.length + 1}`);
  ok(past.status === 404, 'part beyond the last => 404');
  clearInterval(timer);
  const row = (await (await fetch(`${U}/rest/v1/download_requests?id=eq.${reqId}&select=used_count`, { headers: H })).json())[0];
  ok(row.used_count === 1, `all ${parts.length} parts inside one 15-min session consumed exactly 1 use`);

  const finite = samples.filter(Number.isFinite);
  if (finite.length) {
    const mx = Math.max(...finite), mn = Math.min(...finite);
    console.log(`RSS (MB): before=${base.toFixed(0)} min=${mn.toFixed(0)} max=${mx.toFixed(0)} after=${(await rssMB()).toFixed(0)}; streamed ${(totalBytes / 1048576).toFixed(0)} MB in ${finite.length} samples`);
    ok(mx - base < 150, `RSS growth while streaming ${(totalBytes / 1048576).toFixed(0)} MB stays flat: +${(mx - base).toFixed(0)} MB (< 150 MB, parts are up to 120 MB each)`);
  } else console.log('SERVER_PID not set: RSS not sampled');
} catch (e) {
  fail++; console.log('ERROR', e);
} finally {
  if (reqId) {
    await fetch(`${U}/rest/v1/events?request_id=eq.${reqId}`, { method: 'DELETE', headers: H });
    await fetch(`${U}/rest/v1/download_requests?id=eq.${reqId}`, { method: 'DELETE', headers: H });
  }
  console.log(`cleanup done\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
