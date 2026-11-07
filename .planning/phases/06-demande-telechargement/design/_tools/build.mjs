// Generates every static prototype screen into ../screens. Run: node _tools/build.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'screens');
mkdirSync(out, { recursive: true });

/* ---------- copy ---------- */
const T = {
  fr: {
    sel: 'SÉLECTION', cart: 'Votre panier', close: 'Fermer', none: 'Aucune photo sélectionnée.', browse: 'PARCOURIR LES ALBUMS',
    count: n => `${n} photo${n > 1 ? 's' : ''} sélectionnée${n > 1 ? 's' : ''}`, clear: 'VIDER', cta: 'RECEVOIR PAR EMAIL',
    ctaHint: 'Un lien de téléchargement vous est envoyé par email, valable 48 h.',
    title: 'Recevoir mes photos', back: 'Modifier la sélection',
    intro: n => `Indiquez votre email : je vous envoie un lien pour télécharger <strong>${n} photo${n > 1 ? 's' : ''}</strong>.`,
    emailLabel: 'Adresse email', emailPh: 'vous@exemple.fr', emailHint: 'Le lien est valable 48 h et utilisable 3 fois.',
    nl: 'Je souhaite aussi recevoir la newsletter de Ghjulianu Codani (nouveaux albums, actualités).',
    nlSub: 'Facultatif : vous recevez vos photos dans tous les cas. Une confirmation par email vous sera demandée. Désinscription en un clic.',
    priv: 'Votre email sert uniquement à vous envoyer ce lien. En savoir plus dans la <a href="#">politique de confidentialité</a>.',
    submit: 'ENVOYER LE LIEN', sending: 'ENVOI EN COURS…',
    errInvalid: 'Cette adresse email semble invalide. Exemple : prenom@domaine.fr',
    errServer: 'L’envoi a échoué. Vos photos sont toujours sélectionnées : réessayez dans un instant.',
    errRate: 'Trop de demandes pour le moment. Patientez quelques minutes avant de réessayer.',
    okTitle: 'Vérifiez votre boîte mail',
    okBody: 'Si l’adresse est correcte, vous recevrez un email dans quelques minutes avec votre lien de téléchargement. Pensez à regarder dans vos courriers indésirables (spam).',
    okNl: 'Vous avez demandé la newsletter : un second email vous demandera de confirmer votre inscription.',
    okClose: 'FERMER', okOther: 'Utiliser une autre adresse',
    keyEyebrow: 'ESPACE CLIENT', keyTitle: 'Mon album',
    keyDesc: 'Vous avez reçu une clé d’accès personnalisée ? Saisissez-la ci-dessous pour ouvrir votre album privé.',
    keyLabel: 'CLÉ D’ACCÈS', keyPh: 'Entrez votre clé…', show: 'Afficher la clé', hide: 'Masquer la clé',
    keySubmit: 'ACCÉDER À MON ALBUM', keyLoading: 'VÉRIFICATION…',
    keyWrong: 'Clé invalide ou expirée. Vérifiez la clé reçue par email.', keyLeft: n => `Il vous reste ${n} essai${n > 1 ? 's' : ''}.`,
    keyLocked: 'Trop d’essais. Réessayez dans 15 minutes.', keyLockedHelp: 'Besoin d’aide ? <a href="#">Contactez-moi</a>.',
    howTitle: ['Vous recevez une clé unique après votre séance photo ou événement', 'Saisissez cette clé ici pour accéder à votre album privé', 'Sélectionnez vos photos et recevez-les par email'],
    menu: 'MENU', ph: 'photo',
  },
  en: {
    sel: 'SELECTION', cart: 'Your cart', close: 'Close', none: 'No photos selected.', browse: 'BROWSE ALBUMS',
    count: n => `${n} photo${n > 1 ? 's' : ''} selected`, clear: 'CLEAR', cta: 'GET BY EMAIL',
    ctaHint: 'A download link is sent to your email, valid for 48 h.',
    title: 'Get my photos', back: 'Edit selection',
    intro: n => `Enter your email and I will send you a link to download <strong>${n} photo${n > 1 ? 's' : ''}</strong>.`,
    emailLabel: 'Email address', emailPh: 'you@example.com', emailHint: 'The link is valid for 48 h and can be used 3 times.',
    nl: 'I would also like to receive the Ghjulianu Codani newsletter (new albums, news).',
    nlSub: 'Optional: you get your photos either way. You will be asked to confirm by email. Unsubscribe in one click.',
    priv: 'Your email is only used to send you this link. Learn more in the <a href="#">privacy policy</a>.',
    submit: 'SEND THE LINK', sending: 'SENDING…',
    errInvalid: 'This email address looks invalid. Example: name@domain.com',
    errServer: 'Sending failed. Your photos are still selected: please try again in a moment.',
    errRate: 'Too many requests right now. Please wait a few minutes before trying again.',
    okTitle: 'Check your inbox',
    okBody: 'If the address is correct, you will receive an email within a few minutes with your download link. Remember to check your spam folder.',
    okNl: 'You asked for the newsletter: a second email will ask you to confirm your subscription.',
    okClose: 'CLOSE', okOther: 'Use another address',
    keyEyebrow: 'CLIENT SPACE', keyTitle: 'My album',
    keyDesc: 'Received a personal access key? Enter it below to open your private album.',
    keyLabel: 'ACCESS KEY', keyPh: 'Enter your key…', show: 'Show key', hide: 'Hide key',
    keySubmit: 'ACCESS MY ALBUM', keyLoading: 'CHECKING…',
    keyWrong: 'Invalid or expired key. Please check the key you received by email.', keyLeft: n => `${n} attempt${n > 1 ? 's' : ''} left.`,
    keyLocked: 'Too many attempts. Try again in 15 minutes.', keyLockedHelp: 'Need help? <a href="#">Contact me</a>.',
    howTitle: ['You receive a unique key after your photo session or event', 'Enter that key here to access your private album', 'Select your photos and receive them by email'],
    menu: 'MENU', ph: 'photo',
  },
};

