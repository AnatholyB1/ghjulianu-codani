// Generates the static /admin/stats prototypes (node build.mjs). SAMPLE DATA ONLY.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = dirname(fileURLToPath(import.meta.url));
const fr = (n, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, ' ');
const pct = (a, b) => fr((a / b) * 100, 1) + ' %';
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const END = new Date(Date.UTC(2026, 10, 6)); // 6 nov 2026 = yesterday, last complete Paris day
const dAt = (off) => new Date(END.getTime() - off * 864e5);
const dl = (d, y) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${y ? ' ' + d.getUTCFullYear() : ''}`;
const dls = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
const PERIODS = {
  7:  { d: { views: 8, dl: 12, req: -4, sig: 25, subs: 3, bw: 10 } },
  30: { d: { views: 12, dl: 8, req: -3, sig: 21, subs: 14, bw: 9 } },
  90: { d: { views: 19, dl: 15, req: 6, sig: 33, subs: 31, bw: 18 } },
};
const THUMBS = ['#3a3328,#1d1a15', '#2b3340,#14181f', '#40322b,#1f1814', '#2a3a33,#141d19', '#3a2b3d,#1b141d', '#35352b,#1a1a14'];
const thumb = (i) => `<span class="thumb" aria-hidden="true" style="background:linear-gradient(135deg,${THUMBS[i % 6].split(',')[0]},${THUMBS[i % 6].split(',')[1]})"></span>`;

const head = (title, extra = '') => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="stats.css">${extra}</head><body>`;
const chrome = `<header class="top"><div class="top-left"><div class="top-row"><span class="brand">Admin</span>
<div class="top-actions"><a class="btn-ghost hide-sm" href="#">Voir le site ↗</a><button class="btn-ghost">Déconnexion</button></div></div>
<nav class="nav" aria-label="Administration"><a href="#">Dashboard</a><a href="#">Albums</a><a href="#">Portfolio</a><a href="#">Catégories</a><a href="#">Newsletter</a><a href="#" aria-current="page">Stats</a></nav></div></header>`;

function periodBar(p, disabled = false) {
  const days = p, cur0 = dAt(days - 1), cur1 = dAt(0), prev0 = dAt(2 * days - 1), prev1 = dAt(days);
  const link = (n) => `<a href="?p=${n}" ${p === n ? 'aria-current="true"' : ''} ${disabled ? 'aria-disabled="true"' : ''}>${n}&nbsp;jours</a>`;
  return `<div class="period"><nav class="seg" aria-label="Période d’analyse">${link(7)}${link(30)}${link(90)}</nav>
<p class="range"><span class="sr-only">Période affichée : </span>${dl(cur0)} – ${dl(cur1, true)} <span aria-hidden="true">·</span> comparée au ${dl(prev0)} – ${dl(prev1, true)}</p></div>`;
}
const pageHead = (p, disabled) => `<div class="page-head"><div><p class="eyebrow">Statistiques</p><h1>Suivi des téléchargements</h1></div>${periodBar(p, disabled)}</div>`;
const sampleBanner = `<div class="sample" role="note"><strong>Données d’exemple</strong><span>Valeurs fictives pour la maquette. Elles ne reflètent aucune activité réelle.</span></div>`;

