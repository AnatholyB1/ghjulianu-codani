#!/usr/bin/env node
/**
 * Phase 7: Playwright run of /telechargement/[token] in every state, FR+EN, night+day,
 * desktop 1440x900 and iPhone 14 (390x844, touch). Real rows are seeded (marked
 * e2e-delivery-TEST-*) and deleted at the end.
 *   PW_DIR=<dir containing node_modules/playwright> BASE=http://localhost:3106 node scripts/e2e-landing.mjs
 * Screenshots go to OUT (default .planning/phases/07-livraison-photos/evidence), not committed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash, randomBytes } from 'node:crypto';

const BASE = process.env.BASE ?? 'http://localhost:3106';
const OUT = process.env.OUT ?? '.planning/phases/07-livraison-photos/evidence';
const { chromium, devices } = createRequire(path.join(process.env.PW_DIR, 'x.js'))('playwright');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const sha = (b) => createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); };
fs.mkdirSync(OUT, { recursive: true });

async function seed(photos, over = {}) {
  const t = randomBytes(32).toString('base64url');
  const r = await fetch(`${U}/rest/v1/download_requests`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      email: `e2e-delivery-TEST-${randomBytes(3).toString('hex')}@example.invalid`, lang: 'fr', token_hash: sha(t),
      expires_at: new Date(Date.now() + 47 * 3600e3).toISOString(), album_id: photos[0].album_id, email_status: 'guarded',
      photos: photos.map((p) => ({ photo_id: p.id, source: 'album_photos' })), ...over,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  return { token: t, id: (await r.json())[0].id };
}
const used = async (id) => (await (await fetch(`${U}/rest/v1/download_requests?id=eq.${id}&select=used_count`, { headers: H })).json())[0].used_count;

const created = [];
try {
  const all = await (await fetch(`${U}/rest/v1/album_photos?select=id,album_id&order=album_id,sort_order&limit=1000`, { headers: H })).json();
  const byAlbum = {}; all.forEach((p) => (byAlbum[p.album_id] ??= []).push(p));
  const big = Object.values(byAlbum).sort((a, b) => b.length - a.length)[0];
  const mid = Object.values(byAlbum).find((a) => a.length >= 14 && a.length <= 40) ?? big;
  const S = {};
  const add = async (name, photos, over) => { S[name] = await seed(photos, over); created.push(S[name].id); };
  await add('valid', mid.slice(0, 14));
  await add('last', mid.slice(0, 14), { used_count: 2 });
  await add('parts', big.slice(0, 96));
  await add('expired', mid.slice(0, 14), { expires_at: new Date(Date.now() - 3600e3).toISOString() });
  await add('exhausted', mid.slice(0, 14), { used_count: 3 });
  await add('revoked', mid.slice(0, 14), { revoked_at: new Date().toISOString() });
  const states = [
    ['valid', S.valid.token, ''], ['parts', S.parts.token, ''], ['last', S.last.token, ''], ['dlerror', S.valid.token, '?e=rate'],
    ['expired', S.expired.token, ''], ['exhausted', S.exhausted.token, ''],
    ['invalid', S.revoked.token, ''], ['invalid-random', randomBytes(32).toString('base64url'), ''],
  ];

  const browser = await chromium.launch();
  const profiles = {
    desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    iphone: { ...devices['iPhone 14'], browserName: undefined },
  };
  delete profiles.iphone.defaultBrowserType;

  // AC checks run in-page
  const measure = () => {
    const bad = { overflow: document.documentElement.scrollWidth > innerWidth, small: [], targets: [], anims: document.getAnimations().length };
    for (const el of document.querySelectorAll('.dlp *')) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const fs_ = parseFloat(getComputedStyle(el).fontSize);
      if (fs_ < 13.99) bad.small.push(`${el.tagName}.${el.className}:${fs_}`);
    }
    for (const el of document.querySelectorAll('.dlp a[href], .dlp button')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.width < 43.5 || r.height < 43.5)) bad.targets.push(`${el.tagName}:${el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return bad;
  };

  for (const [pname, prof] of Object.entries(profiles)) {
    for (const theme of ['night', 'day']) {
      for (const lang of ['fr', 'en']) {
        const ctx = await browser.newContext({ ...prof, reducedMotion: 'reduce', locale: lang === 'fr' ? 'fr-FR' : 'en-GB' });
        if (theme === 'day') await ctx.addInitScript(() => localStorage.setItem('day-night-storage', JSON.stringify({ state: { mode: 'day' }, version: 0 })));
        for (const [name, token, q] of states) {
          const page = await ctx.newPage();
          const downloadReqs = [];
          page.on('request', (r) => { if (r.url().includes('/api/download/')) downloadReqs.push(r.url()); });
          const consoleOut = [];
          page.on('console', (m) => consoleOut.push(m.text()));
          const res = await page.goto(`${BASE}/telechargement/${token}${q ? q + '&' : '?'}lang=${lang}`, { waitUntil: 'networkidle' });
          await page.waitForSelector('.dlp h1');
          const tag = `${pname}-${theme}-${lang}-${name}`;
          const m = await page.evaluate(measure);
          const expectStatus = { invalid: 404, 'invalid-random': 404 }[name] ?? 200;
          const issues = [];
          if (res.status() !== expectStatus) issues.push(`status ${res.status()}`);
          if (m.overflow) issues.push('horizontal overflow');
          if (m.small.length) issues.push(`font<14: ${[...new Set(m.small)].slice(0, 3)}`);
          if (m.targets.length) issues.push(`targets<44: ${m.targets.slice(0, 3)}`);
          if (m.anims) issues.push(`running animations: ${m.anims}`);
          if (downloadReqs.length) issues.push('requested /api/download before any click');
          const html = await page.content();
          const leaks = [...html.matchAll(/(?:href|src|content)="([^"]*)"/g)].map((x) => x[1])
            .filter((u) => u.includes(token) && !u.startsWith(`/api/download/${token}/`) && !u.startsWith(`/telechargement/${token}`));
          if (leaks.length) issues.push(`token leaked in: ${leaks[0].slice(0, 60)}`);
          if ((await page.title()).includes(token)) issues.push('token in <title>');
          if (consoleOut.some((t) => t.includes(token))) issues.push('token in console');
          if (theme === 'day' && !(await page.evaluate(() => document.querySelector('.dlp').classList.contains('dlp-day')))) issues.push('day theme not applied');
          if (name === 'valid' && lang === 'fr') {
            const txt = await page.locator('.meta').innerText();
            if (!/3 sur 3/.test(txt)) issues.push('uses text missing');
          }
          ok(issues.length === 0, `${tag}${issues.length ? ' :: ' + issues.join('; ') : ''}`);
          await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: false });
          await page.close();
        }
        await ctx.close();
      }
    }
  }

  // ---- behaviour: real click => browser download, one use; second click in session free; 2nd FR/EN toggle
  {
    const ctx = await browser.newContext({ ...profiles.desktop, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('response', (x) => { if (x.url().includes('/api/download/')) console.log('  resp', x.status(), x.url().slice(-60)); });
    await page.goto(`${BASE}/telechargement/${S.valid.token}`, { waitUntil: 'networkidle' });
    ok(await used(S.valid.id) === 0, 'opening the landing consumed nothing (used_count 0)');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('a.dl').first().click()]);
    ok(/^[A-Z0-9]+_001\.jpg$/.test(dl.suggestedFilename()), `tile click => browser download ${dl.suggestedFilename()}`);
    await dl.path();
    await page.waitForTimeout(300);
    ok(await used(S.valid.id) === 1, 'one click consumed exactly 1 use');
    ok((await page.locator('.meta').innerText()).includes('2 sur 3'), 'meta decremented optimistically (2 sur 3)');
    // AC-15: while a download is busy (8 s) other controls ignore clicks; wait for it to clear.
    await page.waitForTimeout(8200);
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.locator('a.btn-primary').click()]);
    ok(/\.zip$/.test(dl2.suggestedFilename()), `Tout telecharger => ${dl2.suggestedFilename()}`);
    await dl2.path();
    ok(await used(S.valid.id) === 1, 'ZIP in the same 15-min session consumed nothing more');
    await page.waitForTimeout(4500);
    ok((await page.locator('.meta').innerText()).includes('2 sur 3') && /Session en cours/.test(await page.locator('main').innerText()), 'after router.refresh() the page matches the server (session open note)');
    // keyboard: Tab reaches the CTA, focus ring visible
    await page.keyboard.press('Tab');
    const focusOk = await page.evaluate(() => { const a = document.activeElement; return !!a && a.tagName !== 'BODY'; });
    ok(focusOk, 'keyboard Tab moves focus to a control');
    // parts page: first 12 tiles + reveal
    const p2 = await ctx.newPage();
    await p2.goto(`${BASE}/telechargement/${S.parts.token}`, { waitUntil: 'networkidle' });
    const nTiles = await p2.locator('.tile').count();
    const partRows = await p2.locator('.part').count();
    ok(nTiles === 12 && partRows >= 2, `parts view: ${partRows} parts, first ${nTiles} tiles`);
    await p2.getByRole('button', { name: /Afficher les/ }).click();
    ok((await p2.locator('.tile').count()) === 36, 'reveal adds 24 tiles');
    // refused navigation: exhaust then click
    const p3 = await ctx.newPage();
    await p3.goto(`${BASE}/telechargement/${S.last.token}`, { waitUntil: 'networkidle' });
    ok(/Dernière utilisation/.test(await p3.locator('main').innerText()), 'last-use callout shown at 1 use left');
    await ctx.close();
  }
  await browser.close();
} catch (e) {
  fail++; console.log('ERROR', e);
} finally {
  if (created.length) {
    await fetch(`${U}/rest/v1/events?request_id=in.(${created.join(',')})`, { method: 'DELETE', headers: H });
    await fetch(`${U}/rest/v1/download_requests?id=in.(${created.join(',')})`, { method: 'DELETE', headers: H });
  }
  console.log(`cleanup: ${created.length} test rows deleted\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
