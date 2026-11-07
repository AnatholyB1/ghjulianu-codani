import 'server-only';
import { Link, Text } from '@react-email/components';
import { EmailLayout, emailStyles, legalIdentity, siteUrl, type EmailLang } from './layout';

const COPY = {
  fr: {
    subject: 'Confirmez votre inscription à la newsletter',
    preview: 'Un dernier clic pour finaliser votre inscription.',
    h1: 'Confirmez votre inscription',
    p1: 'Vous (ou quelqu’un utilisant cette adresse) avez demandé à recevoir la newsletter de Ghjulianu Codani : nouveaux albums et actualités, quelques fois par an.',
    p2: 'Pour finaliser, appuyez sur le bouton. Le lien est valable 48 heures.',
    button: 'Confirmer mon inscription',
    fallback: 'Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :',
    notYou: 'Ce n’est pas vous ? Ignorez cet email : sans confirmation, vous ne serez pas inscrit(e) et nous ne vous écrirons pas.',
    reason: 'Vous recevez cet email car cette adresse a été saisie sur ghjulianucodani.com.',
  },
  en: {
    subject: 'Confirm your newsletter subscription',
    preview: 'One last click to finish subscribing.',
    h1: 'Confirm your subscription',
    p1: 'You (or someone using this address) asked to receive the Ghjulianu Codani newsletter: new albums and news, a few times a year.',
    p2: 'To finish, press the button. The link is valid for 48 hours.',
    button: 'Confirm my subscription',
    fallback: 'Button not working? Copy this link into your browser:',
    notYou: 'Not you? Ignore this email: without confirmation you will not be subscribed and we will not write to you.',
    reason: 'You are receiving this email because this address was entered on ghjulianucodani.com.',
  },
} as const;

export function confirmUrl(token: string): string {
  return `${siteUrl()}/newsletter/confirmer?t=${encodeURIComponent(token)}`;
}

export function confirmSubject(lang: EmailLang): string {
  return COPY[lang].subject;
}

/** Plain-text alternative (same content as the HTML part). */
export function confirmText(lang: EmailLang, token: string): string {
  const c = COPY[lang];
  const url = confirmUrl(token);
  return [
    c.h1,
    '',
    c.p1,
    c.p2,
    '',
    `${c.button}: ${url}`,
    '',
    c.notYou,
    '',
    c.reason,
    legalIdentity(lang),
    `${siteUrl()}/politique-de-confidentialite`,
    `${siteUrl()}/mentions-legales`,
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n');
}

/** Double opt-in email (NWS-01). Transactional: deliberately NO unsubscribe link/headers. */
export function ConfirmSubscriptionEmail({ lang, token }: { lang: EmailLang; token: string }) {
  const c = COPY[lang];
  const url = confirmUrl(token);
  return (
    <EmailLayout lang={lang} preview={c.preview}>
      <Text className="em-text" style={{ ...emailStyles.h1, fontStyle: 'italic' }}>{c.h1}</Text>
      <Text className="em-text" style={emailStyles.p}>{c.p1}</Text>
      <Text className="em-text" style={emailStyles.p}>{c.p2}</Text>
      <Text style={{ margin: '0 0 24px' }}>
        <Link className="em-btn" href={url} style={emailStyles.button}>
          {c.button}
        </Link>
      </Text>
      <Text className="em-muted" style={{ fontSize: '14px', lineHeight: '22px', color: '#6b6b6b', margin: '0 0 4px' }}>{c.fallback}</Text>
      <Text className="em-muted" style={{ fontSize: '14px', lineHeight: '22px', color: '#6b6b6b', margin: '0 0 16px', wordBreak: 'break-all' }}>{url}</Text>
      <Text className="em-muted" style={{ fontSize: '14px', lineHeight: '22px', color: '#6b6b6b', margin: 0 }}>{c.notYou}</Text>
    </EmailLayout>
  );
}
