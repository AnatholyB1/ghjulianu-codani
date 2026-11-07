// Builds gallery.html from manifest.json (run after gen.mjs): node gallery.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(D, 'manifest.json'), 'utf8'));
const groups = [...new Set(manifest.map((m) => m.group))];
const card = (m, w, h, s, cap) => `<figure><div class="fr" style="width:${w * s}px;height:${h * s}px"><iframe loading="lazy" title="${m.group} ${cap}" src="${m.file}" width="${w}" height="${h}" style="transform:scale(${s})" tabindex="-1"></iframe></div><figcaption>${cap} <a href="${m.file}">open</a></figcaption></figure>`;
const mobileKeep = (m) => m.type === 'admin' || /ready \/ fr \/ night|confirmed \/ fr \/ day|expired \/ fr \/ night|invalid \/ fr \/ night|^fr \/ (light|dark)$/.test(m.label);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 9 gallery</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;padding:24px;background:#eceae6;color:#1a1a1a}h1{font-weight:500}h2{margin:40px 0 4px;font-weight:500}p.n{margin:0 0 12px;color:#555}
.row{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}figure{margin:0}.fr{overflow:hidden;border:1px solid #bbb;background:#fff}iframe{border:0;transform-origin:0 0}figcaption{font-size:14px;margin-top:4px}</style></head><body>
<h1>Phase 9 newsletter: design gallery</h1><p class="n">Live HTML in iframes (desktop 1440x900 scaled, mobile 390x844 scaled). Fonts load from Google Fonts, fallbacks Georgia and system-ui.</p>
${groups.map((g) => {
  const items = manifest.filter((m) => m.group === g);
  const em = items[0].type === 'email';
  return `<h2>${g}</h2><p class="n">${items.length} variants; mobile samples follow desktop</p><div class="row">${items.map((m) => card(m, em ? 700 : 1440, em ? 1000 : 900, em ? 0.4 : 0.3, m.label)).join('')}${items.filter(mobileKeep).map((m) => card(m, 390, 844, 0.5, m.label + ' (390px)')).join('')}</div>`;
}).join('')}</body></html>`;
writeFileSync(join(D, 'gallery.html'), html);
console.log('gallery ok');
