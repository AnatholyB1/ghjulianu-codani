#!/usr/bin/env node
/**
 * Phase 10 e2e: view tracking (KPI-03), purge route (KPI-07), dashboard states (KPI-01..06).
 *
 * Usage (own server; port 3108 reserved for P10):
 *   IP_HASH_SALT=e2e-salt CRON_SECRET=e2e-cron-secret-123456 npx next start -p 3108
 *   PLAYWRIGHT_DIR=<dir containing node_modules/playwright> IP_HASH_SALT=e2e-salt \
 *     CRON_SECRET=e2e-cron-secret-123456 node scripts/e2e-kpis.mjs
 *
 * Needs .env.local (service role) for the DB assertions; reads it, never prints it.
 * Writes ONLY marked test rows into `events` / `rate_limits` (visitor_hash derived from
 * fixed test IPs 203.0.113.x + test UAs) and deletes them at the end. Reads
 * albums / album_photos / portfolio_photos (read only). No other table is touched.
 *
 * Optional sections:
 *   E2E_PREVIEW=1     visual checks of /kpi-preview (TEMPORARY harness page rendering StatsView with
 *                     data produced by the real kpi_dashboard SQL; never committed).
 *   E2E_ADMIN_AUTH=1  logs in as the first auth user through a magic-link token (touches auth
 *                     last_sign_in) and checks the real /admin/stats (requires migration 000002 applied).
 */
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3108';
const SHOTS = process.env.SHOTS_DIR ?? '.planning/phases/10-kpis-admin/evidence';
mkdirSync(SHOTS, { recursive: true });

const require = createRequire(
  (process.env.PLAYWRIGHT_DIR ? process.env.PLAYWRIGHT_DIR.replace(/[\\/]+$/, '') + '/' : process.cwd() + '/') + 'x.js',
);
let pw;
try { pw = require('playwright'); } catch { pw = require('playwright-core'); }
const { chromium, devices, request: apiRequest } = pw;

