#!/usr/bin/env node
/**
 * Phase 9 e2e (NWS-01..05) against a REAL server + the real (shared) Supabase project.
 *
 * Terminal 1 (own port 3107, mail guarded: VERCEL_ENV unset => sendEmail never calls Resend):
 *   npm run build
 *   DOWNLOAD_TOKEN_SECRET=e2e-secret-0123456789abcdef IP_HASH_SALT=e2e-salt-0123456789 \
 *   RESEND_WEBHOOK_SECRET=whsec_MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY= \
 *   RESEND_FROM='Julianu Codani <photos@mail.example.com>' NEXT_PUBLIC_SITE_URL=http://localhost:3107 \
 *   npx next start -p 3107
 * Terminal 2:
 *   PLAYWRIGHT_DIR=<dir containing node_modules/playwright> \
 *   node --env-file=.env.local --import ./scripts/ts-register.mjs scripts/e2e-newsletter.mjs
 *
 * Test rows: email nws-e2e-*@example.org only (subscribers, download_requests, events by request_id).
 * They are deleted at the end (and at the start, in case of a previous crash). Nothing else is touched.
 * Admin pages need a Supabase admin session and are NOT driven here (see 09-SUMMARY "not proven").
 */
import { createRequire } from 'node:module';
import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.BASE_URL ?? 'http://localhost:3107';
const SHOTS = process.env.SHOTS_DIR ?? '.planning/phases/09-newsletter/evidence';
const WH_SECRET = process.env.RESEND_WEBHOOK_SECRET ?? 'whsec_MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
process.env.DOWNLOAD_TOKEN_SECRET ??= 'e2e-secret-0123456789abcdef';

const require = createRequire(
  (process.env.PLAYWRIGHT_DIR ? process.env.PLAYWRIGHT_DIR.replace(/[\\/]+$/, '') + '/' : process.cwd() + '/') + 'x.js',
);
let pw;
try { pw = require('playwright'); } catch { pw = require('playwright-core'); }
const { chromium, devices } = pw;

const { signUnsubscribe, newToken, hashToken } = await import('../src/lib/server/tokens.ts');
const { signSvix } = await import('../src/lib/newsletter/svix.ts');

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
mkdirSync(SHOTS, { recursive: true });

let failed = 0;
const check = (name, ok, extra = '') => {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
};
const RUN = Date.now().toString(36);
const addr = (tag) => `nws-e2e-${RUN}-${tag}@example.org`;
const hours = (h) => new Date(Date.now() + h * 3_600_000).toISOString();

async function cleanup() {
  const { data: reqs } = await db.from('download_requests').select('id').like('email', 'nws-e2e-%@example.org');
  const ids = (reqs ?? []).map((r) => r.id);
  if (ids.length) await db.from('events').delete().in('request_id', ids);
  await db.from('download_requests').delete().like('email', 'nws-e2e-%@example.org');
  const { error } = await db.from('subscribers').delete().like('email', 'nws-e2e-%@example.org');
  return error;
}
async function mkSub(tag, over = {}) {
  const token = newToken();
  const row = {
    email: addr(tag), status: 'pending', lang: 'fr', source: 'download', consent_text_version: 'v1', consent_at: new Date().toISOString(),
    confirm_token_hash: hashToken(token), confirm_expires_at: hours(47), ...over,
  };
  const { error } = await db.from('subscribers').insert(row);
  if (error) throw new Error('insert ' + tag + ': ' + error.message);
  return { email: row.email, token };
}
const getSub = async (email) => (await db.from('subscribers').select('*').eq('email', email).maybeSingle()).data;

async function layoutChecks(page, label) {
  const r = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    let small = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (el.closest('script,style,noscript')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (parseFloat(cs.fontSize) < 14) small++;
    }
    let tiny = 0;
    document.querySelectorAll('main button, main a[href], header button, header a[href], footer a[href]').forEach((el) => {
      if (el.closest('p')) return;
      const b = el.getBoundingClientRect();
      if (b.width && (b.width < 43.5 || b.height < 43.5)) tiny++;
    });
    return { over, small, tiny };
  });
  check(`${label}: no horizontal overflow`, !r.over);
  check(`${label}: no text under 14px`, r.small === 0, `(${r.small})`);
  check(`${label}: tap targets >= 44px`, r.tiny === 0, `(${r.tiny} too small)`);
}

