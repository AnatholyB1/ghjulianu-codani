// Generates every static mockup. Run: node gen.mjs   (no dependencies)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
for (const d of ['public', 'email', 'admin']) mkdirSync(join(D, d), { recursive: true });
const write = (p, s) => writeFileSync(join(D, p), s);

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300;1,400&family=Space+Grotesk:wght@400;500&display=swap">`;

const I = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1"/><path d="M4 7l8 6 8-6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12h7"/></svg>',
  ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.01"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5M14 11v5"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/></svg>',
  search: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

/* ------------------------------------------------------------------ PUBLIC */
const T = {
  fr: {
    brand: 'Ghjulianu Codani', theme: 'Basculer jour / nuit', home: 'Retour au site', albums: 'Voir les albums',
    legal: 'Mentions légales', privacy: 'Politique de confidentialité', contactL: 'Contact',
    recapT: 'Ce que vous confirmez', recapEmail: 'Adresse', recapConsent: 'Consentement', recapDate: 'Demandé le', recapVer: 'Texte accepté',
    consentTxt: 'J’accepte de recevoir la newsletter de Ghjulianu Codani (nouveaux albums et actualités). Je peux me désinscrire à tout moment.',
    confirm: {
      eyebrow: 'Newsletter',
      ready: { h: 'Confirmez votre inscription', p1: ['Un dernier geste : appuyez sur le bouton pour recevoir les nouvelles photos de Ghjulianu Codani à l’adresse ', '.'], p2: 'Tant que vous n’avez pas confirmé, rien n’est enregistré. Si ce n’est pas vous, fermez simplement cette page.', btn: 'Confirmer mon inscription', busy: 'Confirmation…' },
      error: { msg: 'La confirmation n’a pas abouti. Vérifiez votre connexion puis réessayez.' },
      confirmed: { h: 'Inscription confirmée', p1: ['Merci. La prochaine newsletter arrivera à ', '.'], p2: 'Chaque email contient un lien pour vous désinscrire en un clic.', btn: 'Retour au site' },
      expired: { h: 'Ce lien a expiré', p1: ['Le lien de confirmation n’est valable que 48 heures. Aucune inscription n’a été faite pour ', '.'], p2: 'Nous pouvons vous envoyer un nouveau lien, ou vous pouvez ignorer ce message.', btn: 'Recevoir un nouveau lien', sec: 'Retour au site', sent: '' },
      already: { h: 'Déjà confirmé', p1: ['L’adresse ', ' est déjà inscrite à la newsletter. Il n’y a rien à faire.'], p2: 'Vous pouvez vous désinscrire à tout moment depuis n’importe quel email reçu.', btn: 'Retour au site' },
    },
    unsub: {
      eyebrow: 'Newsletter',
      ready: { h: 'Se désinscrire de la newsletter ?', p1: ['Vous ne recevrez plus la newsletter à l’adresse ', '.'], p2: 'Les liens de téléchargement que vous demandez continueront d’être envoyés normalement.', btn: 'Me désinscrire', busy: 'Désinscription…', sec: 'Je reste abonné(e)' },
      error: { msg: 'La désinscription n’a pas abouti. Réessayez dans un instant.' },
      confirmed: { h: 'Vous êtes désinscrit(e)', p1: ['Plus aucune newsletter ne sera envoyée à ', '.'], p2: 'Effectif immédiatement. Aucune action supplémentaire n’est nécessaire.', btn: 'Retour au site', hintT: 'Se réinscrire', hint: 'Cochez la case « newsletter » quand vous demandez des photos. Un email de confirmation vous sera envoyé.' },
      invalid: { h: 'Lien non reconnu', p1: ['Ce lien de désinscription est incomplet ou a été modifié.'], p2: 'Chaque newsletter se termine par un lien valide. Si le problème persiste, écrivez-nous à contact@example.org.', btn: 'Retour au site' },
      already: { h: 'Déjà désinscrit(e)', p1: ['L’adresse ', ' ne reçoit déjà plus la newsletter.'], p2: 'Rien à faire de votre côté.', btn: 'Retour au site', hintT: 'Se réinscrire', hint: 'Cochez la case « newsletter » quand vous demandez des photos. Un email de confirmation vous sera envoyé.' },
    },
    recapNote: 'Version v1 du texte, conservée avec la date comme preuve de consentement.',
    date: '7 nov. 2026, 14:32',
  },
  en: {
    brand: 'Ghjulianu Codani', theme: 'Toggle day / night', home: 'Back to site', albums: 'Browse albums',
    legal: 'Legal notice', privacy: 'Privacy policy', contactL: 'Contact',
    recapT: 'What you are confirming', recapEmail: 'Address', recapConsent: 'Consent', recapDate: 'Requested on', recapVer: 'Accepted text',
    consentTxt: 'I agree to receive the Ghjulianu Codani newsletter (new albums and news). I can unsubscribe at any time.',
    confirm: {
      eyebrow: 'Newsletter',
      ready: { h: 'Confirm your subscription', p1: ['One last step: press the button to receive new photos from Ghjulianu Codani at ', '.'], p2: 'Nothing is saved until you confirm. If this was not you, simply close this page.', btn: 'Confirm my subscription', busy: 'Confirming…' },
      error: { msg: 'The confirmation did not go through. Check your connection and try again.' },
      confirmed: { h: 'Subscription confirmed', p1: ['Thank you. The next newsletter will reach ', '.'], p2: 'Every email contains a one-click unsubscribe link.', btn: 'Back to site' },
      expired: { h: 'This link has expired', p1: ['The confirmation link is only valid for 48 hours. No subscription was made for ', '.'], p2: 'We can send you a fresh link, or you can ignore this message.', btn: 'Send me a new link', sec: 'Back to site', sent: '' },
      already: { h: 'Already confirmed', p1: ['', ' is already subscribed to the newsletter. Nothing to do.'], p2: 'You can unsubscribe at any time from any email you receive.', btn: 'Back to site' },
    },
    unsub: {
      eyebrow: 'Newsletter',
      ready: { h: 'Unsubscribe from the newsletter?', p1: ['You will no longer receive the newsletter at ', '.'], p2: 'Download links that you request will still be sent as usual.', btn: 'Unsubscribe me', busy: 'Unsubscribing…', sec: 'Keep me subscribed' },
      error: { msg: 'The unsubscribe did not go through. Please try again in a moment.' },
      confirmed: { h: 'You are unsubscribed', p1: ['No more newsletters will be sent to ', '.'], p2: 'Effective immediately. No further action is needed.', btn: 'Back to site', hintT: 'Subscribe again', hint: 'Tick the “newsletter” box when you request photos. A confirmation email will follow.' },
      invalid: { h: 'Link not recognised', p1: ['This unsubscribe link is incomplete or has been altered.'], p2: 'Every newsletter ends with a valid link. If the problem continues, write to contact@example.org.', btn: 'Back to site' },
      already: { h: 'Already unsubscribed', p1: ['', ' already no longer receives the newsletter.'], p2: 'Nothing to do on your side.', btn: 'Back to site', hintT: 'Subscribe again', hint: 'Tick the “newsletter” box when you request photos. A confirmation email will follow.' },
    },
    recapNote: 'Text version v1, stored with the date as proof of consent.',
    date: 'Nov 7, 2026, 2:32 PM',
  },
};
const MASK = { fr: 'm***@example.org', en: 'm***@example.org' };

