/**
 * FR/EN copy of the delivery landing page (design contract section 7).
 * Kept next to the page (not in src/lib/i18n.ts): the page language is the
 * request language stored with the download request, not the site's client-side
 * language context.
 *
 * Amendment vs the contract: a "use" is a 15-minute download SESSION (D-07
 * amendment), so the cost sentences say "session" and the parts text explains
 * that all parts fit in one session.
 */
export type Lang = 'fr' | 'en';

export const COPY = {
  fr: {
    brand: 'Ghjulianu Codani',
    langNav: 'Langue',
    ready: 'Vos photos sont prêtes',
    album: 'Album',
    photos: 'Photos',
    usesLeft: 'Utilisations restantes',
    validUntil: "Valable jusqu'au",
    ofN: (n: number, max: number) => `${n} sur ${max}`,
    all: 'Tout télécharger',
    zipSub: (n: number, size: string) => `ZIP, ${n} photo${n > 1 ? 's' : ''}, ${size}`,
    note: 'Ouvrir cette page ne consomme rien. Une session de téléchargement de 15 minutes compte pour 1 utilisation : pendant ce temps, vous pouvez télécharger autant de photos et de parties que vous voulez. Pour plusieurs photos, le ZIP est le plus simple.',
    sessionOpen: (until: string) => `Session en cours jusqu'à ${until} : les téléchargements suivants ne consomment rien.`,
    gridH: 'Ou photo par photo',
    countPhotos: (n: number) => `${n} photo${n > 1 ? 's' : ''}`,
    tileAria: (i: number, n: number) => `Télécharger la photo ${i} sur ${n} (session de 15 minutes, 1 utilisation)`,
    tileAriaFree: (i: number, n: number) => `Télécharger la photo ${i} sur ${n} (session en cours, gratuit)`,
    tileAlt: (i: number, n: number) => `Photo ${i} sur ${n}`,
    more: (n: number) => `Afficher les ${n} autres`,
    partsH: (n: number) => `Tout télécharger en ${n} parties`,
    partsLede: (size: string, n: number) =>
      `Votre sélection pèse ${size}. Elle est découpée en ${n} fichiers ZIP à télécharger un par un. Téléchargées dans la même session de 15 minutes, les ${n} parties comptent pour 1 seule utilisation.`,
    partName: (i: number, n: number) => `Partie ${i} sur ${n}`,
    partInfo: (a: number, b: number, size: string) => `Photos ${a} à ${b}, ${size}`,
    download: 'Télécharger',
    partAria: (i: number, free: boolean) => `Télécharger la partie ${i} (${free ? 'session en cours, gratuit' : 'session de 15 minutes, 1 utilisation'})`,
    busy: 'Préparation…',
    again: 'Télécharger à nouveau',
    wait: 'Un autre téléchargement démarre à peine. Patientez un instant, puis cliquez à nouveau.',
    started:
      "Téléchargement lancé. Votre navigateur l'affiche dans ses téléchargements. Les grosses parties peuvent mettre quelques secondes à démarrer. Rien ne s'affiche sur cette page, c'est normal.",
    stillNothing: "Toujours rien ? Vérifiez les téléchargements de votre navigateur, puis réessayez : la session reste ouverte 15 minutes.",
    lastT: 'Dernière utilisation',
    lastB: 'Après cette session de téléchargement, ce lien ne fonctionnera plus. Choisissez « Tout télécharger » pour tout récupérer d\'un coup.',
    rateT: "Trop de téléchargements d'affilée",
    rateB: "Patientez une minute puis réessayez. Aucune utilisation n'a été consommée.",
    srvT: 'Le téléchargement a échoué',
    srvB: "Le fichier n'a pas pu être récupéré. Aucune utilisation n'a été consommée. Réessayez dans un instant.",
    expiredH: 'Ce lien a expiré',
    expiredB: (d: string) => `Il était valable jusqu'au ${d}. Par sécurité, un lien dure 48 heures.`,
    usedH: 'Ce lien est épuisé',
    usedB: (n: number) => `Les ${n} utilisations de ce lien ont été consommées. Par sécurité, un lien est limité à ${n} sessions de téléchargement.`,
    again2: 'Sélectionnez à nouveau vos photos sur le site pour recevoir un nouveau lien.',
    invalidH: 'Lien introuvable',
    invalidB: "Ce lien est incomplet, a été annulé ou n'existe plus. Vérifiez que l'adresse a été copiée en entier depuis l'e-mail.",
    invalidB2: 'Sinon, redemandez vos photos depuis le site.',
    errorH: 'Un souci de notre côté',
    errorB: "La page n'a pas pu se charger. Ouvrir cette page ne consomme jamais de téléchargement : votre lien reste valable.",
    errorB2: 'Réessayez dans un instant.',
    reask: 'Redemander mes photos',
    back: 'Retour au site',
    retry: 'Réessayer',
    footNote: 'Lien personnel : ne le partagez pas.',
    privacy: 'Confidentialité',
    support: 'Un souci ? Contactez-nous',
  },
  en: {
    brand: 'Ghjulianu Codani',
    langNav: 'Language',
    ready: 'Your photos are ready',
    album: 'Album',
    photos: 'Photos',
    usesLeft: 'Downloads left',
    validUntil: 'Valid until',
    ofN: (n: number, max: number) => `${n} of ${max}`,
    all: 'Download all',
    zipSub: (n: number, size: string) => `ZIP, ${n} photo${n > 1 ? 's' : ''}, ${size}`,
    note: 'Opening this page costs nothing. A 15-minute download session counts as 1 use: during that time you can download as many photos and parts as you like. For several photos, the ZIP is the easiest.',
    sessionOpen: (until: string) => `Session open until ${until}: further downloads cost nothing.`,
    gridH: 'Or photo by photo',
    countPhotos: (n: number) => `${n} photo${n > 1 ? 's' : ''}`,
    tileAria: (i: number, n: number) => `Download photo ${i} of ${n} (15-minute session, 1 use)`,
    tileAriaFree: (i: number, n: number) => `Download photo ${i} of ${n} (session open, free)`,
    tileAlt: (i: number, n: number) => `Photo ${i} of ${n}`,
    more: (n: number) => `Show the other ${n}`,
    partsH: (n: number) => `Download all in ${n} parts`,
    partsLede: (size: string, n: number) =>
      `Your selection weighs ${size}. It is split into ${n} ZIP files to download one by one. Downloaded within the same 15-minute session, all ${n} parts count as 1 single use.`,
    partName: (i: number, n: number) => `Part ${i} of ${n}`,
    partInfo: (a: number, b: number, size: string) => `Photos ${a} to ${b}, ${size}`,
    download: 'Download',
    partAria: (i: number, free: boolean) => `Download part ${i} (${free ? 'session open, free' : '15-minute session, 1 use'})`,
    busy: 'Preparing…',
    again: 'Download again',
    wait: 'Another download is just starting. Please wait a moment, then click again.',
    started:
      'Download started. Your browser shows it in its downloads. Large parts can take a few seconds to start. Nothing moves on this page, that is normal.',
    stillNothing: 'Still nothing? Check your browser downloads, then try again: the session stays open for 15 minutes.',
    lastT: 'Last use',
    lastB: 'After this download session the link will stop working. Choose "Download all" to get everything in one go.',
    rateT: 'Too many downloads in a row',
    rateB: 'Wait a minute, then try again. No use was consumed.',
    srvT: 'The download failed',
    srvB: 'The file could not be fetched. No use was consumed. Try again in a moment.',
    expiredH: 'This link has expired',
    expiredB: (d: string) => `It was valid until ${d}. For safety, a link lasts 48 hours.`,
    usedH: 'This link is used up',
    usedB: (n: number) => `All ${n} uses of this link have been consumed. For safety, a link is limited to ${n} download sessions.`,
    again2: 'Select your photos again on the site to receive a new link.',
    invalidH: 'Link not found',
    invalidB: 'This link is incomplete, was cancelled, or no longer exists. Check that the whole address was copied from the email.',
    invalidB2: 'Otherwise, request your photos again from the site.',
    errorH: 'Something went wrong on our side',
    errorB: 'The page could not load. Opening this page never uses a download: your link is still valid.',
    errorB2: 'Try again in a moment.',
    reask: 'Request my photos again',
    back: 'Back to the site',
    retry: 'Try again',
    footNote: 'Personal link: do not share it.',
    privacy: 'Privacy',
    support: 'Need help? Contact us',
  },
} as const;

