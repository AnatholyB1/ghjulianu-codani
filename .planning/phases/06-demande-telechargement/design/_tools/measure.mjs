// Renders every screen at 390x844@2x and 1440x900@1, saves PNGs to ../png (git-ignored) and measures
// overflow, min font size, tap targets, text and border contrast.
// Run: PW_DIR=<dir with node_modules/playwright> node _tools/measure.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(process.env.PW_DIR, 'x.js'));
const { chromium } = require('playwright');
const screens = JSON.parse(readFileSync(join(root, '_tools', 'screens.json'), 'utf8'));
mkdirSync(join(root, 'png'), { recursive: true });
const VPS = [{ n: 'm', width: 390, height: 844, dpr: 2 }, { n: 'd', width: 1440, height: 900, dpr: 1 }];

function inPage() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (f, b) => { const a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hidden = el => { for (let e = el; e; e = e.parentElement) { if (e.getAttribute && e.getAttribute('aria-hidden') === 'true') return true; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return true; } return false; };
  const bgOf = el => { const layers = []; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none' && e.classList.contains('ph')) { layers.push(rgba(getComputedStyle(document.documentElement).getPropertyValue('--ph-a').trim())); break; } const c = rgba(s.backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let base = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base); return base; };
  const issues = [], stats = { text: 0, taps: 0, minFont: 99, minContrast: 99, minBorder: 99 };
  const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
  if (sw > iw + 1) issues.push(`overflow-x ${sw}>${iw}`);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = w.nextNode());) {
    if (!n.textContent.trim()) continue; const el = n.parentElement; if (seen.has(el) || hidden(el) || el.closest('.sr,.pre,head,script,style')) continue; seen.add(el);
    const s = getComputedStyle(el), fs = parseFloat(s.fontSize); stats.text++; stats.minFont = Math.min(stats.minFont, fs);
    if (fs < 13.99) issues.push(`font ${fs}px "${n.textContent.trim().slice(0, 24)}"`);
    const bg = bgOf(el), fg = over(rgba(s.color), bg), r = cr(fg, bg), bold = parseInt(s.fontWeight) >= 700;
    const need = (fs >= 24 || (fs >= 18.66 && bold)) ? 3 : 4.5; stats.minContrast = Math.min(stats.minContrast, r);
    if (r < need) issues.push(`contrast ${r.toFixed(2)}<${need} "${n.textContent.trim().slice(0, 24)}"`);
  }
  for (const el of document.querySelectorAll('button,a[href],input:not([type=hidden]),label.check')) {
    if (hidden(el) || el.closest('.hp')) continue;
    const inline = el.tagName === 'A' && el.closest('p,li,.foot,.note,.msg'); if (inline) continue;
    const r = el.getBoundingClientRect(); stats.taps++;
    if (el.matches('input[type=checkbox]')) { const l = el.closest('label'); const lr = l.getBoundingClientRect(); if (lr.height < 43.5) issues.push(`tap checkbox label ${lr.height}`); continue; }
    if (r.height < 43.5 || r.width < 43.5) issues.push(`tap ${Math.round(r.width)}x${Math.round(r.height)} <${el.tagName.toLowerCase()}> "${(el.textContent || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 20)}"`);
  }
  // non-text contrast: field borders vs panel
  for (const el of document.querySelectorAll('.input,.check input')) { if (hidden(el) || el.closest('.hp')) continue; const s = getComputedStyle(el); if (el.getAttribute('aria-invalid') === 'true') continue; const bc = rgba(s.borderTopColor); const bg = bgOf(el.parentElement); const r = cr(over(bc, bg), bg); stats.minBorder = Math.min(stats.minBorder, r); if (r < 3) issues.push(`border contrast ${r.toFixed(2)}<3 ${el.className || el.type}`); }
  // placeholder contrast
  for (const el of document.querySelectorAll('input[placeholder]')) { if (hidden(el)) continue; const s = getComputedStyle(el, '::placeholder'); const bg = bgOf(el); const fg = over(rgba(s.color), over(rgba(getComputedStyle(el).backgroundColor), bg)); const op = parseFloat(s.opacity || '1'); const f2 = over([fg[0], fg[1], fg[2], op], over(rgba(getComputedStyle(el).backgroundColor), bg)); const r = cr(f2, over(rgba(getComputedStyle(el).backgroundColor), bg)); if (r < 4.5) issues.push(`placeholder contrast ${r.toFixed(2)}`); stats.minContrast = Math.min(stats.minContrast, r); }
  return { issues, stats };
}

const browser = await chromium.launch();
const rows = []; let fail = 0;
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const s of screens) {
    await page.goto(pathToFileURL(join(root, 'screens', s.file)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await page.waitForTimeout(80);
    const png = `${s.file.replace('.html', '')}.${vp.n}.png`;
    await page.screenshot({ path: join(root, 'png', png), fullPage: false });
    const r = await page.evaluate(inPage);
    rows.push({ file: s.file, vp: vp.n, ...r.stats, issues: r.issues }); if (r.issues.length) fail++;
  }
  await ctx.close();
}
await browser.close();
writeFileSync(join(root, '_tools', 'measure-report.json'), JSON.stringify(rows, null, 1));
const bad = rows.filter(r => r.issues.length);
const mf = Math.min(...rows.map(r => r.minFont)), mc = Math.min(...rows.map(r => r.minContrast)), mb = Math.min(...rows.map(r => r.minBorder));
console.log(`${rows.length} renders, ${bad.length} with issues; min font ${mf}px, min text contrast ${mc.toFixed(2)}, min border contrast ${mb.toFixed(2)}`);
for (const r of bad) console.log(r.file, r.vp, r.issues.join(' | '));
