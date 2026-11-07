import 'server-only';
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components';
import type { EmailLang } from '../layout';

export interface DownloadEmailProps {
  lang: EmailLang;
  link: string;
  photoCount: number;
  albumTitle?: string | null;
  /** Expiry, pre-formatted for the recipient's language (Europe/Paris). */
  expiresLabel: string;
  siteUrl: string;
  /** LCEN publisher postal address (env PUBLISHER_ADDRESS). Omitted when unset. */
  publisherAddress?: string | null;
}

const T = {
  fr: {
    subject: 'Vos photos de Ghjulianu Codani sont prêtes',
    preview: 'Votre lien est valable 48 h et peut être utilisé 3 fois.',
    h1: 'Vos photos sont prêtes',
    hello: 'Bonjour,',
    asked: (n: number, album?: string | null) =>
      `vous avez demandé à télécharger ${n === 1 ? '1 photo' : `${n} photos`}${album ? ` de l’album « ${album} »` : ''}. Voici votre lien personnel.`,
    cta: 'Télécharger mes photos',
    validity: 'Validité',
    validityV: (d: string) => `48 heures (jusqu’au ${d})`,
    uses: 'Utilisations',
    usesV: '3 téléchargements maximum',
    content: 'Contenu',
    contentV: (n: number) => `${n === 1 ? '1 photo' : `${n} photos`}, haute qualité`,
    broken: 'Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :',
    ignore: 'Vous n’êtes pas à l’origine de cette demande ? Ignorez simplement cet email : le lien expirera de lui-même.',
    only: 'Ce message concerne uniquement votre demande de téléchargement.',
    sender: 'Ghjulianu Codani, Photographe, Paris et Corse.',
    privacy: 'Politique de confidentialité',
  },
  en: {
    subject: 'Your Ghjulianu Codani photos are ready',
    preview: 'Your link is valid for 48 h and can be used 3 times.',
    h1: 'Your photos are ready',
    hello: 'Hello,',
    asked: (n: number, album?: string | null) =>
      `you asked to download ${n === 1 ? '1 photo' : `${n} photos`}${album ? ` from the album “${album}”` : ''}. Here is your personal link.`,
    cta: 'Download my photos',
    validity: 'Valid for',
    validityV: (d: string) => `48 hours (until ${d})`,
    uses: 'Uses',
    usesV: '3 downloads maximum',
    content: 'Contents',
    contentV: (n: number) => `${n === 1 ? '1 photo' : `${n} photos`}, full quality`,
    broken: 'The button does not work? Copy this link into your browser:',
    ignore: 'You did not make this request? Simply ignore this email: the link will expire on its own.',
    only: 'This message only relates to your download request.',
    sender: 'Ghjulianu Codani, Photographer, Paris and Corsica.',
    privacy: 'Privacy policy',
  },
} as const;

export function downloadEmailSubject(lang: EmailLang): string {
  return T[lang].subject;
}

/** Plain-text alternative (deliverability + accessibility). */
export function downloadEmailText(p: DownloadEmailProps): string {
  const t = T[p.lang];
  return [
    t.hello,
    '',
    t.asked(p.photoCount, p.albumTitle),
    '',
    `${t.cta}: ${p.link}`,
    '',
    `${t.validity}: ${t.validityV(p.expiresLabel)}`,
    `${t.uses}: ${t.usesV}`,
    `${t.content}: ${t.contentV(p.photoCount)}`,
    '',
    t.ignore,
    '',
    '--',
    t.only,
    t.sender,
    ...(p.publisherAddress ? [p.publisherAddress] : []),
    `${t.privacy}: ${p.siteUrl}/politique-de-confidentialite`,
  ].join('\n');
}

const FONT_UI = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_DISPLAY = "Georgia, 'Times New Roman', serif";

/* Light by default (inline). The dark scheme is applied through the media query in <Head>,
   which targets the class names below; clients that ignore it keep the light version. */