/* ---------- icons ---------- */
const X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ALERT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16.5v.01"/></svg>';
const MAIL = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
const EYE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const SPIN = '<span class="spin" aria-hidden="true"></span>';

const ph = (t, label) => `<div class="ph r32" role="img" aria-label="${t.ph} placeholder 3:2">3:2</div>`;
const head = (html, ...a) => `<!doctype html><html lang="${html.lang}" class="${html.theme === 'day' ? 'day' : ''}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html.title}</title><link rel="stylesheet" href="../tokens.css"><link rel="stylesheet" href="../app.css"></head><body>`;
const stage = () => `<div class="stage" aria-hidden="true">${Array.from({ length: 9 }, () => '<div class="ph r32">3:2</div>').join('')}</div>`;

/* ---------- drawer pieces ---------- */
function drawer(t, headTitle, body, foot, { label = 'dialog' } = {}) {
  return `${stage()}<div class="scrim"></div>
<div class="drawer" role="dialog" aria-modal="true" aria-labelledby="dt">
 <div class="drawer__head"><div><p class="eyebrow">${t.sel}</p><h2 id="dt">${headTitle}</h2></div><button class="iconbtn" aria-label="${t.close}">${X}</button></div>
 <div class="drawer__body">${body}</div>${foot ? `<div class="drawer__foot">${foot}</div>` : ''}
</div>`;
}
const summary = (t, n) => `<div><div class="summary__row"><div class="summary">${ph(t)}${n > 1 ? ph(t) : ''}${n > 2 ? ph(t) : ''}${n > 3 ? `<span class="summary__more">+${n - 3}</span>` : ''}</div></div>
<div class="summary__row"><p class="hint">${t.count(n)}</p><button class="textbtn" type="button">${t.back}</button></div></div>`;

function formBody(t, { n = 12, email = '', checked = false, invalid = false, busy = false, banner = null }) {
  return `${summary(t, n)}
<p class="lead">${t.intro(n)}</p>
${banner ? `<div class="msg msg--${banner.kind}" role="alert">${ALERT}<span>${banner.text}</span></div>` : ''}
<form id="rq" novalidate ${busy ? 'aria-busy="true"' : ''} style="display:flex;flex-direction:column;gap:24px">
 <div class="field"><label for="em">${t.emailLabel}</label>
  <input class="input" id="em" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="${t.emailPh}" value="${email}" ${busy ? 'readonly' : ''} ${invalid ? 'aria-invalid="true" aria-describedby="em-err"' : 'aria-describedby="em-hint"'} required>
  ${invalid ? `<p class="msg msg--inline" id="em-err" role="alert">${ALERT}<span>${t.errInvalid}</span></p>` : `<p class="hint" id="em-hint">${t.emailHint}</p>`}
 </div>
 <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
 <label class="check"><input type="checkbox" name="newsletter" ${checked ? 'checked' : ''} ${busy ? 'disabled' : ''}><span class="check__txt">${t.nl}<small>${t.nlSub}</small></span></label>
 <p class="hint">${t.priv}</p>
</form>`;
}
const submitBtn = (t, busy) => `<button class="btn" type="submit" form="rq" ${busy ? 'disabled aria-disabled="true"' : ''}>${busy ? SPIN + t.sending : t.submit}</button>`;

