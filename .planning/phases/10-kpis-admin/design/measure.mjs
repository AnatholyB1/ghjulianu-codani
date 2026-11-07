import { chromium } from 'playwright';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const DIR = process.argv[2];
const pages = readdirSync(DIR).filter((f) => /^stats-.*\.html$/.test(f));
const shots = join(DIR, 'shots'); mkdirSync(shots, { recursive: true });
const VPS = [['mobile', { width: 390, height: 844 }, 2], ['desktop', { width: 1440, height: 900 }, 1]];
const browser = await chromium.launch();
const report = [];
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
for (const [vn, vp, dpr] of VPS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr });
  for (const f of pages) {
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(join(DIR, f)).href);
    await page.addStyleTag({ content: '*{animation:none!important}' });
    await page.screenshot({ path: join(shots, `${f.replace('.html', '')}-${vn}.png`), fullPage: true });
    const m = await page.evaluate(() => {
      const out = { overflowX: document.documentElement.scrollWidth - innerWidth, small: [], tap: [], contrast: [] };
      const parse = (s) => { const m = s.match(/[\d.]+/g).map(Number); return m; };
      const bgOf = (el) => { let e = el; const layers = []; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c.length === 3 || c[3] > 0) { layers.push(c); if (c.length === 3 || c[3] === 1) break; } e = e.parentElement; } let base = [10, 10, 10]; for (const l of layers.reverse()) { const a = l.length === 4 ? l[3] : 1; base = base.map((b, i) => Math.round(l[i] * a + b * (1 - a))); } return base; };
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (w.nextNode()) {
        const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
        if (el.closest('.sr-only') || el.closest('details:not([open]) > :not(summary)') ) continue;
        if (el.closest('svg')) continue;
        const fs = parseFloat(cs.fontSize);
        if (fs < 14 && !seen.has(el)) { seen.add(el); out.small.push(`${fs}px "${n.textContent.trim().slice(0, 30)}"`); }
        const fg = parse(cs.color), bg = bgOf(el);
        out.contrast.push([fg.slice(0, 3), bg, fs, cs.fontWeight, n.textContent.trim().slice(0, 24)]);
      }
      for (const el of document.querySelectorAll('a,button,summary,[role=button],input,[tabindex="0"]')) {
        if (el.closest('.sr-only')) continue; const r = el.getBoundingClientRect(); if (!r.width) continue;
        if (el.closest('details:not([open]) > :not(summary)')) continue;
        if (r.height < 43.5 || r.width < 43.5) out.tap.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} "${el.textContent.trim().slice(0, 20)}"`);
      }
      return out;
    });
    const bad = [];
    for (const [fg, bg, fs, fw, t] of m.contrast) { const a = lum(fg), b = lum(bg); const cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); const large = fs >= 24 || (fs >= 18.66 && +fw >= 700); if (cr < (large ? 3 : 4.5)) bad.push(`${cr.toFixed(2)} "${t}" fg=${fg} bg=${bg}`); }
    report.push({ page: f, vp: vn, overflowX: m.overflowX, smallText: [...new Set(m.small)], smallTap: [...new Set(m.tap)], lowContrast: [...new Set(bad)] });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
writeFileSync(join(DIR, 'measure-report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(`${r.vp.padEnd(7)} ${r.page.padEnd(28)} overflowX=${r.overflowX} small=${r.smallText.length} tap=${r.smallTap.length} contrast=${r.lowContrast.length}`);
