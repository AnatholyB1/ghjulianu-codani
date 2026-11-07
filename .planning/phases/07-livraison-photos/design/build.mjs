// Generates screens/<state>.<lang>.html from one template. Run: node build.mjs
// Prototype only: sample data (album name, sizes, dates) is invented, photos are labelled placeholders.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(root, 'screens'), { recursive: true });

const ic = {
  dl: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>',
  zip: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M12 3v6M12 11v2M12 15v2"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>',
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>',
  warn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17v.01"/></svg>',
  retry: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
};
const glyph = (kind, size) => {
  const p = {
    clock: '<circle cx="32" cy="32" r="24"/><path d="M32 18v15l9 6"/>',
    spent: '<circle cx="18" cy="32" r="6"/><circle cx="32" cy="32" r="6"/><circle cx="46" cy="32" r="6"/><path d="M12 50h40" />',
    broken: '<rect x="4" y="24" width="26" height="16" rx="8"/><rect x="34" y="24" width="26" height="16" rx="8"/><path d="M32 14v6M32 44v6M24 18l2 4M40 18l-2 4"/>',
    error: '<path d="M32 8 6 54h52z"/><path d="M32 26v13M32 46v.01"/>',
  }[kind];
  return `<svg class="glyph ${size === 240 ? 'big' : 'small'}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="${size === 240 ? 0.6 : 1.5}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
};

const T = {
  fr: {
    htmlLang: 'fr', title: 'Vos photos', site: 'Ghjulianu Codani',
    eyebrow: 'Livraison de vos photos', h1: 'Vos photos sont prêtes',
    album: 'Album', albumName: 'Lumières de Corse', photos: 'Photos', left: 'Utilisations restantes', until: 'Valable jusqu’au',
    untilVal: 'lundi 9 novembre, 14 h 32', of: 'sur',
    all: 'Tout télécharger', zipLine: (n, s) => `ZIP, ${n} photos, ${s}`,
    cost: 'Ouvrir cette page ne consomme rien. Chaque téléchargement, photo seule ou ZIP, compte pour 1 utilisation. Pour plusieurs photos, le ZIP est le plus économe.',
    pick: 'Ou photo par photo', pickCount: (n) => `${n} photos`,
    ph: 'Aperçu', dlPhoto: (i, n) => `Télécharger la photo ${i} sur ${n} (1 utilisation)`,
    more: (n) => `Afficher les ${n} autres`,
    partsH: 'Tout télécharger en 3 parties', partsLede: 'Votre sélection pèse 247 Mo. Elle est découpée en 3 fichiers ZIP à télécharger un par un. Les 3 parties utiliseront les 3 utilisations du lien.',
    part: (i, n) => `Partie ${i} sur ${n}`, partInfo: (a, b, s) => `Photos ${a} à ${b}, ${s}`, partBtn: 'Télécharger', partBtnA: (i) => `Télécharger la partie ${i} (1 utilisation)`,
    started: 'Téléchargement lancé. Votre navigateur l’affiche dans ses téléchargements.', startedHint: 'Les grosses parties peuvent mettre quelques secondes à démarrer. Rien ne s’affiche sur cette page, c’est normal.',
    busy: 'Préparation…',
    lastH: 'Dernière utilisation', lastP: 'Après ce téléchargement, ce lien ne fonctionnera plus. Choisissez « Tout télécharger » pour tout récupérer d’un coup.',
    errH: 'Trop de téléchargements d’affilée', errP: 'Patientez une minute puis réessayez. Aucune utilisation n’a été consommée.',
    back: 'Retour au site', newLink: 'Redemander mes photos', retry: 'Réessayer',
    expH: 'Ce lien a expiré', expP: 'Il était valable jusqu’au lundi 9 novembre à 14 h 32. Par sécurité, un lien dure 48 heures.', expP2: 'Sélectionnez à nouveau vos photos sur le site pour recevoir un nouveau lien.',
    usedH: 'Ce lien est épuisé', usedP: 'Les 3 utilisations de ce lien ont été consommées. Par sécurité, un lien est limité à 3 téléchargements.', usedP2: 'Sélectionnez à nouveau vos photos sur le site pour recevoir un nouveau lien.',
    invH: 'Lien introuvable', invP: 'Ce lien est incomplet, a été annulé ou n’existe plus. Vérifiez que l’adresse a été copiée en entier depuis l’e-mail.', invP2: 'Sinon, redemandez vos photos depuis le site.',
    page500H: 'Un souci de notre côté', page500P: 'La page n’a pas pu se charger. Ouvrir cette page ne consomme jamais de téléchargement : votre lien reste valable.', page500P2: 'Réessayez dans un instant.',
    foot: 'Lien personnel : ne le partagez pas.', privacy: 'Confidentialité', home: 'Retour au site',
    langName: 'Langue', other: 'EN', cur: 'FR',
  },
  en: {
    htmlLang: 'en', title: 'Your photos', site: 'Ghjulianu Codani',
    eyebrow: 'Your photo delivery', h1: 'Your photos are ready',
    album: 'Album', albumName: 'Lumières de Corse', photos: 'Photos', left: 'Downloads left', until: 'Valid until',
    untilVal: 'Monday 9 November, 2:32 pm', of: 'of',
    all: 'Download all', zipLine: (n, s) => `ZIP, ${n} photos, ${s}`,
    cost: 'Opening this page costs nothing. Each download, a single photo or a ZIP, counts as 1 use. For several photos, the ZIP is the cheapest.',
    pick: 'Or photo by photo', pickCount: (n) => `${n} photos`,
    ph: 'Preview', dlPhoto: (i, n) => `Download photo ${i} of ${n} (1 use)`,
    more: (n) => `Show the other ${n}`,
    partsH: 'Download all in 3 parts', partsLede: 'Your selection weighs 247 MB. It is split into 3 ZIP files to download one by one. The 3 parts will use all 3 uses of the link.',
    part: (i, n) => `Part ${i} of ${n}`, partInfo: (a, b, s) => `Photos ${a} to ${b}, ${s}`, partBtn: 'Download', partBtnA: (i) => `Download part ${i} (1 use)`,
    started: 'Download started. Your browser shows it in its downloads.', startedHint: 'Large parts can take a few seconds to start. Nothing moves on this page, that is normal.',
    busy: 'Preparing…',
    lastH: 'Last use', lastP: 'After this download the link will stop working. Choose “Download all” to get everything in one go.',
    errH: 'Too many downloads in a row', errP: 'Wait a minute, then try again. No use was consumed.',
    back: 'Back to the site', newLink: 'Request my photos again', retry: 'Try again',
    expH: 'This link has expired', expP: 'It was valid until Monday 9 November at 2:32 pm. For safety, a link lasts 48 hours.', expP2: 'Select your photos again on the site to receive a new link.',
    usedH: 'This link is used up', usedP: 'All 3 uses of this link have been consumed. For safety, a link is limited to 3 downloads.', usedP2: 'Select your photos again on the site to receive a new link.',
    invH: 'Link not found', invP: 'This link is incomplete, was cancelled, or no longer exists. Check that the whole address was copied from the email.', invP2: 'Otherwise, request your photos again from the site.',
    page500H: 'Something went wrong on our side', page500P: 'The page could not load. Opening this page never uses a download: your link is still valid.', page500P2: 'Try again in a moment.',
    foot: 'Personal link: do not share it.', privacy: 'Privacy', home: 'Back to the site',
    langName: 'Language', other: 'FR', cur: 'EN',
  },
};

const ratios = ['3:2','2:3','4:5','3:2','1:1','2:3','16:9','3:2','4:5','2:3','3:2','1:1','4:5','3:2'];
const css = (r) => r.replace(':', ' / ');

function tiles(t, count, total) {
  return ratios.slice(0, count).map((r, k) => {
    const i = k + 1;
    return `<li class="tile" style="--i:${k}"><figure><div class="ph" style="aspect-ratio:${css(r)}"><span class="tag"><span class="n">${String(i).padStart(2, '0')}</span><span class="chip" title="${t.ph}">${r}</span></span></div></figure><a class="dl" href="#" download rel="nofollow noreferrer" aria-label="${t.dlPhoto(i, total)}">${ic.dl}</a></li>`;
  }).join('');
}
const pips = (on) => `<span class="pips" aria-hidden="true">${[0,1,2].map((k) => `<span class="pip${k < on ? ' on' : ''}"></span>`).join('')}</span>`;
const meta = (t, left, count, size) => `<dl class="meta">
  <div><dt>${t.album}</dt><dd>${t.albumName}</dd></div>
  <div><dt>${t.photos}</dt><dd>${count}, ${size}</dd></div>
  <div><dt>${t.left}</dt><dd>${pips(left)}${left} ${t.of} 3</dd></div>
  <div><dt>${t.until}</dt><dd>${t.untilVal}</dd></div></dl>`;
const callout = (kind, icon, h, p, role) => `<div class="callout ${kind}" role="${role}">${icon}<div><strong>${h}</strong>${p}</div></div>`;

function valid(t, o) {
  const count = o.count ?? 14;
  const cta = o.parts ? '' : `<a class="btn btn-primary" href="#" download rel="nofollow noreferrer" ${o.busy ? 'aria-busy="true"' : ''}>${ic.zip}<span class="stack">${t.all}<small>${t.zipLine(14, '38 MB'.replace('MB', t.htmlLang === 'fr' ? 'Mo' : 'MB'))}</small></span></a><p class="note">${t.cost}</p>`;
  const parts = !o.parts ? '' : `<section class="parts-head" aria-labelledby="ph"><h2 id="ph">${t.partsH}</h2><p class="note">${t.partsLede}</p>
    <ol class="parts">${[[1,40,104],[41,80,102],[81,96,41]].map(([a,b,mb], k) => {
      const i = k + 1; const unit = t.htmlLang === 'fr' ? 'Mo' : 'MB';
      const started = o.started && i === 1;
      return `<li class="part"><div><div class="part-name">${t.part(i,3)}</div><div class="part-info">${t.partInfo(a,b,mb + ' ' + unit)}</div></div>
      <a class="btn ${started ? 'btn-ghost' : 'btn-primary'}" href="#" download rel="nofollow noreferrer" aria-label="${t.partBtnA(i)}" ${started ? 'aria-busy="true"' : ''}>${started ? t.busy : t.partBtn}</a>
      ${started ? `<div class="bar" aria-hidden="true"></div><p class="part-status" role="status">${t.started} ${t.startedHint}</p>` : ''}</li>`; }).join('')}</ol></section>`;
  const banners = (o.last ? callout('', ic.warn, t.lastH, t.lastP, 'status') : '') + (o.err ? callout('danger', ic.warn, t.errH, t.errP, 'alert') : '');
  const left = o.left ?? 3;
  const size = o.parts ? '247 ' + (t.htmlLang === 'fr' ? 'Mo' : 'MB') : '38 ' + (t.htmlLang === 'fr' ? 'Mo' : 'MB');
  const shown = o.parts ? 12 : count;
  const more = o.parts ? `<div class="more"><button class="btn btn-ghost fit" type="button">${t.more(84)}</button></div>` : '';
  const total = o.parts ? 96 : count;
  return `<div class="layout">
  <section class="panel rise" aria-labelledby="h1"><h1 id="h1">${t.h1}</h1>
    ${banners}${meta(t, left, total, size)}${cta}${parts}</section>
  <section aria-labelledby="gh"><div class="grid-head"><h2 id="gh">${t.pick}</h2><p>${t.pickCount(total)}</p></div>
    <ul class="photos">${tiles(t, shown, total)}</ul>${more}</section></div>`;
}

function terminal(t, kind, g, h, p, p2, actions) {
  return `<div class="state"><div class="body rise">${glyph(g, 64)}<h1>${h}</h1><p class="lede">${p}</p><p class="lede" style="margin-top:var(--s-3)">${p2}</p><div class="actions">${actions}</div></div>${glyph(g, 240)}</div>`;
}
const newLinkBtn = (t) => `<a class="btn btn-primary" href="#">${t.newLink}</a><a class="btn btn-ghost" href="#">${ic.back}${t.back}</a>`;

const states = {
  valid: (t) => valid(t, {}),
  parts: (t) => valid(t, { parts: true }),
  started: (t) => valid(t, { parts: true, started: true, left: 2 }),
  last: (t) => valid(t, { left: 1, last: true }),
  dlerror: (t) => valid(t, { err: true }),
  expired: (t) => terminal(t, 'expired', 'clock', t.expH, t.expP, t.expP2, newLinkBtn(t)),
  exhausted: (t) => terminal(t, 'used', 'spent', t.usedH, t.usedP, t.usedP2, newLinkBtn(t)),
  invalid: (t) => terminal(t, 'invalid', 'broken', t.invH, t.invP, t.invP2, newLinkBtn(t)),
  error: (t) => terminal(t, 'error', 'error', t.page500H, t.page500P, t.page500P2, `<a class="btn btn-primary" href="#">${ic.retry}${t.retry}</a><a class="btn btn-ghost" href="#">${ic.back}${t.back}</a>`),
};

function page(lang, name) {
  const t = T[lang]; const o = lang === 'fr' ? 'en' : 'fr';
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<title>${t.title} | ${t.site}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&family=Space+Grotesk:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="../tokens.css"><link rel="stylesheet" href="../base.css">
<script>if(/theme=day/.test(location.search))document.documentElement.classList.add('day')</script>
</head>
<body data-state="${name}">
<header class="shell top"><a class="brand" href="#" rel="noopener noreferrer">${t.site}</a>
<nav class="lang" aria-label="${t.langName}"><a href="#" lang="${t.htmlLang}" aria-current="true">${t.cur}</a><a href="#" lang="${o}" hreflang="${o}">${T[o].cur}</a></nav></header>
<main class="shell">${states[name](t)}</main>
<footer class="foot"><div class="shell"><p>${t.foot}</p><nav><a href="#">${t.privacy}</a><a href="#">${t.home}</a></nav></div></footer>
</body></html>
`;
}
for (const lang of ['fr', 'en']) for (const name of Object.keys(states)) writeFileSync(join(root, 'screens', `${name}.${lang}.html`), page(lang, name));
console.log('built', Object.keys(states).length * 2, 'screens');