const done = (t, nl) => `<div class="done rise" role="status" aria-live="polite"><div class="done__icon">${MAIL}</div><h3>${t.okTitle}</h3><p class="lead">${t.okBody}</p>${nl ? `<p class="note">${t.okNl}</p>` : ''}</div>`;

/* ---------- screen definitions ---------- */
const A = []; // [id, label, builder(t)]
const items = (t, n) => Array.from({ length: n }, (_, i) => `<div class="item">${ph(t)}<div class="item__t"><p>Photo ${i + 1}</p><p>Nuit blanche, Paris</p></div><button class="iconbtn" style="margin:0" aria-label="Retirer">${X}</button></div>`).join('');
A.push(['a-cart-empty', 'Panier vide', t => drawer(t, t.cart, `<div class="empty"><p>${t.none}</p><a class="btn btn--ghost" href="#">${t.browse}</a></div>`, '')]);
A.push(['a-cart-list', 'Panier avec photos, point d’entrée', t => drawer(t, t.cart, `<div class="list">${items(t, 5)}</div>`, `<div class="summary__row"><p class="hint">${t.count(12)}</p><button class="textbtn" type="button">${t.clear}</button></div><button class="btn" type="button">${t.cta}</button><p class="hint">${t.ctaHint}</p>`)]);
A.push(['a-form-default', 'Formulaire, état initial', t => drawer(t, t.title, formBody(t, {}), submitBtn(t, false))]);
A.push(['a-form-invalid', 'Email invalide (validation locale)', t => drawer(t, t.title, formBody(t, { email: 'julie@exemple', invalid: true }), submitBtn(t, false))]);
A.push(['a-form-newsletter', 'Newsletter cochée par le visiteur', t => drawer(t, t.title, formBody(t, { email: 'julie@exemple.fr', checked: true }), submitBtn(t, false))]);
A.push(['a-form-loading', 'Envoi en cours', t => drawer(t, t.title, formBody(t, { email: 'julie@exemple.fr', busy: true }), submitBtn(t, true))]);
A.push(['a-success', 'Succès générique', t => drawer(t, t.title, done(t, false), `<button class="btn" type="button">${t.okClose}</button><button class="textbtn" type="button" style="align-self:center">${t.okOther}</button>`)]);
A.push(['a-success-newsletter', 'Succès, newsletter demandée', t => drawer(t, t.title, done(t, true), `<button class="btn" type="button">${t.okClose}</button><button class="textbtn" type="button" style="align-self:center">${t.okOther}</button>`)]);
A.push(['a-error-server', 'Erreur serveur / envoi', t => drawer(t, t.title, formBody(t, { email: 'julie@exemple.fr', banner: { kind: 'err', text: t.errServer } }), submitBtn(t, false))]);
A.push(['a-error-rate', 'Limite de débit atteinte', t => drawer(t, t.title, formBody(t, { email: 'julie@exemple.fr', banner: { kind: 'warn', text: t.errRate } }), submitBtn(t, false))]);

