#!/usr/bin/env node
/**
 * PRT-02 e2e: image protection (deterrent) must block save gestures on public
 * images WITHOUT breaking inputs, carousels, or the lightbox.
 *
 * Usage:
 *   npm run build && npx next start -p 3104        # in another shell
 *   node scripts/e2e-image-protection.mjs          # BASE_URL defaults to http://localhost:3104
 *
 * Playwright is NOT a repo dependency. Provide it via:
 *   PLAYWRIGHT_DIR=/path/to/dir/with/node_modules/playwright  (or have it resolvable)
 * Uses live data (portfolio photos / albums from the configured Supabase); no fixtures.
 *
 * Runs Chromium with 3 profiles: desktop 1440x900, iPhone 14 and Pixel 7 descriptors
 * (touch + mobile UA/viewport). This is EMULATION; real iOS long-press is NOT proven.
 */
import { createRequire } from 'node:module';

const BASE = process.env.BASE_URL ?? 'http://localhost:3104';
const require = createRequire(
  (process.env.PLAYWRIGHT_DIR ? process.env.PLAYWRIGHT_DIR.replace(/[\\/]+$/, '') + '/' : process.cwd() + '/') + 'x.js',
);
let pw;
try { pw = require('playwright'); } catch { pw = require('playwright-core'); }
const { chromium, devices } = pw;

