// Renders every screen with Playwright and measures overflow, min text size, tap targets, contrast.
// Usage: PW_DIR=<dir containing node_modules/playwright> node shoot.mjs   (PNGs go to ./shots, git-ignored)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(process.env.PW_DIR, 'package.json'));
const { chromium } = require('playwright');
mkdirSync(join(root, 'shots'), { recursive: true });

const VIEWS = { m: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, d: { width: 1440, height: 900, deviceScaleFactor: 1 } };
const measure = () => {
  const out = { overflow: document.documentElement.scrollWidth > window.innerWidth + 0.5, small: [], tap: [], contrast: [] };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (el) => { const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e); let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const e of chain.reverse()) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) bg = over(c, bg); } return bg; };
  const opacityOf = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode());) {
    if (!n.textContent.trim()) continue; const el = n.parentElement; if (seen.has(el)) continue; seen.add(el);
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || el.closest('.sr') || !el.getClientRects().length) continue;
    const px = parseFloat(cs.fontSize); if (px < 14) out.small.push({ t: label(el), px });
    const fg = parse(cs.color); fg.a *= opacityOf(el); const bg = bgOf(el); const c = over(fg, bg);
    const L1 = lum(c), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700); const need = large ? 3 : 4.5;
    if (ratio < need) out.contrast.push({ t: label(el), ratio: +ratio.toFixed(2), need });
  }
  for (const el of document.querySelectorAll('a[href],button')) {
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    if (r.width < 43.5 || r.height < 43.5) out.tap.push({ t: label(el), w: Math.round(r.width), h: Math.round(r.height) });
  }
  const ctl = [...document.querySelectorAll('a[href],button')].filter((e) => e.getBoundingClientRect().width);
  out.overlap = [];
  for (const el of ctl) { const a = el.getBoundingClientRect();
    for (const t of document.querySelectorAll('.tag,.chip,.n,p,h1,h2,dt,dd,.part-name,.part-info')) { if (el.contains(t) || t.contains(el)) continue; const b = t.getBoundingClientRect();
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 2 && h > 2) out.overlap.push({ ctl: label(el), text: label(t) }); } }
  return out;
};

const browser = await chromium.launch();
const files = readdirSync(join(root, 'screens')).filter((f) => f.endsWith('.html'));
const report = []; let bad = 0;
for (const [vk, vp] of Object.entries(VIEWS)) {
  const { width, height, ...rest } = vp; const ctx = await browser.newContext({ viewport: { width, height }, ...rest, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const f of files) for (const theme of ['night', 'day']) {
    await page.goto(pathToFileURL(join(root, 'screens', f)).href + (theme === 'day' ? '?theme=day' : ''), { waitUntil: 'load' });
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]));
    const m = await page.evaluate(measure);
    const name = `${f.replace('.html', '')}.${theme}.${vk}`;
    await page.screenshot({ path: join(root, 'shots', name + '.png'), fullPage: true });
    const issues = m.small.length + m.tap.length + m.contrast.length + m.overlap.length + (m.overflow ? 1 : 0);
    if (issues) { bad++; console.log('FAIL', name, JSON.stringify(m)); }
    report.push({ name, ...m });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(join(root, 'shots', 'report.json'), JSON.stringify(report, null, 1));
console.log(`${report.length} renders, ${bad} with issues`);