function keyPage(t, { value = '', busy = false, banner = null, locked = false, shown = false }) {
  const inv = !!banner && !locked;
  return `<div class="topbar"><b>GHJULIANU CODANI</b><span>${t.menu}</span></div>
<main class="keypage"><p class="eyebrow">${t.keyEyebrow}</p><h1>${t.keyTitle}</h1><p class="lead">${t.keyDesc}</p>
<form novalidate ${busy ? 'aria-busy="true"' : ''}>
 <div class="field"><label for="k">${t.keyLabel}</label>
  <div class="input-wrap"><input class="input input--key" id="k" name="key" type="${shown ? 'text' : 'password'}" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="${t.keyPh}" value="${value}" ${busy || locked ? 'readonly' : ''} ${inv ? 'aria-invalid="true" aria-describedby="k-err"' : ''} ${locked ? 'aria-describedby="k-err"' : ''}><button class="iconbtn" type="button" aria-label="${shown ? t.hide : t.show}" aria-pressed="${shown}">${EYE}</button></div>
 </div>
 ${banner ? `<div class="msg msg--${locked ? 'warn' : 'err'}" id="k-err" role="alert">${ALERT}<span>${banner}</span></div>` : ''}
 <button class="btn" type="submit" ${busy || locked ? 'disabled aria-disabled="true"' : ''}>${busy ? SPIN + t.keyLoading : t.keySubmit}</button>
</form>
<ul class="how">${t.howTitle.map(h => `<li>${h}</li>`).join('')}</ul></main>`;
}
const B = [];
B.push(['b-key-default', 'Clé : état initial', t => keyPage(t, {})]);
B.push(['b-key-loading', 'Clé : vérification', t => keyPage(t, { value: 'K7M2-P9QX-4TDA', busy: true })]);
B.push(['b-key-wrong', 'Clé : incorrecte (essais restants)', t => keyPage(t, { value: 'K7M2-P9QX-4TDB', shown: true, banner: `${t.keyWrong} ${t.keyLeft(2)}` })]);
B.push(['b-key-locked', 'Clé : trop d’essais', t => keyPage(t, { value: '', locked: true, banner: `${t.keyLocked} ${t.keyLockedHelp}` })]);

/* ---------- emit ---------- */
const meta = [];
function emit(id, label, fn, lang, theme, group) {
  const t = T[lang];
  const name = `${id}.${lang}.${theme}.html`;
  writeFileSync(join(out, name), head({ lang, theme, title: `${id} ${lang} ${theme}` }) + fn(t) + '</body></html>');
  meta.push({ id, label, lang, theme, file: name, group });
}
const enOnly = new Set(['a-form-default', 'a-form-invalid', 'a-success', 'a-error-rate', 'b-key-wrong', 'b-key-locked']);
for (const theme of ['night', 'day']) {
  for (const [id, label, fn] of A) { emit(id, label, fn, 'fr', theme, 'a'); if (enOnly.has(id)) emit(id, label, fn, 'en', theme, 'a'); }
  for (const [id, label, fn] of B) { emit(id, label, fn, 'fr', theme, 'b'); if (enOnly.has(id)) emit(id, label, fn, 'en', theme, 'b'); }
}

