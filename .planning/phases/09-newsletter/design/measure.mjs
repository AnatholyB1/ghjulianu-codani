// Screenshots + automated checks. Usage: PW=<abs path to node_modules/playwright> node measure.mjs
// Checks per page and viewport: horizontal overflow, text < 14px, tap target < 44px, contrast (WCAG AA).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW);
const manifest = JSON.parse(readFileSync(join(D, 'manifest.json'), 'utf8'));
mkdirSync(join(D, '_png'), { recursive: true });
const VPS = [
  { n: 'm', width: 390, height: 844, dpr: 2 },
  { n: 'd', width: 1440, height: 900, dpr: 1 },
];

const inPage = () => {
  const out = { overflow: null, small: [], tap: [], contrast: [] };
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) out.overflow = de.scrollWidth + ' > ' + de.clientWidth;
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = (el) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = chain.length - 1; i >= 0; i--) { const c = parse(getComputedStyle(chain[i]).backgroundColor); if (c && c.a > 0) base = over(c, base); }
    return base;
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
  const label = (el) => (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) ;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode()); ) {
    const t = n.textContent.trim(); const el = n.parentElement;
    if (!t || !el || el.closest('style,script,title') || !visible(el) || el.closest('.pre')) continue;
    const s = getComputedStyle(el); const fs = parseFloat(s.fontSize);
    if (fs < 13.99) out.small.push(`${label(el)} ${fs}px "${t.slice(0, 24)}"`);
    if (el.closest('[disabled]')) continue;
    const fg = parse(s.color); const bg = bgOf(el); const f = over(fg, bg);
    const [a, b] = [lum(f), lum(bg)]; const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const large = fs >= 24 || (fs >= 18.66 && parseInt(s.fontWeight) >= 700);
    const need = large ? 3 : 4.5; const key = label(el) + s.color + ratio.toFixed(2);
    if (ratio < need && !seen.has(key)) { seen.add(key); out.contrast.push(`${label(el)} ${ratio.toFixed(2)}:1 (<${need}) "${t.slice(0, 20)}"`); }
  }
  for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button]')) {
    if (!visible(el) || el.closest('.sr-only')) continue;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && el.closest('p,li') && !/btn|unsub|link/.test(el.className);
    if (inline) continue;
    if (r.height < 43.5 || r.width < 43.5) out.tap.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return out;
};

const browser = await chromium.launch();
const results = [];
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr });
  const page = await ctx.newPage();
  for (const m of manifest) {
    await page.goto(pathToFileURL(join(D, m.file)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await page.waitForTimeout(700);
    const r = await page.evaluate(inPage);
    await page.screenshot({ path: join(D, '_png', m.file.replace(/[\\/]/g, '__').replace('.html', `.${vp.n}.png`)), fullPage: true });
    results.push({ file: m.file, vp: vp.n, ...r });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(join(D, 'measurements.json'), JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.overflow || r.small.length || r.tap.length || r.contrast.length);
console.log(`${results.length} runs, ${bad.length} with findings`);
for (const r of bad.slice(0, 40)) console.log(r.file, r.vp, r.overflow || '', r.small.slice(0, 2), r.tap.slice(0, 3), r.contrast.slice(0, 3));