function pubPage({ kind, state, lang, theme }) {
  const t = T[lang];
  const c = t[kind][state === 'error' ? 'ready' : state] ;
  const isConfirm = kind === 'confirm';
  const showAddr = !(kind === 'unsub' && state === 'invalid');
  const addr = `<span class="addr">${MASK[lang]}</span>`;
  const p1 = c.p1.length === 1 ? c.p1[0] : c.p1[0] + addr + c.p1[1];
  const icon = { ready: I.mail, error: I.mail, confirmed: I.check, expired: I.clock, already: I.check, invalid: I.x }[state];
  const bad = state === 'invalid' || state === 'expired';
  const err = state === 'error' ? `<div class="alert" role="alert">${I.alert}<span>${t[kind].error.msg}</span></div>` : '';
  let actions = '';
  if (state === 'ready' || state === 'error') {
    actions = `<form method="post" action="${isConfirm ? '/newsletter/confirmer' : '/newsletter/desinscription'}" class="actions"><input type="hidden" name="token" value="[token]">
      <button class="btn" type="submit">${c.btn}</button>${isConfirm ? '' : `<a class="link" href="/">${c.sec}</a>`}</form>`;
  } else if (state === 'expired') {
    actions = `<form method="post" action="/newsletter/renvoyer" class="actions"><input type="hidden" name="token" value="[token]"><button class="btn" type="submit">${c.btn}</button><a class="link" href="/">${c.sec}</a></form>`;
  } else {
    actions = `<div class="actions"><a class="btn ghost" href="/">${c.btn}</a></div>`;
  }
  const hint = c.hint ? `<p class="hint"><strong style="font-weight:500;color:var(--text)">${c.hintT}.</strong> ${c.hint}</p>` : '';
  const recap = isConfirm && (state === 'ready' || state === 'error')
    ? `<aside class="recap" aria-labelledby="rc"><h2 id="rc">${t.recapT}</h2><dl>
        <div><dt>${t.recapEmail}</dt><dd>${MASK[lang]}</dd></div>
        <div><dt>${t.recapConsent}</dt><dd class="quote">${t.consentTxt}</dd></div>
        <div><dt>${t.recapDate}</dt><dd>${t.date}</dd></div></dl><p class="hint">${t.recapNote}</p></aside>` : '';
  const live = state === 'ready' || state === 'error' ? '' : ' role="status"';
  return `<!doctype html><html lang="${lang}" class="${theme === 'day' ? 'day' : ''}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${c.h} | ${t.brand}</title><meta name="robots" content="noindex,nofollow">${FONTS}
<link rel="stylesheet" href="../assets/tokens.css"><link rel="stylesheet" href="../assets/public.css"></head><body>
<div class="shell"><header class="topbar"><a class="wordmark" href="/">${t.brand}</a><button class="theme-btn" type="button" aria-label="${t.theme}">${theme === 'day' ? I.sun : I.moon}</button></header>
<main class="page"><section${live} class="rise" aria-labelledby="h">
<p class="eyebrow">${t[kind].eyebrow}</p><div class="status-ico${bad ? ' bad' : ''}">${icon}</div><h1 id="h">${c.h}</h1>
<p class="lede">${p1}</p><p class="lede">${c.p2}</p>${err}${actions}${hint}
</section>${recap}</main>
<footer class="foot"><span>© 2026 ${t.brand}</span><a href="/mentions-legales">${t.legal}</a><a href="/politique-de-confidentialite">${t.privacy}</a></footer></div></body></html>`;
}
const pubStates = { confirm: ['ready', 'error', 'confirmed', 'expired', 'already'], unsub: ['ready', 'error', 'confirmed', 'invalid', 'already'] };
const manifest = [];
for (const kind of ['confirm', 'unsub'])
  for (const state of pubStates[kind])
    for (const lang of ['fr', 'en'])
      for (const theme of ['night', 'day']) {
        const f = `public/${kind}-${state}-${lang}-${theme}.html`;
        write(f, pubPage({ kind, state, lang, theme }));
        manifest.push({ group: kind === 'confirm' ? 'Public: confirm subscription' : 'Public: unsubscribe', file: f, label: `${state} / ${lang} / ${theme}`, type: 'page' });
      }

