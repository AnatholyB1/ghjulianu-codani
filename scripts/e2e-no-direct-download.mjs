#!/usr/bin/env node
/**
 * PRT-01 e2e: no UI path triggers a direct file download.
 *   PLAYWRIGHT_DIR=/dir/with/node_modules/playwright BASE_URL=http://localhost:3124 node scripts/e2e-no-direct-download.mjs
 * Read-only on albums/album_photos. Checks, on portfolio, albums list, public album, private album (after key entry),
 * lightbox and cart drawer, across desktop + iPhone 14 and night + day:
 *  - no `download` event fires on any click, no a[download], no blob: href, no legacy download button/modal text.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3124';
const require = createRequire((process.env.PLAYWRIGHT_DIR ? process.env.PLAYWRIGHT_DIR.replace(/[\\/]+$/, '') + '/' : process.cwd() + '/') + 'x.js');
let pw; try { pw = require('playwright'); } catch { pw = require('playwright-core'); }
const { chromium, devices } = pw;
const { createClient } = require('@supabase/supabase-js');
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: albums } = await db.from('albums').select('id, slug, is_public, access_key');
const pub = albums.find((a) => a.is_public);
const priv = albums.find((a) => !a.is_public && a.access_key);

let fails = 0;
const check = (n, ok, x = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  ' + x : ''}`); };
const LEGACY = /TÉLÉCHARGER (LES PHOTOS|QUAND MÊME|L'ALBUM|LE ZIP)|DOWNLOAD THE PHOTOS|Toutes vos photos,\s*en un clic|AVANT DE TÉLÉCHARGER|CHOISIR UN DOSSIER/i;

const browser = await chromium.launch();
let ip = 10;
for (const prof of ['desktop', 'iphone']) for (const theme of ['night', 'day']) {
  const tag = `${prof}/${theme}`;
  const opts = prof === 'iphone' ? { ...devices['iPhone 14'] } : { viewport: { width: 1440, height: 900 } };
  const ctx = await browser.newContext({ ...opts, acceptDownloads: true, extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${ip++}` } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} document.documentElement.setAttribute('data-theme', t === 'day' ? 'light' : 'dark'); }, theme);
  const page = await ctx.newPage();
  let downloads = 0;
  page.on('download', () => downloads++);
  const scan = async (label) => {
    const r = await page.evaluate(() => ({
      dl: document.querySelectorAll('a[download]').length,
      blob: [...document.querySelectorAll('a[href^="blob:"]')].length,
      text: document.body.innerText,
      fsa: typeof window.showDirectoryPicker,
    }));
    check(`[${tag}] ${label}: no a[download] / blob: link`, r.dl === 0 && r.blob === 0);
    check(`[${tag}] ${label}: no legacy download copy`, !LEGACY.test(r.text));
  };
  const clickAll = async (sel, max = 8) => {
    const loc = page.locator(sel);
    const n = Math.min(await loc.count(), max);
    for (let i = 0; i < n; i++) { try { await loc.nth(i).click({ timeout: 1500, trial: false, force: true }); } catch {} }
  };

  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' }); await scan('portfolio');
  await page.goto(`${BASE}/albums`, { waitUntil: 'networkidle' }); await scan('albums list');
  if (pub) {
    await page.goto(`${BASE}/albums/${pub.slug}`, { waitUntil: 'networkidle' }); await scan('public album');
    await page.locator('button[aria-label="Ajouter au panier"]').first().evaluate((el) => el.click());
    await page.waitForTimeout(500);
    await page.locator('.rq-fab').evaluate((el) => el.click());
    await page.locator('.rq-drawer[data-open="true"]').waitFor({ timeout: 8000 });
    await scan('cart drawer');
    check(`[${tag}] cart drawer shows request CTA, no legacy button`, (await page.locator('[data-testid="cta-request"]').count()) === 1 && (await page.locator('[data-testid="legacy-download"]').count()) === 0);
    await page.keyboard.press('Escape');
    await page.locator('section img').first().evaluate((el) => el.click()).catch(() => {});
    await page.waitForTimeout(500); await scan('lightbox');
    await clickAll('button:visible');
  }
  if (priv) {
    await page.goto(`${BASE}/mon-album`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="key"]').fill(priv.access_key);
    await page.locator('form.rq-keyform button[type="submit"]').click();
    await page.waitForURL(`**/albums/${priv.slug}`, { timeout: 20000 });
    await page.waitForLoadState('networkidle'); await scan('private album after key');
    await clickAll('main button:visible, section button:visible', 12);
    await page.waitForTimeout(800);
  }
  check(`[${tag}] zero download events after clicking buttons`, downloads === 0, `downloads=${downloads}`);
  await ctx.close();
}
await browser.close();
// cleanup: only rate_limits rows our key attempts may have written (v1.1 table)
await db.from('rate_limits').delete().like('key', 'albumkey:%');
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