const h1 = async (page) => (await page.locator('h1').first().innerText()).trim();

async function publicFlows(browser, profile, ctxOpts, mode, lang) {
  const tag = `${profile}-${mode}`;
  const label = (s) => `[${tag}] ${s}`;
  const ctx = await browser.newContext({ ...ctxOpts, locale: lang === 'fr' ? 'fr-FR' : 'en-US' });
  await ctx.addInitScript((m) => {
    try { localStorage.setItem('day-night-storage', JSON.stringify({ state: { mode: m }, version: 0 })); } catch {}
  }, mode);
  const page = await ctx.newPage();
  const T = lang === 'fr'
    ? { ready: /Confirmez votre inscription/, done: /Inscription confirmée/, already: /Déjà confirmé/, expired: /Ce lien a expiré/, unsub: /Se désinscrire de la newsletter/, unsubDone: /Vous êtes désinscrit/, unsubAlready: /Déjà désinscrit/, bad: /Lien non reconnu/ }
    : { ready: /Confirm your subscription/, done: /Subscription confirmed/, already: /Already confirmed/, expired: /This link has expired/, unsub: /Unsubscribe from the newsletter/, unsubDone: /You are unsubscribed/, unsubAlready: /Already unsubscribed/, bad: /Link not recognised/ };

  // ---- NWS-01 confirm: GET is read-only, POST confirms, replay idempotent
  const a = await mkSub(`${tag}-a`, { lang });
  await page.goto(`${BASE}/newsletter/confirmer?t=${a.token}`);
  check(label('confirm ready h1'), T.ready.test(await h1(page)));
  check(label('theme class matches mode'), (await page.evaluate(() => document.documentElement.classList.contains('day'))) === (mode === 'day'));
  const bodyText = await page.locator('main').innerText();
  check(label('address masked, full address absent'), !bodyText.includes(a.email) && bodyText.includes(a.email[0] + '***@example.org'));
  check(label('recap shows stored consent text'), bodyText.length > 200 && /newsletter/i.test(bodyText));
  await layoutChecks(page, label('confirm ready'));
  await page.screenshot({ path: `${SHOTS}/confirm-ready-${tag}.png`, fullPage: true });
  await page.reload();
  await page.reload();
  let s = await getSub(a.email);
  check(label('AC-M1 GET x3 leaves row pending'), s.status === 'pending' && !s.confirmed_at);
  await page.getByRole('button', { name: lang === 'fr' ? /Confirmer mon inscription/ : /Confirm my subscription/ }).click();
  await page.getByRole('heading', { name: T.done }).waitFor({ timeout: 15000 });
  s = await getSub(a.email);
  check(label('AC-M2 POST sets confirmed + confirmed_at, consent_at kept'), s.status === 'confirmed' && !!s.confirmed_at && !!s.consent_at);
  check(label('focus moved to h1 after POST'), await page.evaluate(() => document.activeElement?.tagName === 'H1'));
  await layoutChecks(page, label('confirm confirmed'));
  await page.screenshot({ path: `${SHOTS}/confirm-confirmed-${tag}.png`, fullPage: true });
  await page.goto(`${BASE}/newsletter/confirmer?t=${a.token}`);
  check(label('AC-M2 replay shows already'), T.already.test(await h1(page)));
  s = await getSub(a.email);
  check(label('replay changes nothing'), s.status === 'confirmed');
  await page.screenshot({ path: `${SHOTS}/confirm-already-${tag}.png`, fullPage: true });

  // expired + unknown (no enumeration)
  const e = await mkSub(`${tag}-exp`, { lang, confirm_expires_at: hours(-1) });
  await page.goto(`${BASE}/newsletter/confirmer?t=${e.token}`);
  check(label('expired shows expired state'), T.expired.test(await h1(page)));
  const expText = await page.locator('main').innerText();
  check(label('expired page shows no address'), !expText.includes('@'));
  await layoutChecks(page, label('confirm expired'));
  await page.screenshot({ path: `${SHOTS}/confirm-expired-${tag}.png`, fullPage: true });
  check(label('expired row untouched (still pending)'), (await getSub(e.email)).status === 'pending');
  await page.goto(`${BASE}/newsletter/confirmer?t=${newToken()}`);
  const unkText = await page.locator('main').innerText();
  check(label('AC-M3 unknown token = expired copy, no address'), T.expired.test(await h1(page)) && !unkText.includes('@'));
  await page.goto(`${BASE}/newsletter/confirmer`);
  check(label('missing token = expired copy'), T.expired.test(await h1(page)));

  // ---- NWS-02 unsubscribe page
  const u = await mkSub(`${tag}-u`, { lang, status: 'confirmed', confirmed_at: new Date().toISOString(), confirm_token_hash: null, confirm_expires_at: null });
  const sig = signUnsubscribe(u.email);
  await page.goto(`${BASE}/newsletter/desinscription?s=${encodeURIComponent(sig)}`);
  check(label('unsub ready h1'), T.unsub.test(await h1(page)));
  await layoutChecks(page, label('unsub ready'));
  await page.screenshot({ path: `${SHOTS}/unsub-ready-${tag}.png`, fullPage: true });
  await page.reload();
  check(label('AC-M4 GET leaves row confirmed'), (await getSub(u.email)).status === 'confirmed');
  await page.getByRole('button', { name: lang === 'fr' ? /Me désinscrire/ : /Unsubscribe me/ }).click();
  await page.getByRole('heading', { name: T.unsubDone }).waitFor({ timeout: 15000 });
  s = await getSub(u.email);
  check(label('POST unsubscribes immediately (+ unsubscribed_at)'), s.status === 'unsubscribed' && !!s.unsubscribed_at);
  await layoutChecks(page, label('unsub confirmed'));
  await page.screenshot({ path: `${SHOTS}/unsub-confirmed-${tag}.png`, fullPage: true });
  await page.goto(`${BASE}/newsletter/desinscription?s=${encodeURIComponent(sig)}`);
  check(label('unsub replay shows already'), T.unsubAlready.test(await h1(page)));
  await page.goto(`${BASE}/newsletter/desinscription?s=${encodeURIComponent(sig.slice(0, -3) + 'AAA')}`);
  check(label('tampered signature -> not recognised, no address'), T.bad.test(await h1(page)) && !(await page.locator('main').innerText()).includes('@'));
  await layoutChecks(page, label('unsub invalid'));
  await page.screenshot({ path: `${SHOTS}/unsub-invalid-${tag}.png`, fullPage: true });

  // robots noindex + no-store-ish
  const robots = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '');
  check(label('noindex meta'), /noindex/.test(robots));
  await ctx.close();
}