export type Copy = (typeof COPY)[Lang];

const WD = { fr: 'fr-FR', en: 'en-GB' } as const;

/** "lundi 9 novembre, 14 h 32" / "Monday 9 November, 2:32 pm" in Europe/Paris (server-side, no countdown). */
export function formatWhen(d: Date, lang: Lang, joiner: ',' | 'at' = ','): string {
  const tz = 'Europe/Paris';
  const date = new Intl.DateTimeFormat(WD[lang], { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(d);
  const p = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    hour: 'numeric', minute: '2-digit', hour12: lang === 'en', timeZone: tz,
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  const time = lang === 'fr'
    ? `${get('hour')} h ${get('minute')}`
    : `${get('hour')}:${get('minute')} ${get('dayPeriod').toLowerCase()}`;
  const sep = joiner === 'at' ? (lang === 'fr' ? ' à ' : ' at ') : ', ';
  return `${date}${sep}${time}`;
}

export function formatTime(d: Date, lang: Lang): string {
  const s = formatWhen(d, lang);
  return s.slice(s.lastIndexOf(', ') + 2);
}

export function formatSize(bytes: number, lang: Lang, approx = false): string {
  const mb = bytes / (1024 * 1024);
  const unit = lang === 'fr' ? 'Mo' : 'MB';
  const n = mb >= 10 ? Math.round(mb).toString() : mb.toFixed(1);
  return `${approx ? '≈ ' : ''}${lang === 'fr' ? n.replace('.', ',') : n} ${unit}`;
}