// ---- env (never printed) ----
const env = {};
try {
  for (const l of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
} catch { /* DB assertions will be skipped */ }
const SB = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const HAVE_DB = Boolean(SB && KEY);
const SALT = process.env.IP_HASH_SALT ?? '';
const CRON = process.env.CRON_SECRET ?? '';

const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const skip = (name, why) => console.log(`SKIP  ${name}  (${why})`);

async function db(pathAndQuery, init = {}) {
  const r = await fetch(`${SB}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) },
  });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null };
}

const parisDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
// H1: the view's visitor_hash is IP-only (no User-Agent) => 1 row per IP per target per day
function vhash(ip) {
  const daily = createHash('sha256').update(`${SALT}:${parisDate()}`).digest('hex');
  return createHash('sha256').update(`ip|${ip}|${daily}`).digest('hex').slice(0, 32);
}
const ipKey = (ip) => 'track:ip:' + createHash('sha256').update(`${SALT}:${ip.trim().toLowerCase()}`).digest('hex').slice(0, 32);

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const IP_D = '203.0.113.71', IP_M = '203.0.113.72', IP_R = '203.0.113.73', IP_U = '203.0.113.74';
const iphone = devices['iPhone 14'];
const hashes = [vhash(IP_D), vhash(IP_M), vhash(IP_R), vhash(IP_U)];

async function cleanup() {
  if (!HAVE_DB) return;
  const list = hashes.map((h) => `"${h}"`).join(',');
  await db(`events?visitor_hash=in.(${list})`, { method: 'DELETE' });
  for (const ip of [IP_D, IP_M, IP_R, IP_U]) await db(`rate_limits?key=eq.${encodeURIComponent(ipKey(ip))}`, { method: 'DELETE' });
}
const eventsFor = async (h) => (await db(`events?visitor_hash=eq.${h}&select=*&order=id`)).body ?? [];

const browser = await chromium.launch();
try {
  // ---------- fixtures (read only) ----------
  let photo = null, pubAlbum = null;
  if (HAVE_DB) {
    const ap = (await db('album_photos?select=id,src,album_id,is_day&limit=1')).body;
    photo = Array.isArray(ap) && ap[0] ? ap[0] : null;
    const al = (await db('albums?select=slug&is_public=eq.true&limit=1')).body;
    pubAlbum = Array.isArray(al) && al[0] ? al[0].slug : null;
    await cleanup();
  }

  // ---------- 1. /api/track contract (no browser) ----------
  const api = await apiRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { 'user-agent': DESKTOP_UA, 'x-forwarded-for': IP_R, 'content-type': 'text/plain' } });
  const post = (data, headers = {}) => api.post('/api/track', { data: typeof data === 'string' ? data : JSON.stringify(data), headers });
  check('track: GET not allowed (405)', (await api.get('/api/track')).status() === 405);
  check('track: invalid JSON -> 400', (await post('{nope')).status() === 400);
  check('track: type outside allowlist -> 400', (await post({ type: 'download', photo_id: '11111111-1111-4111-8111-111111111111' })).status() === 400);
  check('track: bad uuid -> 400', (await post({ type: 'view', photo_id: 'not-a-uuid' })).status() === 400);
  check('track: no id/src -> 400', (await post({ type: 'view' })).status() === 400);
  check('track: http (non-https) src -> 400', (await post({ type: 'view', src: 'http://x/y.jpg' })).status() === 400);
  check('track: oversized body -> 400', (await post({ type: 'view', src: 'https://x/' + 'a'.repeat(3000) })).status() === 400);
  check('track: foreign Origin -> 400', (await post({ type: 'view', photo_id: '11111111-1111-4111-8111-111111111111' }, { origin: 'https://evil.example' })).status() === 400);
  const ok = await post({ type: 'view', photo_id: '11111111-1111-4111-8111-111111111111' });
  check('track: well-formed unknown photo -> 204', ok.status() === 204);
  check('track: response sets no cookie', !ok.headersArray().some((h) => h.name.toLowerCase() === 'set-cookie'));
  check('track: Cache-Control no-store', (ok.headers()['cache-control'] ?? '').includes('no-store'));

  if (HAVE_DB && photo) {
    const botApi = await apiRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { 'x-forwarded-for': IP_R, 'content-type': 'text/plain' } });
    for (const ua of ['curl/8.4.0', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'HeadlessChrome/124 Safari', 'python-requests/2.31']) {
      const r = await botApi.post('/api/track', { data: JSON.stringify({ type: 'view', photo_id: photo.id }), headers: { 'user-agent': ua } });
      check(`bot UA dropped with 204: ${ua.slice(0, 22)}`, r.status() === 204);
    }
    const nous = await botApi.post('/api/track', { data: JSON.stringify({ type: 'view', photo_id: photo.id }), headers: { 'user-agent': '' } });
    check('missing UA dropped with 204', nous.status() === 204);
    // bots left no row (hash computed for each bot UA)
    const botHashes = [vhash(IP_R)];
    const botRows = (await db(`events?visitor_hash=in.(${botHashes.map((h) => `"${h}"`).join(',')})&select=id`)).body ?? [];
    check('bots: zero events rows written', botRows.length === 0);

    // real UA: written once, deduped by the unique index
    const r1 = await post({ type: 'view', photo_id: photo.id });
    const r2 = await post({ type: 'view', photo_id: photo.id });
    check('human UA accepted (204 x2)', r1.status() === 204 && r2.status() === 204);
    const rows = await eventsFor(hashes[2]);
    check('same photo + visitor + Paris day twice => exactly 1 row (DB unique index)', rows.length === 1, `rows=${rows.length}`);
    if (rows[0]) {
      const keys = Object.keys(rows[0]);
      check('row is server-derived: photo/album/is_day from DB, device desktop', rows[0].photo_id === photo.id && rows[0].album_id === photo.album_id && rows[0].device === 'desktop');
      check('row: no raw IP / UA column or value', !keys.some((k) => /(^ip|ip_|user_?agent|^ua$)/i.test(k)) && !JSON.stringify(rows[0]).includes(IP_R) && !JSON.stringify(rows[0]).includes('Mozilla'));
      check('row: visitor_hash is 32 hex (hashed)', /^[0-9a-f]{32}$/.test(rows[0].visitor_hash));
    }
    // rate limit: > 90 / min / visitor => counter keeps counting, rows stop (unknown photo -> no insert anyway)
    for (let i = 0; i < 95; i++) await post({ type: 'view', photo_id: '22222222-2222-4222-8222-222222222222' });
    const rl = (await db(`rate_limits?key=eq.${encodeURIComponent(ipKey(IP_R))}&select=count`)).body ?? [];
    check('rate limit counter incremented per IP (>90)', rl.reduce((a, b) => a + b.count, 0) > 90, `count=${rl.reduce((a, b) => a + b.count, 0)}`);
    // H1: 40 distinct (non-bot) User-Agents from ONE IP => exactly 1 view row for the target that day
    const uaApi = await apiRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { 'x-forwarded-for': IP_U, 'content-type': 'text/plain' } });
    const uaStatuses = [];
    for (let i = 0; i < 40; i++) {
      const ua = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${100 + i}.0.${i}.0 Safari/537.36`;
      uaStatuses.push((await uaApi.post('/api/track', { data: JSON.stringify({ type: 'view', photo_id: photo.id }), headers: { 'user-agent': ua } })).status());
    }
    check('H1: 40 distinct UAs from one IP all answered 204', uaStatuses.every((s) => s === 204));
    const uaRows = await eventsFor(hashes[3]);
    check('H1: 40 distinct UAs from one IP => exactly 1 view row per target per day', uaRows.length === 1, `rows=${uaRows.length}`);
    await uaApi.dispose();
  } else skip('DB-backed track assertions', 'no .env.local service role or no photos');
  await api.dispose();

  // ---------- 2. browser beacon (desktop + iPhone 14) ----------
  const profiles = [
    { name: 'desktop', ip: IP_D, ctx: { viewport: { width: 1440, height: 900 }, userAgent: DESKTOP_UA }, hash: hashes[0], device: 'desktop' },
    { name: 'iphone14', ip: IP_M, ctx: { ...iphone }, hash: hashes[1], device: 'mobile' },
  ];
  for (const p of profiles) {
    const ctx = await browser.newContext({ ...p.ctx, colorScheme: 'dark', extraHTTPHeaders: { 'x-forwarded-for': p.ip } });
    const page = await ctx.newPage();
    const beacons = [];
    // Playwright cannot read sendBeacon bodies: wrap sendBeacon in the page and collect the payloads.
    await page.addInitScript(() => {
      window.__beacons = [];
      const orig = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (url, data) => { if (String(url).endsWith('/api/track') && data instanceof Blob) data.text().then((t) => window.__beacons.push(t)); return orig(url, data); };
    });
    page.on('request', (r) => { if (r.url().endsWith('/api/track') && r.method() === 'POST') beacons.length = beacons.length; });
    const target = pubAlbum ? `/albums/${pubAlbum}` : '/portfolio';
    await page.goto(BASE + target, { waitUntil: 'load' });
    // scroll slowly so each image gets >= 50 % visible for > 1 s
    for (let y = 0; y < 3000; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(1300); }
    await page.waitForTimeout(1500);
    const raw = await page.evaluate(() => window.__beacons);
    beacons.push(...raw);
    const parsed = raw.map((b) => { try { return JSON.parse(b); } catch { return null; } }).filter(Boolean);
    check(`[${p.name}] beacon fired after real display (>=1 POST)`, parsed.length >= 1, `n=${parsed.length}`);
    check(`[${p.name}] payload carries only type + src (no identifiers, no UA, no IP)`, parsed.every((b) => Object.keys(b).sort().join() === 'src,type' && b.type === 'view'));
    check(`[${p.name}] each image sent at most once per session`, new Set(parsed.map((b) => b.src)).size === parsed.length);
    const before = raw.length;
    await page.reload({ waitUntil: 'load' });
    for (let y = 0; y < 3000; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(1300); }
    const after = await page.evaluate(() => window.__beacons.length);
    check(`[${p.name}] reload in same session sends no duplicate beacon (sessionStorage guard)`, after === 0, `new beacons after reload=${after}`);
    // never on load alone: new context navigates and leaves immediately
    const cookies = await ctx.cookies();
    check(`[${p.name}] no cookie set by the public pages / beacon`, cookies.length === 0, `cookies=${cookies.map((c) => c.name).join(',')}`);
    const jsCookie = await page.evaluate(() => document.cookie);
    check(`[${p.name}] document.cookie empty`, jsCookie === '');
    const ss = await page.evaluate(() => sessionStorage.getItem('vb-sent-v1'));
    check(`[${p.name}] sessionStorage only holds already-sent image URLs`, !ss || JSON.parse(ss).every((s) => /^https?:\/\//.test(s)));
    await ctx.close();
    if (HAVE_DB) {
      const rows = await eventsFor(p.hash);
      if (parsed.length) {
        check(`[${p.name}] DB rows exist for the beacon (<= beacons sent, deduped)`, rows.length >= 1 && rows.length <= parsed.length, `rows=${rows.length} beacons=${parsed.length}`);
        check(`[${p.name}] DB device = ${p.device}, type=view, hashed visitor`, rows.length > 0 && rows.every((r) => r.device === p.device && r.type === 'view' && /^[0-9a-f]{32}$/.test(r.visitor_hash)));
        check(`[${p.name}] no duplicate (photo, visitor) rows today`, new Set(rows.map((r) => r.photo_id)).size === rows.length);
      }
    }
  }

  // ---------- 3. no beacon on /admin ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: DESKTOP_UA });
    const page = await ctx.newPage();
    let n = 0; page.on('request', (r) => { if (r.url().endsWith('/api/track')) n++; });
    await page.goto(BASE + '/admin/login', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    check('no /api/track request from /admin pages', n === 0);
    const resp = await page.goto(BASE + '/admin/stats', { waitUntil: 'load' });
    check('unauthenticated /admin/stats redirects to /admin/login', page.url().includes('/admin/login'), page.url());
    check('unauthenticated redirect leaks no stats content', !(await page.content()).includes('Suivi des téléchargements'));
    void resp;
    await ctx.close();
  }

  // ---------- 4. purge route ----------
  {
    const noAuth = await fetch(BASE + '/api/cron/purge-events', { method: 'POST' });
    check('purge route: no secret -> 401 (or 503 when CRON_SECRET unset)', [401, 503].includes(noAuth.status), `status=${noAuth.status}`);
    const bad = await fetch(BASE + '/api/cron/purge-events', { method: 'POST', headers: { authorization: 'Bearer wrong-wrong-wrong-wrong' } });
    check('purge route: wrong secret rejected', [401, 503].includes(bad.status), `status=${bad.status}`);
    if (CRON) {
      const good = await fetch(BASE + '/api/cron/purge-events', { method: 'POST', headers: { authorization: `Bearer ${CRON}` } });
      const body = await good.json().catch(() => ({}));
      check('purge route: correct secret -> 200 and purge_old_events ran', good.status === 200 && body.ok === true, `status=${good.status} purged=${body.purged}`);
    } else skip('purge route authorised call', 'CRON_SECRET not provided to the script');
  }

  // ---------- 5. dashboard on the real route (needs migration 000002 + admin session) ----------
  if (process.env.E2E_ADMIN_AUTH === '1' && HAVE_DB) {
    const admin = await fetch(`${SB}/auth/v1/admin/users?per_page=1`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
    const email = admin.users?.[0]?.email;
    const link = await fetch(`${SB}/auth/v1/admin/generate_link`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', email }) }).then((r) => r.json());
    const ver = await fetch(`${SB}/auth/v1/verify`, { method: 'POST', headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', token_hash: link.hashed_token }) }).then((r) => r.json());
    if (ver.access_token) {
      const ref = new URL(SB).hostname.split('.')[0];
      const session = JSON.stringify({ access_token: ver.access_token, refresh_token: ver.refresh_token, expires_in: ver.expires_in, expires_at: ver.expires_at, token_type: 'bearer', user: ver.user });
      const value = 'base64-' + Buffer.from(session).toString('base64url');
      for (const [name, vp, ctxExtra] of [['desktop', { width: 1440, height: 900 }, {}], ['iphone14', null, iphone]]) {
        const ctx = await browser.newContext({ ...(vp ? { viewport: vp } : {}), ...ctxExtra, colorScheme: 'dark' });
        await ctx.addCookies([{ name: `sb-${ref}-auth-token`, value, url: BASE }]);
        const page = await ctx.newPage();
        for (const per of [7, 30, 90]) {
          await page.goto(`${BASE}/admin/stats?p=${per}`, { waitUntil: 'load' });
          const h1 = await page.locator('h1').first().textContent();
          check(`[${name}] /admin/stats?p=${per} renders (h1)`, /Suivi des téléchargements/.test(h1 ?? ''));
          const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          check(`[${name}] p=${per} no horizontal page overflow (A1)`, ov <= 0, `overflow=${ov}`);
          const stateTxt = (await page.locator('.st').innerText()).slice(0, 4000);
          const state = /Impossible de charger/.test(stateTxt) ? 'error' : /Pas encore de données/.test(stateTxt) ? 'empty' : 'content';
          console.log(`INFO  [${name}] p=${per} state=${state}`);
          await page.screenshot({ path: `${SHOTS}/stats-real-${name}-${per}-${state}.png`, fullPage: true });
        }
        await ctx.close();
      }
    } else skip('authenticated dashboard', 'could not create an admin session');
  } else skip('authenticated real /admin/stats', 'set E2E_ADMIN_AUTH=1 (needs migration 000002 applied)');

  // ---------- 6. visual harness (temporary page, data from real SQL) ----------
  if (process.env.E2E_PREVIEW === '1') {
    for (const [name, vp, extra] of [['desktop', { width: 1440, height: 900 }, {}], ['iphone14', null, iphone]]) {
      const ctx = await browser.newContext({ ...(vp ? { viewport: vp } : {}), ...extra, colorScheme: 'dark' });
      const page = await ctx.newPage();
      for (const p of ['sql', '7', '30', '90']) {
        await page.goto(`${BASE}/kpi-preview?p=${p}`, { waitUntil: 'load' });
        await page.locator('#st-root').waitFor();
        const m = await page.evaluate(() => {
          const root = document.getElementById('st-root');
          const scroller = root.closest('div[style*="fixed"]');
          const over = scroller.scrollWidth - scroller.clientWidth;
          let smallText = 0, small = [];
          const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            if (!n.textContent.trim()) continue;
            const el = n.parentElement; const cs = getComputedStyle(el);
            if (cs.display === 'none' || el.closest('.sr-only') || el.closest('svg') || el.closest('details:not([open]) > :not(summary)')) continue;
            if (parseFloat(cs.fontSize) < 13.99) { smallText++; small.push(el.className + ':' + cs.fontSize); }
          }
          const taps = [...root.querySelectorAll('summary,a,button,[role=region]')].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
          const tapBad = taps.filter(([w2, h2]) => h2 < 44 || w2 < 44).length;
          const tables = root.querySelectorAll('details.data table').length;
          return { over, smallText, small: small.slice(0, 3), tapBad, tables, details: root.querySelectorAll('details.data').length };
        });
        check(`[preview ${name}] p=${p} no horizontal overflow (A1)`, m.over <= 0, `over=${m.over}`);
        check(`[preview ${name}] p=${p} min text 14px (A2)`, m.smallText === 0, JSON.stringify(m.small));
        check(`[preview ${name}] p=${p} interactive >= 44px (A3)`, m.tapBad === 0, `bad=${m.tapBad}`);
        check(`[preview ${name}] p=${p} every chart card has a data table (A6)`, m.tables === m.details && m.tables >= 1, `tables=${m.tables}`);
        await page.locator('details.data summary').first().click().catch(() => {});
        await page.screenshot({ path: `${SHOTS}/stats-preview-${name}-${p}.png`, fullPage: true });
      }
      await ctx.close();
    }
    // reconcile: SQL fixture daily sum equals tile
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/kpi-preview?p=sql`, { waitUntil: 'load' });
    const txt = await page.locator('#st-root').innerText();
    check('[preview] SQL fixture: Vues tile = 4 and Téléchargements = 3 (matches SQL assertions)', /Vues\s*\n?\s*4\b/.test(txt) && /Téléchargements\s*\n?\s*3\b/.test(txt));
    await ctx.close();
  }
} finally {
  await cleanup().catch(() => {});
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