/* ------------------------------------------------------------------- EMAIL */
const E = {
  fr: {
    lang: 'fr', brand: 'Ghjulianu Codani', role: 'Photographe',
    pre: 'Un dernier clic pour finaliser votre inscription.',
    h: 'Confirmez votre inscription',
    p1: 'Vous (ou quelqu’un utilisant cette adresse) avez demandé à recevoir la newsletter de Ghjulianu Codani : nouveaux albums et actualités, quelques fois par an.',
    p2: 'Pour finaliser, appuyez sur le bouton. Le lien est valable 48 heures.',
    btn: 'Confirmer mon inscription',
    alt: 'Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :',
    ignore: 'Ce n’est pas vous ? Ignorez cet email : sans confirmation, vous ne serez pas inscrit(e) et nous ne vous écrirons pas.',
    ident: 'Ghjulianu Codani, photographe · [Adresse postale de l’éditeur] · contact@example.org',
    priv: 'Politique de confidentialité', legal: 'Mentions légales',
    why: 'Vous recevez cet email car cette adresse a été saisie sur ghjulianucodani.com.',
    nlH: 'Nouvel album : Lumières d’automne', nlP: 'Quelques lignes d’introduction de la newsletter, rédigées dans le tableau de bord Resend. Texte d’exemple uniquement.', nlBtn: 'Voir l’album',
    nlFootWhy: 'Vous recevez cette newsletter parce que vous vous êtes inscrit(e) avec l’adresse m***@example.org (consentement du 12 oct. 2026).',
    unsub: 'Se désinscrire en un clic', unsubNote: 'Vous pouvez aussi utiliser le bouton « Se désinscrire » de votre application mail.',
    subjC: 'Confirmez votre inscription à la newsletter', subjN: 'Lumières d’automne, le nouvel album',
    imgAlt: 'Emplacement photo d’exemple',
  },
  en: {
    lang: 'en', brand: 'Ghjulianu Codani', role: 'Photographer',
    pre: 'One last click to finish subscribing.',
    h: 'Confirm your subscription',
    p1: 'You (or someone using this address) asked to receive the Ghjulianu Codani newsletter: new albums and news, a few times a year.',
    p2: 'To finish, press the button. The link is valid for 48 hours.',
    btn: 'Confirm my subscription',
    alt: 'Button not working? Copy this link into your browser:',
    ignore: 'Not you? Ignore this email: without confirmation you will not be subscribed and we will not write to you.',
    ident: 'Ghjulianu Codani, photographer · [Publisher postal address] · contact@example.org',
    priv: 'Privacy policy', legal: 'Legal notice',
    why: 'You are receiving this email because this address was entered on ghjulianucodani.com.',
    nlH: 'New album: Autumn Light', nlP: 'A few intro lines of the newsletter, written in the Resend dashboard. Sample text only.', nlBtn: 'View the album',
    nlFootWhy: 'You receive this newsletter because you subscribed with m***@example.org (consent given on Oct 12, 2026).',
    unsub: 'Unsubscribe in one click', unsubNote: 'You can also use the “Unsubscribe” button in your mail app.',
    subjC: 'Confirm your newsletter subscription', subjN: 'Autumn Light, the new album',
    imgAlt: 'Sample photo placeholder',
  },
};
const emailCss = `
body{margin:0;padding:0;background:#f0efec;-webkit-text-size-adjust:100%}
.wrap{background:#f0efec;padding:24px 12px}
.card{width:100%;max-width:600px;margin:0 auto;background:#fafafa;color:#1a1a1a;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6}
.pad{padding:32px 36px}
.brand{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;color:#1a1a1a;margin:0}
.role{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#5c5c5c;margin:2px 0 0}
h1{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:normal;font-size:34px;line-height:1.15;margin:0 0 16px;color:#1a1a1a}
p{margin:0 0 16px}
.muted{color:#5c5c5c;font-size:14px;line-height:1.55}
.btn{display:inline-block;background:#1a1a1a;color:#fafafa !important;text-decoration:none;font-size:14px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;padding:16px 28px;line-height:16px}
.url{word-break:break-all;color:#7a5200;font-size:14px}
a{color:#7a5200}
.hr{border:0;border-top:1px solid #d9d7d2;margin:0}
.foot{background:#f0efec;padding:24px 36px;color:#5c5c5c;font-size:14px;line-height:1.6}
.foot a{color:#5c5c5c;text-decoration:underline}
.unsub{display:inline-block;color:#1a1a1a !important;font-weight:bold;text-decoration:underline;padding:13px 0;min-height:44px;line-height:18px}
.ph{height:220px;background:#d9d7d2;color:#5c5c5c;font-size:14px;text-align:center;line-height:220px}
.pre{display:none;max-height:0;overflow:hidden;opacity:0;color:transparent}
@media (max-width:480px){.pad{padding:24px 20px}.foot{padding:20px}h1{font-size:30px}.btn{display:block;text-align:center}}
/* Dark mode: real clients via media query; static previews force it with class .dark on <html> */
@media (prefers-color-scheme:dark){
 body,.wrap{background:#050505}.card{background:#0e0e0e;color:#E8E4DC}h1,.brand{color:#E8E4DC}
 .muted,.role,.foot,.foot a{color:#a3a39c}.btn{background:#E8E4DC;color:#080808 !important}
 a,.url{color:#c8a97e}.hr{border-color:#2a2a28}.foot{background:#080808}.unsub{color:#E8E4DC !important}.ph{background:#1d1d1b;color:#a3a39c}}
html.dark body,html.dark .wrap{background:#050505}html.dark .card{background:#0e0e0e;color:#E8E4DC}html.dark h1,html.dark .brand{color:#E8E4DC}
html.dark .muted,html.dark .role,html.dark .foot,html.dark .foot a{color:#a3a39c}html.dark .btn{background:#E8E4DC;color:#080808 !important}
html.dark a,html.dark .url{color:#c8a97e}html.dark .hr{border-color:#2a2a28}html.dark .foot{background:#080808}html.dark .unsub{color:#E8E4DC !important}html.dark .ph{background:#1d1d1b;color:#a3a39c}`;
function emailShell(lang, theme, title, inner) {
  return `<!doctype html><html lang="${lang}" class="${theme === 'dark' ? 'dark' : ''}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${title}</title><style>${emailCss}</style></head><body><div class="wrap">${inner}</div></body></html>`;
}
function confirmEmail(lang, theme) {
  const e = E[lang];
  return emailShell(lang, theme, e.subjC, `<div class="pre">${e.pre}</div><table class="card" role="presentation" cellpadding="0" cellspacing="0" width="600"><tr><td class="pad">
<p class="brand">${e.brand}</p><p class="role">${e.role}</p></td></tr><tr><td><hr class="hr"></td></tr><tr><td class="pad">
<h1>${e.h}</h1><p>${e.p1}</p><p>${e.p2}</p><p style="margin:24px 0"><a class="btn" href="https://ghjulianucodani.com/newsletter/confirmer?t=[token]">${e.btn}</a></p>
<p class="muted">${e.alt}<br><span class="url">https://ghjulianucodani.com/newsletter/confirmer?t=[token]</span></p><p class="muted">${e.ignore}</p></td></tr>
<tr><td class="foot"><p style="margin:0 0 8px">${e.why}</p><p style="margin:0 0 8px">${e.ident}</p><p style="margin:0"><a href="https://ghjulianucodani.com/politique-de-confidentialite">${e.priv}</a> · <a href="https://ghjulianucodani.com/mentions-legales">${e.legal}</a></p></td></tr></table>`);
}
function newsletterEmail(lang, theme) {
  const e = E[lang];
  return emailShell(lang, theme, e.subjN, `<div class="pre">${e.nlP}</div><table class="card" role="presentation" cellpadding="0" cellspacing="0" width="600"><tr><td class="pad">
<p class="brand">${e.brand}</p><p class="role">${e.role}</p></td></tr><tr><td class="ph" role="img" aria-label="${e.imgAlt}">${e.imgAlt}</td></tr><tr><td class="pad">
<h1>${e.nlH}</h1><p>${e.nlP}</p><p style="margin:24px 0 0"><a class="btn" href="https://ghjulianucodani.com/albums/exemple">${e.nlBtn}</a></p></td></tr>
<tr><td class="foot"><p style="margin:0 0 4px">${e.nlFootWhy}</p><p style="margin:0 0 4px"><a class="unsub" href="https://ghjulianucodani.com/newsletter/desinscription?s=[signature]">${e.unsub}</a></p>
<p style="margin:0 0 12px">${e.unsubNote}</p><p style="margin:0 0 8px">${e.ident}</p><p style="margin:0"><a href="https://ghjulianucodani.com/politique-de-confidentialite">${e.priv}</a> · <a href="https://ghjulianucodani.com/mentions-legales">${e.legal}</a></p></td></tr></table>`);
}
for (const lang of ['fr', 'en']) for (const theme of ['light', 'dark']) {
  let f = `email/confirm-${lang}-${theme}.html`; write(f, confirmEmail(lang, theme));
  manifest.push({ group: 'Email: double opt-in confirmation', file: f, label: `${lang} / ${theme}`, type: 'email' });
  f = `email/newsletter-footer-${lang}-${theme}.html`; write(f, newsletterEmail(lang, theme));
  manifest.push({ group: 'Email: newsletter with footer', file: f, label: `${lang} / ${theme}`, type: 'email' });
}

