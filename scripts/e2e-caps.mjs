#!/usr/bin/env node
/**
 * e2e for the download-email daily caps (per-IP and global), driving the real UI.
 *
 * Server (own port, mail guarded: ALLOW_EMAIL_SEND unset):
 *   DOWNLOAD_IP_DAILY_CAP=2 DOWNLOAD_EMAIL_DAILY_CAP=3 SUPPORT_EMAIL=support@example.org DOWNLOAD_TOKEN_SECRET=... IP_HASH_SALT=... \
 *   NEXT_PUBLIC_SITE_URL=http://localhost:3131 npx next start -p 3131
 * Client:
 *   NODE_PATH=<repo>/node_modules PLAYWRIGHT_DIR=<dir with playwright> BASE_URL=http://localhost:3131 node scripts/e2e-caps.mjs
 *
 * Expected: IP A: requests 1-2 succeed, 3rd shows the visible "too many requests" state (per-IP daily cap).
 *           IP B: succeeds (global 3/3). IP C: visible "service temporarily unavailable" + support address.
 * Test data: e2e-caps-*@example.org, TEST-NET-3 fake IPs; deletes its own download_requests and the dlreq:global:day /
 * dlreq:ipday: rate_limits rows before and after (v1.1 tables only). albums / album_photos are read only.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3131';
const require = createRequire(
  (process.env.PLAYWRIGHT_DIR ? process.env.PLAYWRIGHT_DIR.replace(/[\\/]+$/, '') + '/' : process.cwd() + '/') + 'x.js',
);
let pw;
try { pw = require('playwright'); } catch { pw = require('playwright-core'); }
const { chromium } = pw;
const { createClient } = createRequire(process.cwd() + '/x.js')('@supabase/supabase-js');
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RUN = Date.now().toString(36);
let fails = 0, passes = 0;
const check = (name, ok, extra = '') => { ok ? passes++ : fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };

async function cleanup() {
  await db.from('rate_limits').delete().eq('key', 'dlreq:global:day');
  await db.from('rate_limits').delete().like('key', 'dlreq:ipday:%');
  await db.from('download_requests').delete().like('email', 'e2e-caps-%@example.org');
}

async function submitOnce(browser, ip, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'x-forwarded-for': ip } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/albums/${SLUG}`);
  const btns = page.locator('button[aria-label="Ajouter au panier"]');
  await btns.first().waitFor({ state: 'attached', timeout: 20000 });
  for (let attempt = 0; attempt < 5; attempt++) {
    await btns.first().scrollIntoViewIfNeeded();
    await btns.first().click({ force: true });
    const ok = await page.waitForFunction(() => Number(document.querySelector('[data-testid="cart-count"]')?.textContent) >= 1, null, { timeout: 4000 }).then(() => true, () => false);
    if (ok) break;
  }
  await page.locator('button[aria-label="Ouvrir le panier"]').click();
  await page.locator('[data-testid="cta-request"]').click();
  await page.locator('input[name="email"]').fill(`e2e-caps-${RUN}-${tag}@example.org`);
  await sleep(2300);
  await page.locator('button[type="submit"][form]').click();
  const el = page.locator('.rq-drawer [role="status"], .rq-drawer [role="alert"]').first();
  await el.waitFor({ state: 'visible', timeout: 20000 });
  const role = await el.getAttribute('role');
  const text = (await el.innerText()).trim();
  await ctx.close();
  return { role, text };
}

const SLUG = (await db.from('albums').select('slug').eq('is_public', true).limit(1)).data?.[0]?.slug;
const browser = await chromium.launch();
try {
  await cleanup();
  const a1 = await submitOnce(browser, '203.0.113.201', 'a1');
  check('IP A request 1 succeeds', a1.role === 'status', a1.text.slice(0, 50));
  const a2 = await submitOnce(browser, '203.0.113.201', 'a2');
  check('IP A request 2 succeeds', a2.role === 'status', a2.text.slice(0, 50));
  const a3 = await submitOnce(browser, '203.0.113.201', 'a3');
  check('IP A request 3: visible per-IP daily cap error (not fake success)', a3.role === 'alert' && /Trop de demandes/.test(a3.text), a3.text.slice(0, 60));
  const b1 = await submitOnce(browser, '203.0.113.202', 'b1');
  check('IP B request succeeds (global 3/3)', b1.role === 'status', b1.text.slice(0, 50));
  const c1 = await submitOnce(browser, '203.0.113.203', 'c1');
  check('IP C: global cap shows visible friendly error with support address', c1.role === 'alert' && /indisponible/.test(c1.text) && /support@example\.org/.test(c1.text), c1.text.slice(0, 120));
  const { count } = await db.from('download_requests').select('id', { count: 'exact', head: true }).like('email', `e2e-caps-${RUN}-%`);
  check('exactly 3 requests stored (cap-refused ones stored nothing)', count === 3, `count=${count}`);
} finally {
  await cleanup();
  await browser.close();
}
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