const post = (url, init = {}) => fetch(url, { method: 'POST', redirect: 'manual', ...init });

async function oneClickAndWebhook() {
  // ---- RFC 8058 one-click (no cookies, no CSRF)
  const o = await mkSub('oneclick', { status: 'confirmed', confirmed_at: new Date().toISOString(), confirm_token_hash: null, confirm_expires_at: null });
  const sig = signUnsubscribe(o.email);
  const g = await fetch(`${BASE}/api/newsletter/unsubscribe?s=${encodeURIComponent(sig)}`, { redirect: 'manual' });
  check('one-click GET redirects (303) and does NOT unsubscribe', g.status === 303 && (await getSub(o.email)).status === 'confirmed');
  const bad = await post(`${BASE}/api/newsletter/unsubscribe?s=${encodeURIComponent(sig.slice(0, -3) + 'AAA')}`, { headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  check('one-click POST with tampered sig -> 400, row unchanged', bad.status === 400 && (await getSub(o.email)).status === 'confirmed');
  const okr = await post(`${BASE}/api/newsletter/unsubscribe?s=${encodeURIComponent(sig)}`, { headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  check('AC-M4 one-click POST -> 200, status unsubscribed', okr.status === 200 && (await getSub(o.email)).status === 'unsubscribed');
  const again = await post(`${BASE}/api/newsletter/unsubscribe?s=${encodeURIComponent(sig)}`);
  check('one-click POST replay -> 200 (idempotent)', again.status === 200);
  const none = await post(`${BASE}/api/newsletter/unsubscribe?s=${encodeURIComponent(signUnsubscribe(addr('not-in-list')))}`);
  check('one-click POST for unknown address -> 200 no-op', none.status === 200);

  // ---- NWS-03 webhook
  const wh = (evt, { secret = WH_SECRET, ts = Math.floor(Date.now() / 1000), id = 'msg_' + randomBytes(6).toString('hex'), tamper = false } = {}) => {
    const body = JSON.stringify(evt);
    const sg = 'v1,' + signSvix(secret, id, ts, body);
    return post(`${BASE}/api/webhooks/resend`, {
      headers: { 'content-type': 'application/json', 'svix-id': id, 'svix-timestamp': String(ts), 'svix-signature': tamper ? 'v1,AAAA' + sg.slice(7) : sg },
      body: tamper ? body.replace('email.', 'email.') + ' ' : body,
    });
  };
  const OWN = 'Julianu Codani <photos@mail.example.com>';
  const mk = (type, to, extra = {}, from = OWN) => ({ type, created_at: new Date().toISOString(), data: { email_id: 'e_1', from, to: [to], subject: 's', ...extra } });

  const b = await mkSub('bounce', { status: 'confirmed', confirmed_at: new Date().toISOString() });
  const c = await mkSub('complaint', { status: 'confirmed', confirmed_at: new Date().toISOString() });
  const f = await mkSub('foreign', { status: 'confirmed', confirmed_at: new Date().toISOString() });
  const t = await mkSub('transient', { status: 'confirmed', confirmed_at: new Date().toISOString() });

  const r401 = await wh(mk('email.bounced', b.email, { bounce: { type: 'Permanent' } }), { tamper: true });
  check('AC-M6 invalid signature -> 401, nothing changes', r401.status === 401 && (await getSub(b.email)).status === 'confirmed');
  const rWrong = await wh(mk('email.bounced', b.email, { bounce: { type: 'Permanent' } }), { secret: 'whsec_' + Buffer.from('wrong-secret-wrong-secret-12345').toString('base64') });
  check('wrong secret -> 401', rWrong.status === 401);
  const rOld = await wh(mk('email.bounced', b.email, { bounce: { type: 'Permanent' } }), { ts: Math.floor(Date.now() / 1000) - 3600 });
  check('stale timestamp -> 401', rOld.status === 401);
  const noHdr = await post(`${BASE}/api/webhooks/resend`, { body: '{}' });
  check('missing signature headers -> 401', noHdr.status === 401);

  const rb = await wh(mk('email.bounced', `Someone <${b.email.toUpperCase()}>`, { bounce: { type: 'Permanent', subType: 'General', message: 'x' } }));
  let s = await getSub(b.email);
  check('AC-M6 signed hard bounce -> 200, suppressed/hard_bounce', rb.status === 200 && s.status === 'suppressed' && s.suppressed_reason === 'hard_bounce');
  const rb2 = await wh(mk('email.bounced', b.email, { bounce: { type: 'Permanent' } }));
  const j2 = await rb2.json();
  check('replay is idempotent (200, 0 rows changed, reason kept)', rb2.status === 200 && j2.suppressed === 0 && (await getSub(b.email)).suppressed_reason === 'hard_bounce');

  const rc = await wh(mk('email.complained', c.email));
  s = await getSub(c.email);
  check('complaint -> suppressed/complaint', rc.status === 200 && s.status === 'suppressed' && s.suppressed_reason === 'complaint');

  const rf = await wh(mk('email.complained', f.email, {}, 'Other App <x@other-app.com>'));
  check('foreign sender domain -> 200 ignored, row untouched', rf.status === 200 && (await getSub(f.email)).status === 'confirmed');
  const rt = await wh(mk('email.bounced', t.email, { bounce: { type: 'Transient' } }));
  check('soft (Transient) bounce ignored', rt.status === 200 && (await getSub(t.email)).status === 'confirmed');
  const rd = await wh(mk('email.delivered', t.email));
  check('other event types -> 200 no effect', rd.status === 200 && (await getSub(t.email)).status === 'confirmed');
  const rU = await wh(mk('email.complained', addr('unknown-addr')));
  check('unknown recipient -> 200, nothing recorded', rU.status === 200 && !(await getSub(addr('unknown-addr'))));
  const rJ = await post(`${BASE}/api/webhooks/resend`, { headers: { 'content-type': 'application/json' }, body: 'not json' });
  check('unsigned garbage -> 401', rJ.status === 401);

  // suppressed rows cannot be re-enabled by unsubscribe (stays suppressed)
  const rs = await post(`${BASE}/api/newsletter/unsubscribe?s=${encodeURIComponent(signUnsubscribe(b.email))}`);
  check('unsubscribe never downgrades a suppressed row', rs.status === 200 && (await getSub(b.email)).status === 'suppressed');
}

async function adminAndErasure() {
  const r = await fetch(`${BASE}/admin/newsletter`, { redirect: 'manual' });
  check('admin page unauthenticated -> redirect to login', [302, 303, 307, 308].includes(r.status) && (r.headers.get('location') ?? '').includes('/admin/login'));
  const x = await fetch(`${BASE}/admin/newsletter/export`, { redirect: 'manual' });
  check('CSV export unauthenticated -> no data (redirect/401)', [302, 303, 307, 308, 401].includes(x.status) && !(x.headers.get('content-type') ?? '').includes('text/csv'));

  // Erasure scope on the real schema: same sequence of queries as deleteSubscriber (src/app/admin/newsletter/actions.ts).
  const d = await mkSub('erase', { status: 'confirmed', confirmed_at: new Date().toISOString() });
  const { data: dr, error: e1 } = await db.from('download_requests').insert({ email: d.email, token_hash: hashToken(newToken()), expires_at: hours(48), photos: [] }).select('id').single();
  check('erasure setup: download_request inserted', !e1, e1?.message ?? '');
  const { error: e2 } = await db.from('events').insert({ type: 'request', request_id: dr.id });
  check('erasure setup: event tied to request inserted', !e2, e2?.message ?? '');
  await db.from('events').delete().in('request_id', [dr.id]);
  await db.from('download_requests').delete().eq('email', d.email);
  await db.from('subscribers').delete().eq('id', (await getSub(d.email)).id);
  const left = {
    sub: !!(await getSub(d.email)),
    req: ((await db.from('download_requests').select('id').eq('email', d.email)).data ?? []).length,
    evt: ((await db.from('events').select('id').eq('request_id', dr.id)).data ?? []).length,
  };
  check('AC-M8 (query sequence) email gone from subscribers, download_requests, events', !left.sub && left.req === 0 && left.evt === 0);
}

function hookTest() {
  const email = addr('hook');
  const r = spawnSync(process.execPath, ['--env-file=.env.local', '--import', './scripts/ts-register.mjs', 'scripts/e2e-newsletter-hook.mjs', email], {
    encoding: 'utf8',
    env: { ...process.env, NEXT_PUBLIC_SITE_URL: BASE, VERCEL_ENV: '', ALLOW_EMAIL_SEND: '' },
  });
  const out = (r.stdout ?? '').split('\n').filter((l) => l.startsWith('ok'));
  for (const l of out) check('hook: ' + l.slice(5), true);
  check('hook script exit 0 (enqueueConfirmation + email render)', r.status === 0, r.status === 0 ? '' : (r.stderr ?? '').split('\n').slice(0, 6).join(' | '));
}

const preErr = await cleanup();
if (preErr) { console.error('cleanup failed (tables missing?):', preErr.message); process.exit(2); }
const browser = await chromium.launch();
try {
  await publicFlows(browser, 'desktop', { viewport: { width: 1440, height: 900 } }, 'night', 'fr');
  await publicFlows(browser, 'desktop', { viewport: { width: 1440, height: 900 } }, 'day', 'en');
  await publicFlows(browser, 'iphone14', { ...devices['iPhone 14'] }, 'night', 'fr');
  await publicFlows(browser, 'iphone14', { ...devices['iPhone 14'] }, 'day', 'en');
  await oneClickAndWebhook();
  await adminAndErasure();
  hookTest();
} catch (e) {
  failed++;
  console.error('FAIL  exception:', e);
} finally {
  await browser.close();
  const err = await cleanup();
  const { count } = await db.from('subscribers').select('id', { count: 'exact', head: true }).like('email', 'nws-e2e-%@example.org');
  check('cleanup: no nws-e2e rows left', !err && count === 0, err?.message ?? '');
  void createHash;
}
console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
process.exit(failed ? 1 : 0);