/* ---------- transactional email (c) ---------- */
const E = {
  fr: { lang: 'fr', subject: 'Vos photos de Ghjulianu Codani sont prêtes', pre: 'Votre lien est valable 48 h et peut être utilisé 3 fois.', h1: 'Vos photos sont prêtes',
    p: (n, album) => `Bonjour, vous avez demandé à télécharger <strong>${n} photo${n > 1 ? 's' : ''}</strong>${album ? ` de l’album « ${album} »` : ''}. Voici votre lien personnel.`,
    btn: 'Télécharger mes photos', rows: n => [['Validité', '48 heures (jusqu’au 9 nov. 2026, 14:32)'], ['Utilisations', '3 téléchargements maximum'], ['Contenu', `${n} photo${n > 1 ? 's' : ''}, haute qualité`]],
    fb: 'Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :', safe: 'Vous n’êtes pas à l’origine de cette demande ? Ignorez simplement cet email : le lien expirera de lui-même.',
    only: 'Ce message concerne uniquement votre demande de téléchargement.', priv: 'Politique de confidentialité', addr: '[Adresse postale de l’éditeur : à renseigner avant mise en production]', loc: 'Photographe, Paris et Corse' },
  en: { lang: 'en', subject: 'Your Ghjulianu Codani photos are ready', pre: 'Your link is valid for 48 h and can be used 3 times.', h1: 'Your photos are ready',
    p: (n, album) => `Hello, you asked to download <strong>${n} photo${n > 1 ? 's' : ''}</strong>${album ? ` from the album “${album}”` : ''}. Here is your personal link.`,
    btn: 'Download my photos', rows: n => [['Valid for', '48 hours (until 9 Nov 2026, 2:32 pm)'], ['Uses', '3 downloads maximum'], ['Contents', `${n} photo${n > 1 ? 's' : ''}, full quality`]],
    fb: 'The button does not work? Copy this link into your browser:', safe: 'You did not make this request? Simply ignore this email: the link will expire on its own.',
    only: 'This message only relates to your download request.', priv: 'Privacy policy', addr: '[Publisher postal address: to be filled in before production]', loc: 'Photographer, Paris and Corsica' },
};
const emailCss = `
:root{--o:#f1ede4;--c:#ffffff;--tx:#1a1a1a;--mu:#5c5c5c;--ln:#e4dfd3;--bt:#c8a97e;--bx:#080808;--ac:#7a5200}
html[data-theme=dark]{--o:#050505;--c:#0f0f0f;--tx:#E8E4DC;--mu:#a8a8a0;--ln:#262624;--bt:#c8a97e;--bx:#080808;--ac:#c8a97e}
@media (prefers-color-scheme:dark){html:not([data-theme=light]){--o:#050505;--c:#0f0f0f;--tx:#E8E4DC;--mu:#a8a8a0;--ln:#262624;--ac:#c8a97e}}
body{margin:0;background:var(--o);color:var(--tx);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6}
.wrap{width:100%;max-width:600px;margin:0 auto}
.pre{display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;color:transparent}
.card{background:var(--c);border:1px solid var(--ln);padding:40px 32px}
.brand{font-size:14px;letter-spacing:.22em;text-transform:uppercase;color:var(--mu);margin:0 0 32px}
h1{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:36px;line-height:1.15;margin:0 0 16px;color:var(--tx)}
p{margin:0 0 16px}
.btn{display:block;text-align:center;background:var(--bt);color:var(--bx)!important;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:.04em;padding:16px 24px;margin:24px 0 24px;min-height:48px;box-sizing:border-box;border-radius:2px}
table.meta{width:100%;border-collapse:collapse;margin:8px 0 24px}
table.meta td{padding:10px 0;border-top:1px solid var(--ln);font-size:14px;vertical-align:top}
table.meta td:first-child{color:var(--mu);width:34%;padding-right:12px}
.small{font-size:14px;color:var(--mu)}
.url{font-size:14px;word-break:break-all;color:var(--ac)}
.foot{padding:24px 32px;font-size:14px;color:var(--mu);line-height:1.6}
.foot a{color:var(--ac)}
@media (max-width:480px){.card{padding:32px 20px}.foot{padding:20px}h1{font-size:30px}}
`;
function emailHtml(lang, n, mode) {
  const e = E[lang];
  const album = n > 1 ? 'Nuit blanche, Paris' : '';
  return `<!doctype html><html lang="${lang}" data-theme="${mode}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${e.subject}</title><style>${emailCss}</style></head><body>
<div class="pre">${e.pre}</div>
<div class="wrap"><div class="card" role="article">
<p class="brand">Ghjulianu Codani</p>
<h1>${e.h1}</h1>
<p>${e.p(n, album)}</p>
<a class="btn" href="#">${e.btn}</a>
<table class="meta" role="presentation">${e.rows(n).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>
<p class="small">${e.fb}</p>
<p class="url">https://ghjulianucodani.com/telechargement/exemple-de-jeton</p>
<p class="small">${e.safe}</p>
</div>
<div class="foot"><p style="margin:0 0 8px">${e.only}</p><p style="margin:0 0 8px">Ghjulianu Codani, ${e.loc}.<br>${e.addr}</p><p style="margin:0"><a href="#">${e.priv}</a></p></div>
</div></body></html>`;
}
for (const lang of ['fr', 'en']) for (const n of [12, 1]) for (const mode of ['light', 'dark']) {
  const name = `c-email-${n === 1 ? 'single' : 'multi'}.${lang}.${mode}.html`;
  writeFileSync(join(out, name), emailHtml(lang, n, mode));
  meta.push({ id: `c-email-${n === 1 ? 'single' : 'multi'}`, label: `Email transactionnel, ${n} photo${n > 1 ? 's' : ''}`, lang, theme: mode, file: name, group: 'c' });
}
writeFileSync(join(root, '_tools', 'screens.json'), JSON.stringify(meta, null, 1));
console.log(meta.length, 'screens');