// ---- series
function series(n, base, amp, seedShift) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = dAt(n - 1 - i), wk = [0, 6].includes(d.getUTCDay()) ? 1.25 : 1;
    const trend = 1 + (i / n) * 0.25;
    out.push(Math.max(0, Math.round(base * wk * trend * (1 + amp * Math.sin(i / 2.6 + seedShift) + (rnd() - 0.5) * 0.35))));
  }
  return out;
}
function linePath(vals, max, w = 300, h = 100, area = false) {
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - (v / max) * h]);
  const l = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  return area ? l + `L${w} ${h}L0 ${h}Z` : l;
}
const niceMax = (m) => { const s = [10, 20, 40, 50, 100, 200, 250, 400, 500, 1000, 2000]; return s.find((x) => x >= m * 1.05) || Math.ceil(m * 1.1); };
function chartPanel({ title, vals, color, total, label, cssId }) {
  const max = niceMax(Math.max(...vals)), n = vals.length;
  const ticks = [max, max / 2, 0];
  const y = ticks.map((t, i) => `<span style="top:${i * 50}%">${fr(t)}</span>`).join('');
  const grid = [0, 50, 100].map((g) => `<line x1="0" x2="300" y1="${g}" y2="${g}" stroke="rgba(255,255,255,.08)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('');
  const lastTop = 100 - (vals[n - 1] / max) * 100;
  const xs = [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1].map((i) => dls(dAt(n - 1 - i)));
  return `<div class="panel"><div class="panel-title"><b>${title}</b><span class="sub num">${total}</span></div>
<div class="yaxis" aria-hidden="true">${y}</div>
<div class="plot"><svg viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-labelledby="${cssId}-t"><title id="${cssId}-t">${label}</title>${grid}
<path d="${linePath(vals, max, 300, 100, true)}" fill="${color}" fill-opacity=".14"/>
<path d="${linePath(vals, max)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
<span class="end" style="left:100%;top:${lastTop}%;background:${color}"></span></div>
<div class="xaxis" aria-hidden="true">${xs.map((x) => `<span>${x}</span>`).join('')}</div></div>`;
}
const dataTable = (cols, rows, cap, open) => `<details class="data"${open ? ' open' : ''}><summary>Voir les données (tableau)</summary><div class="tbl-wrap" tabindex="0" role="region" aria-label="${cap}"><table><caption>${cap}</caption><thead><tr>${cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;

function deltaHtml(d, invertGood = false, p = 30) {
  if (d === null) return `<span class="delta flat"><span aria-hidden="true">–</span><span>Pas de comparaison</span></span>`;
  const cls = d === 0 ? 'flat' : d > 0 ? 'up' : 'down';
  const arrow = d === 0 ? '▬' : d > 0 ? '▲' : '▼';
  const word = d === 0 ? 'stable' : d > 0 ? 'en hausse' : 'en baisse';
  return `<span class="delta ${cls}"><span aria-hidden="true">${arrow}</span><span>${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)} %</span><span class="vs">vs ${p} j préc.</span><span class="sr-only">, ${word} par rapport à la période précédente</span></span>`;
}

function content(p, { openTables = false } = {}) {
  seed = 11 + p;
  const n = p;
  const views = series(n, 140, 0.3, 0), dls_ = series(n, 6.2, 0.45, 1.3);
  const V = views.reduce((a, b) => a + b, 0), D = dls_.reduce((a, b) => a + b, 0);
  const R = Math.round(D * 1.31), L = Math.round(R * 0.82), DR = Math.round(L * 0.864);
  const VIS = Math.round(V * 0.55), SIG = Math.round(R * 0.237), SIGC = Math.round(SIG * 0.72);
  const subs = 412, subNew = Math.round(SIGC * (p === 7 ? 1 : 1)), subUnsub = Math.max(1, Math.round(subNew * 0.12));
  const BW = D * 0.0182; // Go, ~18 Mo average
  const dd = PERIODS[p].d;
  const tile = (label, value, delta, hint, extra = '') => `<div class="kpi" role="group" aria-label="${label}"><span class="label">${label}</span><span class="value num">${value}</span>${delta}${hint ? `<span class="hint">${hint}</span>` : ''}${extra}</div>`;
  const tiles = [
    tile('Téléchargements', fr(D), deltaHtml(dd.dl, false, p), 'fichiers servis'),
    tile('Vues', fr(V), deltaHtml(dd.views, false, p), `${fr(VIS)} visiteurs-jours (uniques par jour)`),
    tile('Demandes', fr(R), deltaHtml(dd.req, false, p), 'liens envoyés par email'),
    tile('Inscriptions newsletter', fr(SIG), deltaHtml(dd.sig, false, p), `${pct(SIG, R)} des demandes · ${fr(SIGC)} confirmées`),
    tile('Abonnés', fr(subs), deltaHtml(dd.subs, false, p), `+${fr(subNew)} / −${fr(subUnsub)} sur la période`),
    tile('Bande passante estimée', `${fr(BW, 1)}<small>Go</small>`, deltaHtml(dd.bw, false, p), 'téléchargements uniquement'),
  ].join('');

  const chart = `<section class="card sec" aria-labelledby="h-ts"><div class="card-head"><h2 id="h-ts">Vues et téléchargements par jour</h2>
<ul class="legend" aria-label="Légende"><li><span class="sw line" style="background:var(--c-views)"></span>Vues</li><li><span class="sw line" style="background:var(--c-downloads)"></span>Téléchargements</li></ul></div>
${chartPanel({ title: 'Vues', vals: views, color: 'var(--c-views)', total: `${fr(V)} au total`, label: `Courbe des vues par jour, ${fr(V)} au total sur ${p} jours`, cssId: 'cv' })}
${chartPanel({ title: 'Téléchargements', vals: dls_, color: 'var(--c-downloads)', total: `${fr(D)} au total`, label: `Courbe des téléchargements par jour, ${fr(D)} au total sur ${p} jours`, cssId: 'cd' })}
<p class="note">Deux échelles distinctes : les vues sont environ vingt fois plus nombreuses que les téléchargements. Jours calculés en heure de Paris.</p>
${dataTable(['Jour', 'Vues', 'Téléchargements'], views.map((v, i) => [dl(dAt(n - 1 - i)), fr(v), fr(dls_[i])]).reverse(), `Vues et téléchargements par jour, ${p} derniers jours`, openTables)}</section>`;

  const fs = [['Visiteurs-jours ayant vu une photo', VIS, null], ['Demandes de téléchargement', R, VIS], ['Liens ouverts', L, R], ['Téléchargés', DR, L]];
  const fshade = ['#8fbcf0', '#5f9de8', '#3987e5', '#2a67b4'];
  const funnel = `<section class="card sec" aria-labelledby="h-fn"><div class="card-head"><h2 id="h-fn">Tunnel de téléchargement</h2><span class="sub">Conversion globale ${pct(DR, VIS)}</span></div>
<ol class="funnel">${fs.map((s, i) => `${i ? `<li class="conv" aria-hidden="false"><span><b>${pct(s[1], s[2])}</b> passent à l’étape suivante</span></li>` : ''}<li class="step"><span class="name">${i + 1}. ${s[0]}</span><span class="n">${fr(s[1])}</span><span class="bar" role="presentation"><i style="width:${(s[1] / VIS) * 100}%;background:${fshade[i]}"></i></span></li>`).join('')}</ol>
${dataTable(['Étape', 'Effectif', 'Conversion depuis l’étape précédente'], fs.map((s) => [s[0], fr(s[1]), s[2] ? pct(s[1], s[2]) : '–']), 'Tunnel de téléchargement', openTables)}</section>`;

  const favs = [['IMG_2041', 'Calanques de Piana', 42], ['DSC_0873', 'Nuit sur Paris', 37], ['IMG_1120', 'Corse — Lumière d’été', 31], ['DSC_0412', 'Portraits studio', 24], ['IMG_3305', 'Mariage Léa & Hugo', 19]].map((r) => [r[0], r[1], Math.round(r[2] * p / 30 + 1)]);
  const dwn = [['DSC_0873', 'Nuit sur Paris', 29], ['IMG_2041', 'Calanques de Piana', 26], ['IMG_3305', 'Mariage Léa & Hugo', 22], ['IMG_1120', 'Corse — Lumière d’été', 14], ['DSC_0412', 'Portraits studio', 9]].map((r) => [r[0], r[1], Math.round(r[2] * p / 30 + 1)]);
  const rank = (rows, color, unit) => { const m = Math.max(...rows.map((r) => r[2])); return `<ol class="rank">${rows.map((r, i) => `<li><span class="pos">${i + 1}</span>${thumb(i + (color === 'var(--c-downloads)' ? 2 : 0))}<span class="meta"><span class="t">${r[0]}</span><span class="s">${r[1]}</span><span class="meter" role="presentation"><i style="width:${(r[2] / m) * 100}%;background:${color}"></i></span></span><span class="cnt">${fr(r[2])}<small>${unit}</small></span></li>`).join('')}</ol>`; };
  const photos = `<div class="two sec"><section class="card" aria-labelledby="h-fav"><div class="card-head"><h2 id="h-fav">Photos préférées</h2><span class="sub">Ajouts à la sélection</span></div>${rank(favs, 'var(--accent)', 'ajouts')}${dataTable(['Photo', 'Album', 'Ajouts'], favs.map((r) => [r[0], r[1], fr(r[2])]), 'Photos les plus ajoutées à la sélection', openTables)}</section>
<section class="card" aria-labelledby="h-dl"><div class="card-head"><h2 id="h-dl">Plus téléchargées</h2><span class="sub">Fichiers servis</span></div>${rank(dwn, 'var(--c-downloads)', 'téléch.')}${dataTable(['Photo', 'Album', 'Téléchargements'], dwn.map((r) => [r[0], r[1], fr(r[2])]), 'Photos les plus téléchargées', openTables)}</section></div>`;

  const albums = [['Corse — Lumière d’été', 0, 812, 61], ['Mariage Léa & Hugo', 1, 604, 88], ['Nuit sur Paris', 0, 533, 47], ['Calanques de Piana', 0, 391, 26], ['Portraits studio', 1, 214, 9]].map((a) => [a[0], a[1], Math.round(a[2] * p / 30), Math.round(a[3] * p / 30)]);
  const am = Math.max(...albums.map((a) => a[2]));
  const albumCard = `<section class="card sec" aria-labelledby="h-al"><div class="card-head"><h2 id="h-al">Albums les plus consultés</h2><span class="sub">Vues · téléchargements</span></div>
<ol class="rank albums">${albums.map((a, i) => `<li><span class="pos">${i + 1}</span><span class="meta"><span class="t">${a[0]}${a[1] ? '<span class="badge">Privé</span>' : ''}</span><span class="meter" role="presentation"><i style="width:${(a[2] / am) * 100}%;background:var(--c-views)"></i></span></span><span class="cnt">${fr(a[2])}<small>vues</small></span><span class="cnt">${fr(a[3])}<small>téléch.</small></span></li>`).join('')}</ol>
${dataTable(['Album', 'Accès', 'Vues', 'Téléchargements'], albums.map((a) => [a[0], a[1] ? 'Privé' : 'Public', fr(a[2]), fr(a[3])]), 'Albums les plus consultés', openTables)}</section>`;

  const dayN = Math.round(V * 0.62), nightN = V - dayN;
  const dn = `<section class="card" aria-labelledby="h-dn"><div class="card-head"><h2 id="h-dn">Jour / nuit</h2><span class="sub">Mode du site à la vue</span></div>
<div class="stack" role="img" aria-label="Jour ${pct(dayN, V)}, nuit ${pct(nightN, V)}"><i style="width:62%;background:var(--c-day)"></i><i style="width:38%;background:var(--c-night)"></i></div>
<ul class="split-list"><li><span class="sw" style="background:var(--c-day)"></span><span class="k">☀ Jour</span><span class="p">${pct(dayN, V)}</span><span class="c">${fr(dayN)}</span></li><li><span class="sw" style="background:var(--c-night)"></span><span class="k">☾ Nuit</span><span class="p">${pct(nightN, V)}</span><span class="c">${fr(nightN)}</span></li></ul>
<p class="note">Le visiteur choisit le mode ; ce n’est pas l’heure de la vue.</p></section>`;
  const dv = [['Mobile', 0.58, 'var(--c-aqua)', ''], ['Ordinateur', 0.36, 'var(--c-downloads)', 'tex-stripe'], ['Tablette', 0.06, 'var(--c-views)', 'tex-dot']];
  const dev = `<section class="card" aria-labelledby="h-dv"><div class="card-head"><h2 id="h-dv">Appareils</h2><span class="sub">Classe d’appareil</span></div>
<div class="stack" role="img" aria-label="${dv.map((d) => `${d[0]} ${fr(d[1] * 100)} %`).join(', ')}">${dv.map((d) => `<i class="${d[3]}" style="width:${d[1] * 100}%;background:${d[2]}"></i>`).join('')}</div>
<ul class="split-list">${dv.map((d) => `<li><span class="sw ${d[3]}" style="background-color:${d[2]}"></span><span class="k">${d[0]}</span><span class="p">${fr(d[1] * 100)} %</span><span class="c">${fr(Math.round(V * d[1]))}</span></li>`).join('')}</ul></section>`;

  // subscriber growth: cumulative
  const growth = []; const net = subNew - subUnsub, g0 = subs - net;
  for (let i = 0; i < n; i++) growth.push(Math.round(g0 + (net * (i + 1)) / n));
  const gmin = Math.min(...growth), gmax = Math.max(...growth, gmin + 1), gr = growth.map((g) => g - gmin);
  const sg = `<section class="card sec" aria-labelledby="h-sg"><div class="card-head"><h2 id="h-sg">Croissance des abonnés</h2><span class="sub num">${fr(subs)} abonnés confirmés</span></div>
${chartPanel({ title: 'Abonnés confirmés (cumul)', vals: growth.map((g) => g - gmin + 0), color: 'var(--c-aqua)', total: `+${fr(subNew)} / −${fr(subUnsub)}`, label: `Cumul des abonnés confirmés sur ${p} jours, de ${fr(growth[0])} à ${fr(growth[n - 1])}`, cssId: 'cs' }).replace(/<span>(\d+)<\/span>/g, '<span>$1</span>')}
<p class="note">Échelle relative : l’axe vertical montre le gain depuis le début de la période (0 = ${fr(growth[0])} abonnés).</p>
${dataTable(['Jour', 'Abonnés confirmés'], growth.map((g, i) => [dl(dAt(n - 1 - i)), fr(g)]).reverse(), 'Abonnés confirmés par jour', openTables)}</section>`;

  return `${sampleBanner}${pageHead(p)}
<section aria-labelledby="h-kpi"><h2 class="sr-only" id="h-kpi">Indicateurs clés</h2><div class="kpis">${tiles}</div></section>
${chart}${funnel}${photos}${albumCard}
<div class="two sec">${dn}${dev}</div>${sg}
<p class="foot">Les événements bruts sont conservés 13 mois puis supprimés ; les agrégats restent. Aucun cookie, aucune adresse IP stockée. Bande passante : octets des fichiers téléchargés, hors images du site servies par le CDN.</p>`;
}

const wrap = (title, body, p) => head(`${title} — Admin Stats`) + chrome + `<main id="main">${body}</main></body></html>`;

// ---- states
const emptyTiles = ['Téléchargements', 'Vues', 'Demandes', 'Inscriptions newsletter', 'Abonnés', 'Bande passante estimée'].map((l) => `<div class="kpi is-empty" role="group" aria-label="${l}"><span class="label">${l}</span><span class="value num" aria-label="Aucune donnée">0</span><span class="hint">Aucune donnée</span></div>`).join('');
const empty = `${pageHead(30)}
<section aria-labelledby="h-kpi"><h2 class="sr-only" id="h-kpi">Indicateurs clés</h2><div class="kpis">${emptyTiles}</div></section>
<section class="card sec"><div class="state" role="status">
<svg width="96" height="64" viewBox="0 0 96 64" aria-hidden="true" fill="none" stroke="#9a9a93" stroke-width="2"><path d="M4 56h88"/><path d="M12 48l16-14 14 8 18-22 14 10 12-12" stroke-dasharray="4 5"/><circle cx="84" cy="18" r="4" fill="#c8a97e" stroke="none"/></svg>
<h2>Pas encore de données</h2>
<p>Les statistiques apparaîtront dès les premières visites. Les vues sont comptées après affichage réel de la photo, sans cookie ni adresse IP stockée.</p>
<ul class="checks"><li>Vues des photos et des albums</li><li>Photos ajoutées à la sélection</li><li>Demandes, liens ouverts et téléchargements</li><li>Inscriptions à la newsletter</li></ul>
<a class="btn" href="#">Voir le site ↗</a></div></section>`;

const sk = (cls, w) => `<div class="sk ${cls}" style="${w ? 'width:' + w : ''}"></div>`;
const loading = `<div aria-busy="true"><p class="sr-only" role="status">Chargement des statistiques…</p>${pageHead(30, true)}
<div class="kpis" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map(() => `<div class="kpi">${sk('sk-line', '60%')}${sk('sk-big')}${sk('sk-line', '80%')}</div>`).join('')}</div>
<div class="card sec" aria-hidden="true">${sk('sk-line', '40%')}<div style="height:16px"></div>${sk('sk-chart')}<div style="height:16px"></div>${sk('sk-chart')}</div>
<div class="two sec" aria-hidden="true"><div class="card">${sk('sk-line', '50%')}<div style="height:16px"></div>${[1, 2, 3].map(() => sk('sk-row') + '<div style="height:12px"></div>').join('')}</div><div class="card">${sk('sk-line', '50%')}<div style="height:16px"></div>${[1, 2, 3].map(() => sk('sk-row') + '<div style="height:12px"></div>').join('')}</div></div></div>`;

const error = `${pageHead(30)}
<div class="alert" role="alert"><span class="ic" aria-hidden="true">⚠</span><div><h2>Impossible de charger les statistiques</h2>
<p>Le serveur n’a pas répondu. Vos données ne sont pas perdues. Réessayez dans un instant.</p>
<div class="alert-actions"><button class="btn">Réessayer</button><a class="btn secondary" href="#">Revenir au tableau de bord</a></div>
<details><summary style="min-height:44px;display:flex;align-items:center;cursor:pointer">Détails techniques</summary><pre>rpc admin_stats_summary · 504 Gateway Timeout · 2026-11-07 09:41 (Paris)</pre></details></div></div>
<section class="card sec" aria-hidden="false"><p class="sub">Les graphiques et classements s’affichent ici après un chargement réussi.</p></section>`;

const pages = {
  'stats-content-30d.html': ['Contenu 30 jours', content(30)],
  'stats-content-7d.html': ['Contenu 7 jours', content(7)],
  'stats-content-90d.html': ['Contenu 90 jours', content(90)],
  'stats-content-tables.html': ['Contenu avec tableaux ouverts', content(30, { openTables: true })],
  'stats-empty.html': ['État vide', empty],
  'stats-loading.html': ['Chargement', loading],
  'stats-error.html': ['Erreur', error],
};
for (const [f, [t, b]] of Object.entries(pages)) writeFileSync(join(OUT, f), wrap(t, b));
console.log(Object.keys(pages).join('\n'));