const results = [];
const check = (profile, name, ok, extra = '') => {
  results.push({ profile, name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${profile}] ${name}${extra ? '  ' + extra : ''}`);
};

/* Dispatch a cancelable event at the centre of the first matching element and
   report whether a handler called preventDefault(). */
const probe = (page, selector, kind) => page.evaluate(({ selector, kind }) => {
  const el = document.querySelector(selector);
  if (!el) return 'missing';
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  // Hit-test like a real pointer would: the topmost element at the point.
  // dragstart fires on the dragged <img> itself; contextmenu fires on whatever is on top.
  const target = kind === 'dragstart' ? el : (document.elementFromPoint(x, y) ?? el);
  const ev = kind === 'dragstart'
    ? new DragEvent('dragstart', { bubbles: true, cancelable: true, clientX: x, clientY: y })
    : new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 });
  target.dispatchEvent(ev);
  return ev.defaultPrevented;
}, { selector, kind });

async function touchDrag(page, x0, y, dx) {
  const cdp = await page.context().newCDPSession(page);
  const pt = (x) => [{ x, y }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0) });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + (dx * i) / 12) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function runProfile(browser, label, ctxOptions, touch) {
  const ctx = await browser.newContext({ ...ctxOptions, permissions: ['clipboard-read', 'clipboard-write'] });
  // Skip the first-visit welcome modal (it overlays the whole page).
  await ctx.addInitScript(() => { try { localStorage.setItem('ghjulianu-portfolio-welcomed', '1'); } catch {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  /* 1. portfolio: contextmenu + dragstart blocked on images, lightbox opens */
  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' });
  const hasProtectAttr = await page.evaluate(() => document.documentElement.getAttribute('data-img-protect'));
  check(label, 'html[data-img-protect=on] on public page', hasProtectAttr === 'on');

  const imgSel = 'main img, img';
  try { await page.waitForSelector(imgSel, { state: 'attached', timeout: 15000 }); } catch {}
  const imgCount = await page.locator(imgSel).count();
  check(label, 'portfolio has images (live data)', imgCount > 0, `count=${imgCount}`);

  // pick a visible portfolio grid image (skip logos/icons: require size > 80px)
  const bigImg = await page.evaluateHandle(() =>
    [...document.querySelectorAll('img')].find((i) => { const r = i.getBoundingClientRect(); return r.width > 80 && r.height > 80; }) ?? null);
  const hasBig = await bigImg.evaluate((n) => !!n);
  if (hasBig) {
    await bigImg.evaluate((n) => { n.setAttribute('data-e2e', 'target'); n.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(900); // reveal transition
    const cm = await probe(page, 'img[data-e2e="target"]', 'contextmenu');
    check(label, 'contextmenu on image is prevented', cm === true, `got=${cm}`);
    const ds = await probe(page, 'img[data-e2e="target"]', 'dragstart');
    check(label, 'dragstart on image is prevented', ds === true, `got=${ds}`);

    const us = await bigImg.evaluate((n) => getComputedStyle(n).userSelect);
    check(label, 'img user-select:none via CSS', us === 'none', `got=${us}`);
    // Chromium drops the unknown `-webkit-touch-callout` from the CSSOM (it is iOS-only),
    // so check the shipped stylesheet text instead.
    const hasCallout = await page.evaluate(async () => {
      const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
      for (const h of hrefs) { if ((await (await fetch(h)).text()).includes('-webkit-touch-callout')) return true; }
      return false;
    });
    check(label, '-webkit-touch-callout rule shipped in CSS', hasCallout);

    if (!touch) {
      // real mouse right-click: observe defaultPrevented from a late bubble listener
      await page.evaluate(() => { window.__cmPrevented = null; window.addEventListener('contextmenu', (e) => { window.__cmPrevented = e.defaultPrevented; }); });
      const box = await bigImg.evaluate((n) => { const r = n.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.click(box.x, box.y, { button: 'right' });
      const real = await page.evaluate(() => window.__cmPrevented);
      check(label, 'REAL right-click on image: contextmenu defaultPrevented', real === true, `got=${real}`);
    }

    /* lightbox opens on tap/click and navigation still works */
    const lbBox = await bigImg.evaluate((n) => { const r = n.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    if (touch) await page.touchscreen.tap(lbBox.x, lbBox.y); else await page.mouse.click(lbBox.x, lbBox.y);
    const close = page.getByLabel('Fermer', { exact: true });
    let opened = false;
    try { await close.waitFor({ state: 'visible', timeout: 5000 }); opened = true; } catch {}
    check(label, 'lightbox opens on tap/click of image', opened);
    if (opened) {
      const lbImg = await page.evaluate(() => document.querySelector('[aria-label="Fermer"]') ? 'ok' : 'no');
      const next = page.getByLabel('Photo suivante');
      if (await next.count()) {
        const before = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.currentSrc).join('|'));
        if (touch) await next.tap(); else await next.click();
        await page.waitForTimeout(500);
        const after = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.currentSrc).join('|'));
        check(label, 'lightbox next button still navigates', before !== after || imgCount === 1, lbImg);
      }
      // contextmenu on the lightbox image must be prevented too
      const lbCm = await page.evaluate(() => {
        const imgs = [...document.querySelectorAll('img')].filter((i) => { const r = i.getBoundingClientRect(); return r.width > 150 && r.height > 150 && r.top >= 0; });
        const img = imgs[imgs.length - 1]; if (!img) return 'missing';
        const r = img.getBoundingClientRect();
        const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
        (document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) ?? img).dispatchEvent(ev);
        return ev.defaultPrevented;
      });
      check(label, 'contextmenu in lightbox prevented', lbCm === true, `got=${lbCm}`);
      await close.click();
    }
  }

  /* 2. albums drag carousel still drags (and tap/click still navigates) */
  await page.goto(`${BASE}/albums`, { waitUntil: 'networkidle' });
  try { await page.waitForSelector('img.image', { timeout: 15000 }); } catch {}
  const track = page.locator('[data-percentage]').first();
  if (await track.count()) {
    const tb = await track.evaluate((n) => { const p = n.parentElement.getBoundingClientRect(); return { y: p.top + p.height / 2, w: p.width }; });
    const x0 = Math.round(tb.w * 0.7), dx = -Math.round(tb.w * 0.4);
    if (touch) {
      await touchDrag(page, x0, tb.y, dx);
    } else {
      await page.mouse.move(x0, tb.y);
      await page.mouse.down();
      await page.mouse.move(x0 + dx, tb.y, { steps: 15 });
      await page.mouse.up();
    }
    const pct = parseFloat(await track.getAttribute('data-percentage'));
    check(label, 'albums carousel drag moves track', Number.isFinite(pct) && pct < 0, `percentage=${pct}`);
    const cover = await probe(page, 'img.image', 'contextmenu');
    check(label, 'contextmenu on album cover prevented (pointer-events:none img)', cover === true, `got=${cover}`);
  } else {
    check(label, 'albums track present', false, 'no [data-percentage] (no albums in live data?)');
  }

  /* 3. inputs untouched: contextmenu not prevented + paste works */
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
  const nameInput = page.locator('input[name="name"]');
  const inCm = await page.evaluate(() => {
    const el = document.querySelector('input[name="name"]');
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    el.dispatchEvent(ev); return ev.defaultPrevented;
  });
  check(label, 'contextmenu on <input> NOT prevented', inCm === false, `got=${inCm}`);
  const taCm = await page.evaluate(() => {
    const el = document.querySelector('textarea');
    if (!el) return 'missing';
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    el.dispatchEvent(ev); return ev.defaultPrevented;
  });
  check(label, 'contextmenu on <textarea> NOT prevented', taCm === false, `got=${taCm}`);
  if (!touch) {
    await page.evaluate(() => navigator.clipboard.writeText('pasted-ok'));
    await nameInput.click();
    await page.keyboard.press('Control+V');
    check(label, 'paste into input works', (await nameInput.inputValue()) === 'pasted-ok');
  } else {
    await nameInput.fill('typed-ok');
    check(label, 'typing into input works', (await nameInput.inputValue()) === 'typed-ok');
  }

  /* 4. admin routes are not protected */
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
  const adminAttr = await page.evaluate(() => document.documentElement.getAttribute('data-img-protect'));
  check(label, 'no data-img-protect on /admin/**', adminAttr === null, `got=${adminAttr}`);
  const adminCm = await page.evaluate(() => {
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(ev); return ev.defaultPrevented;
  });
  check(label, 'admin contextmenu not prevented', adminCm === false, `got=${adminCm}`);

  check(label, 'no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

const browser = await chromium.launch();
try {
  await runProfile(browser, 'desktop-1440x900', { viewport: { width: 1440, height: 900 } }, false);
  for (const [label, name] of [['iPhone14', 'iPhone 14'], ['Pixel7', 'Pixel 7']]) {
    const desc = { ...devices[name] };
    delete desc.defaultBrowserType; // emulate on Chromium regardless of the descriptor's engine
    await runProfile(browser, `${label}(chromium-emulated)`, desc, true);
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
