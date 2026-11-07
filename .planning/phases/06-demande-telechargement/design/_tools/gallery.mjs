// Builds ../gallery.html (relative paths, live iframes, no PNG dependency) and ../MOCKUPS.md index.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const S = JSON.parse(readFileSync(join(root, '_tools', 'screens.json'), 'utf8'));
const groups = { a: 'A. Demande par email (tiroir panier / sélection)', b: 'B. Album privé : saisie de la clé (/mon-album)', c: 'C. Email transactionnel (600 px)' };
const ids = [...new Set(S.map(s => s.id))];
const by = (id, lang, theme) => S.find(s => s.id === id && s.lang === lang && s.theme === theme);
const themes = g => g === 'c' ? ['light', 'dark'] : ['night', 'day'];
let html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 6 maquettes</title>
<style>:root{color-scheme:light dark}body{font:16px/1.5 system-ui,sans-serif;margin:0;padding:24px;background:#f4f4f2;color:#1a1a1a}@media(prefers-color-scheme:dark){body{background:#111;color:#eee}a{color:#d8b988}}
h1{font-weight:500}h2{margin:40px 0 8px;font-weight:500}.row{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;margin:16px 0 32px;border-top:1px solid #8884;padding-top:16px}
.meta{width:220px}.meta code{font-size:14px}.f{display:flex;flex-direction:column;gap:6px;font-size:14px}.box{border:1px solid #8886;overflow:hidden}iframe{border:0;transform-origin:0 0;display:block}
.m{width:176px;height:380px}.m iframe{width:390px;height:844px;transform:scale(.45)}.e{width:270px;height:420px}.e iframe{width:600px;height:933px;transform:scale(.45)}
</style></head><body><h1>Phase 6, maquettes (prototypes statiques)</h1><p>Aperçus 390 px en direct. Cliquer un lien pour la page complète (redimensionner à 1440 pour la vue bureau). Les images sont des gabarits étiquetés par leur ratio.</p>`;
for (const g of ['a', 'b', 'c']) {
  html += `<h2>${groups[g]}</h2>`;
  for (const id of ids.filter(i => i.startsWith(g + '-'))) {
    const s0 = S.find(s => s.id === id);
    const [t1, t2] = themes(g); const cls = g === 'c' ? 'e' : 'm';
    const langs = [...new Set(S.filter(s => s.id === id).map(s => s.lang))];
    html += `<div class="row"><div class="meta"><b>${s0.label}</b><br><code>${id}</code><div class="f">`;
    for (const l of langs) for (const t of [t1, t2]) { const s = by(id, l, t); html += `<a href="screens/${s.file}">${l.toUpperCase()} ${t}</a>`; }
    html += `</div></div>`;
    for (const t of [t1, t2]) { const s = by(id, 'fr', t); html += `<div class="f"><span>FR ${t}</span><div class="box ${cls}"><iframe loading="lazy" src="screens/${s.file}" title="${id} ${t}"></iframe></div></div>`; }
    html += `</div>`;
  }
}
html += `</body></html>`;
writeFileSync(join(root, 'gallery.html'), html);

let md = `# Index des maquettes, phase 6\n\nGénéré par \`_tools/gallery.mjs\`. Ouvrir \`gallery.html\` (chemins relatifs). Les PNG sont régénérables (\`_tools/measure.mjs\`) et ne sont pas versionnés.\n\n- Tokens : \`tokens.css\` (tokens réels du site + ajouts marqués NEW). Composants : \`app.css\`. Générateur : \`_tools/build.mjs\`.\n- Rendus : 390x844 @2x (mobile, tiroir plein écran) et 1440x900 (tiroir 440 px sur page grisée), thèmes nuit et jour, FR (EN pour les états les plus longs).\n- Mesures : \`_tools/measure.mjs\` écrit \`_tools/measure-report.json\` (voir 06-DESIGN-CONTRACT.md section 9).\n\n`;
for (const g of ['a', 'b', 'c']) {
  md += `## ${groups[g]}\n\n| Écran | Fichiers |\n|---|---|\n`;
  for (const id of ids.filter(i => i.startsWith(g + '-'))) {
    const s0 = S.find(s => s.id === id);
    const files = S.filter(s => s.id === id).map(s => `[${s.lang} ${s.theme}](screens/${s.file})`).join(' · ');
    md += `| ${s0.label} (\`${id}\`) | ${files} |\n`;
  }
  md += '\n';
}
writeFileSync(join(root, 'MOCKUPS.md'), md);
console.log('gallery + index', ids.length, 'screens');