const css = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .em-outer { background-color: #050505 !important; }
  .em-card { background-color: #0f0f0f !important; border-color: #262624 !important; }
  .em-tx { color: #E8E4DC !important; }
  .em-mu { color: #a8a8a0 !important; }
  .em-ac { color: #c8a97e !important; }
  .em-ln { border-color: #262624 !important; }
}
@media (max-width: 480px) {
  .em-card { padding: 32px 20px !important; }
  .em-h1 { font-size: 30px !important; }
  .em-foot { padding: 20px !important; }
}
`;

export default function DownloadLinkEmail(p: DownloadEmailProps) {
  const t = T[p.lang];
  const row = (label: string, value: string) => (
    <tr>
      <td className="em-mu em-ln" style={{ padding: '10px 12px 10px 0', borderTop: '1px solid #e4dfd3', fontSize: 14, color: '#5c5c5c', width: '34%', verticalAlign: 'top' }}>{label}</td>
      <td className="em-tx em-ln" style={{ padding: '10px 0', borderTop: '1px solid #e4dfd3', fontSize: 14, color: '#1a1a1a', verticalAlign: 'top' }}>{value}</td>
    </tr>
  );
  return (
    <Html lang={p.lang}>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{css}</style>
      </Head>
      <Preview>{t.preview}</Preview>
      <Body className="em-outer" style={{ margin: 0, padding: 0, backgroundColor: '#f1ede4', fontFamily: FONT_UI, fontSize: 16, lineHeight: '1.6', color: '#1a1a1a' }}>
        <Container style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <Section className="em-card" role="article" style={{ backgroundColor: '#ffffff', border: '1px solid #e4dfd3', padding: '40px 32px' }}>
            <Text className="em-mu" style={{ fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5c5c5c', margin: '0 0 32px' }}>Ghjulianu Codani</Text>
            <Text className="em-tx em-h1" style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontWeight: 400, fontSize: 36, lineHeight: '1.15', margin: '0 0 16px', color: '#1a1a1a' }}>{t.h1}</Text>
            <Text className="em-tx" style={{ margin: '0 0 16px', color: '#1a1a1a' }}>
              {t.hello} {t.asked(p.photoCount, p.albumTitle)}
            </Text>
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '24px 0' }}>
              <tbody>
                <tr>
                  <td align="center" style={{ backgroundColor: '#c8a97e', borderRadius: 2 }}>
                    <Link href={p.link} style={{ display: 'block', padding: '16px 24px', minHeight: 48, boxSizing: 'border-box', textAlign: 'center', color: '#080808', textDecoration: 'none', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em', fontFamily: FONT_UI }}>
                      {t.cta}
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', margin: '8px 0 24px' }}>
              <tbody>
                {row(t.validity, t.validityV(p.expiresLabel))}
                {row(t.uses, t.usesV)}
                {row(t.content, t.contentV(p.photoCount))}
              </tbody>
            </table>
            <Text className="em-mu" style={{ fontSize: 14, color: '#5c5c5c', margin: '0 0 16px' }}>{t.broken}</Text>
            <Text className="em-ac" style={{ fontSize: 14, wordBreak: 'break-all', color: '#7a5200', margin: '0 0 16px' }}>{p.link}</Text>
            <Text className="em-mu" style={{ fontSize: 14, color: '#5c5c5c', margin: 0 }}>{t.ignore}</Text>
          </Section>
          <Section className="em-foot" style={{ padding: '24px 32px' }}>
            <Text className="em-mu" style={{ fontSize: 14, color: '#5c5c5c', margin: '0 0 8px', lineHeight: '1.6' }}>{t.only}</Text>
            <Text className="em-mu" style={{ fontSize: 14, color: '#5c5c5c', margin: '0 0 8px', lineHeight: '1.6' }}>
              {t.sender}
              {p.publisherAddress ? (<><br />{p.publisherAddress}</>) : null}
            </Text>
            <Text style={{ fontSize: 14, margin: 0 }}>
              <Link className="em-ac" href={`${p.siteUrl}/politique-de-confidentialite`} style={{ color: '#7a5200' }}>{t.privacy}</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