/* ------------------------------------------------------------------- ADMIN */
const ST = {
  confirmed: ['Confirmé', I.check], pending: ['En attente', I.clock], unsubscribed: ['Désinscrit', I.minus], suppressed: ['Supprimé', I.ban],
};
const ROWS = [
  ['a***@example.org', 'confirmed', 'FR', 'Téléchargement', '12 oct. 2026', ''],
  ['c***@example.net', 'confirmed', 'EN', 'Téléchargement', '11 oct. 2026', ''],
  ['m***@example.com', 'pending', 'FR', 'Téléchargement', '7 nov. 2026', 'Expire dans 31 h'],
  ['s***@example.org', 'confirmed', 'FR', 'Pied de page', '3 oct. 2026', ''],
  ['l***@example.net', 'suppressed', 'FR', 'Téléchargement', '28 sept. 2026', 'Rebond définitif'],
  ['j***@example.org', 'unsubscribed', 'EN', 'Téléchargement', '21 sept. 2026', 'Désinscrit le 2 nov. 2026'],
  ['t***@example.com', 'confirmed', 'FR', 'Téléchargement', '19 sept. 2026', ''],
  ['p***@example.org', 'pending', 'EN', 'Pied de page', '6 nov. 2026', 'Expire dans 4 h'],
  ['d***@example.net', 'suppressed', 'EN', 'Téléchargement', '2 sept. 2026', 'Plainte spam'],
  ['n***@example.com', 'confirmed', 'FR', 'Téléchargement', '30 août 2026', ''],
];
const COUNTS = { all: 214, confirmed: 168, pending: 21, unsubscribed: 19, suppressed: 6 };
const badge = (s) => `<span class="badge ${s}">${ST[s][1]}${ST[s][0]}</span>`;
const row = (r, confirming) => {
  const [em, s, lang, src, date, note] = r;
  const main = `<tr><td class="email" data-label="Email">${em}</td><td class="col-status">${badge(s)}${note ? `<span class="sub-note">${note}</span>` : ''}</td>
<td class="muted col-lang">${lang}</td><td class="muted col-src">${src}</td><td class="muted col-date"><span class="mlang">${lang} · </span>${date}</td><td class="muted col-ver">v1</td>
<td class="act"><button class="del" type="button" aria-label="Supprimer ${em}">${I.trash}<span>Supprimer</span></button></td></tr>`;
  if (!confirming) return main;
  return `<tr class="confirm-row"><td colspan="7" role="alertdialog" aria-labelledby="cd" aria-describedby="cdd"><div class="confirm-box"><div id="cdd"><p id="cd"><strong>Supprimer définitivement ${em} ?</strong></p>
<p>L’adresse sera effacée de l’abonnement, des demandes de téléchargement et des événements. Cette action est irréversible.</p></div>
<div class="btns"><button class="btn-a ghost" type="button" autofocus>Annuler</button><button class="btn-a danger" type="button">${I.trash}Supprimer définitivement</button></div></div></td></tr>`;
};
function adminPage({ title, filter = 'all', q = '', rows = ROWS, confirmIdx = -1, empty = false, noresults = false, toast = false, total = COUNTS.all, exportN = COUNTS.confirmed, exporting = false }) {
  const tabs = [['all', 'Tous', COUNTS.all], ['confirmed', 'Confirmés', COUNTS.confirmed], ['pending', 'En attente', COUNTS.pending], ['unsubscribed', 'Désinscrits', COUNTS.unsubscribed], ['suppressed', 'Supprimés', COUNTS.suppressed]];
  const c = (k) => (empty ? 0 : tabs.find((t) => t[0] === k)[2]);
  const exportBtn = exportN > 0
    ? `<button class="btn-a" type="button"${exporting ? ' aria-busy="true"' : ''}>${I.dl}${exporting ? 'Préparation…' : `Exporter CSV (${exportN})`}</button>`
    : `<button class="btn-a" type="button" disabled aria-describedby="xn">${I.dl}Exporter CSV (0)</button>`;
  const exportNote = exportN > 0 ? 'Abonnés confirmés uniquement. Excel : UTF-8, séparateur point-virgule.' : '<span id="xn">Aucun abonné confirmé à exporter.</span>';
  let body;
  if (empty) {
    body = `<div class="empty"><h2>Aucun abonné pour l’instant</h2><p>Les personnes qui cochent la case newsletter en demandant des photos apparaissent ici, d’abord « en attente », puis « confirmé » dès qu’elles appuient sur le bouton de l’email.</p>
<ol><li>Un visiteur demande des photos et coche la case newsletter (facultative).</li><li>Il reçoit un email de confirmation, valable 48 h.</li><li>Il devient abonné quand il appuie sur le bouton.</li></ol></div>`;
  } else if (noresults) {
    body = `<div class="empty"><h2>Aucun résultat</h2><p>Aucun abonné ne correspond à « ${q} » dans « ${tabs.find((t) => t[0] === filter)[1]} ».</p><button class="btn-a ghost" type="button">Effacer la recherche et le filtre</button></div>`;
  } else {
    body = `<table class="subs"><caption class="sr-only">Abonnés à la newsletter</caption><thead><tr><th scope="col">Email</th><th scope="col">Statut</th><th scope="col" class="col-lang">Langue</th><th scope="col" class="col-src">Source</th><th scope="col" class="col-date">Consentement</th><th scope="col" class="col-ver">Texte</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
<tbody>${rows.map((r, i) => row(r, i === confirmIdx)).join('')}</tbody></table>
<div class="pager"><span class="count-line">${rows.length} sur ${total} abonnés · page 1 sur ${Math.ceil(total / 25)}</span><div class="btns"><button class="btn-a ghost" type="button" disabled>Précédent</button><button class="btn-a ghost" type="button">Suivant</button></div></div>`;
  }
  const nav = ['Dashboard', 'Albums', 'Portfolio', 'Catégories', 'Newsletter'];
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Admin</title>${FONTS}
<link rel="stylesheet" href="../assets/tokens.css"><link rel="stylesheet" href="../assets/admin.css"><style>.mlang{display:none}@media(max-width:820px){.mlang{display:inline}}</style></head><body>
<header class="a-head"><div class="row1"><div class="a-left"><span class="a-brand">Admin</span><nav class="a-nav" aria-label="Administration">${nav.map((n) => `<a href="#"${n === 'Newsletter' ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav></div>
<div class="a-tools"><a href="/" target="_blank" rel="noopener">Voir le site ↗</a><button type="button">Déconnexion</button></div></div></header>
<main class="a-main"><div class="a-title"><div><p class="a-sub">Newsletter</p><h1 class="a-h1">Abonnés</h1></div><div>${exportBtn}<p class="export-note">${exportNote}</p></div></div>
<nav class="filters" aria-label="Filtrer par statut">${tabs.map(([k, l]) => `<a href="#" ${filter === k ? 'aria-current="true"' : ''}><span class="n">${c(k)}</span><span class="l">${l}</span></a>`).join('')}</nav>
<form class="search-row" role="search" aria-label="Rechercher un abonné"><div class="field"><label class="sr-only" for="q">Rechercher une adresse email</label>${I.search}<input id="q" type="search" placeholder="Rechercher une adresse email" value="${q}" autocomplete="off">${q ? `<button class="clear" type="button" aria-label="Effacer la recherche">${I.close}</button>` : ''}</div>
${empty ? '' : `<span class="count-line" role="status" aria-live="polite">${noresults ? '0 résultat' : q || filter !== 'all' ? `${rows.length} résultat${rows.length > 1 ? 's' : ''}` : ''}</span>`}</form>
${body}</main><script>document.querySelector('.a-nav [aria-current]').scrollIntoView({inline:'center',block:'nearest'})</script>${toast ? `<div class="toast" role="status"><span class="t">${I.check}Abonné supprimé : s***@example.org</span><button type="button">Fermer</button></div>` : ''}</body></html>`;
}
const pend = ROWS.filter((r) => r[1] === 'pending');
const adm = [
  ['list', 'Default list', { title: 'Abonnés' }],
  ['filter-search', 'Filter pending + search', { title: 'Abonnés', filter: 'pending', q: 'example', rows: [...pend, ['b***@example.org', 'pending', 'FR', 'Téléchargement', '6 nov. 2026', 'Expire dans 22 h']], total: 21 }],
  ['delete-confirm', 'Delete confirmation (inline)', { title: 'Abonnés', confirmIdx: 2 }],
  ['deleted', 'Deleted, toast', { title: 'Abonnés', rows: ROWS.filter((_, i) => i !== 3), total: 213, toast: true }],
  ['exporting', 'Export in progress', { title: 'Abonnés', exporting: true }],
  ['noresults', 'Search without result', { title: 'Abonnés', filter: 'confirmed', q: 'zzz', noresults: true }],
  ['empty', 'Empty (no subscriber)', { title: 'Abonnés', empty: true, exportN: 0, total: 0 }],
];
for (const [k, label, o] of adm) {
  const f = `admin/${k}.html`; write(f, adminPage(o));
  manifest.push({ group: 'Admin: /admin/newsletter', file: f, label, type: 'admin' });
}
write('manifest.json', JSON.stringify(manifest, null, 1));
console.log(manifest.length, 'pages');
