import 'server-only';
import type { ReactNode } from 'react';
import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from '@react-email/components';

export type EmailLang = 'fr' | 'en';

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ghjulianucodani.com').replace(/\/$/, '');
}

const COPY = {
  fr: {
    sender: 'Ghjulianu Codani — Photographe, Paris & Corse',
    why: 'Vous recevez cet email suite à une demande effectuée sur ghjulianucodani.com.',
    privacy: 'Politique de confidentialité',
    legalNotice: 'Mentions légales',
    postalPlaceholder: "[Adresse postale de l'éditeur]",
  },
  en: {
    sender: 'Ghjulianu Codani — Photographer, Paris & Corsica',
    why: 'You are receiving this email following a request made on ghjulianucodani.com.',
    privacy: 'Privacy policy',
    legalNotice: 'Legal notice',
    postalPlaceholder: '[Publisher postal address]',
  },
} as const;

/**
 * Legal identity line for email footers (publisher identification + postal address).
 * Source: env LEGAL_SENDER_NAME + LEGAL_POSTAL_ADDRESS. A missing value falls back to a
 * visible placeholder ONLY outside production; in production the missing part is omitted
 * (and warned about) so a placeholder never reaches a real recipient.
 */
export function legalIdentity(lang: EmailLang): string {
  const isProd = process.env.VERCEL_ENV === 'production';
  const name = process.env.LEGAL_SENDER_NAME?.trim();
  const address = process.env.LEGAL_POSTAL_ADDRESS?.trim();
  if (isProd && (!name || !address)) {
    console.warn('[email] LEGAL_SENDER_NAME / LEGAL_POSTAL_ADDRESS not set in production');
  }
  const parts = [name || (isProd ? '' : 'Ghjulianu Codani'), address || (isProd ? '' : COPY[lang].postalPlaceholder)];
  return parts.filter(Boolean).join(' · ');
}

const font = "Georgia, 'Times New Roman', serif";

/** Dark mode for clients that honour prefers-color-scheme (Apple Mail, Gmail iOS partly). Light stays inline. */
const DARK_CSS = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .em-bg { background-color: #0e0e0e !important; }
  .em-card { background-color: #161616 !important; }
  .em-text { color: #e8e4dc !important; }
  .em-muted { color: #a8a8a0 !important; }
  .em-rule { border-color: #2a2a28 !important; }
  .em-btn { background-color: #e8e4dc !important; color: #0e0e0e !important; }
  .em-link { color: #c8a97e !important; }
}`;

export function EmailLayout({
  lang,
  preview,
  children,
  footerExtra,
}: {
  lang: EmailLang;
  preview: string;
  children: ReactNode;
  /** e.g. an unsubscribe link block (newsletter emails) */
  footerExtra?: ReactNode;
}) {
  const c = COPY[lang];
  const legal = legalIdentity(lang);
  return (
    <Html lang={lang}>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{DARK_CSS}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="em-bg em-text"
        style={{ backgroundColor: '#f4f1ec', margin: 0, padding: '24px 0', fontFamily: font, color: '#1a1a1a' }}
      >
        <Container className="em-card" style={{ maxWidth: '560px', backgroundColor: '#ffffff', padding: '32px 28px' }}>
          <Text
            className="em-muted"
            style={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 24px', color: '#6b6b6b' }}
          >
            Ghjulianu Codani
          </Text>
          <Section>{children}</Section>
          <Hr className="em-rule" style={{ borderColor: '#e5e0d8', margin: '32px 0 16px' }} />
          <Text className="em-muted" style={{ fontSize: '12px', lineHeight: '18px', color: '#6b6b6b', margin: '0 0 8px' }}>{c.sender}</Text>
          <Text className="em-muted" style={{ fontSize: '12px', lineHeight: '18px', color: '#6b6b6b', margin: '0 0 8px' }}>{c.why}</Text>
          {footerExtra}
          {legal ? (
            <Text className="em-muted" style={{ fontSize: '12px', lineHeight: '18px', color: '#6b6b6b', margin: '0 0 8px' }}>{legal}</Text>
          ) : null}
          <Text style={{ fontSize: '12px', lineHeight: '18px', margin: 0 }}>
            <Link className="em-link" href={`${siteUrl()}/politique-de-confidentialite`} style={{ color: '#6b6b6b' }}>
              {c.privacy}
            </Link>
            {' · '}
            <Link className="em-link" href={`${siteUrl()}/mentions-legales`} style={{ color: '#6b6b6b' }}>
              {c.legalNotice}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  h1: { fontSize: '24px', fontWeight: 400, lineHeight: '32px', margin: '0 0 16px' },
  p: { fontSize: '16px', lineHeight: '26px', margin: '0 0 16px' },
  button: {
    display: 'inline-block',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 24px',
    fontSize: '14px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
};

// ---------------------------------------------------------------------------
// Newsletter helpers (phase 9). Additive: nothing above changes the P5 API.
// ---------------------------------------------------------------------------

const NL_COPY = {
  fr: {
    why: (masked: string, date: string | null) =>
      `Vous recevez cette newsletter parce que vous vous êtes inscrit(e) avec l’adresse ${masked}${date ? ` (consentement du ${date})` : ''}.`,
    unsub: 'Se désinscrire en un clic',
    hint: 'Vous pouvez aussi utiliser le bouton « Se désinscrire » de votre application mail.',
  },
  en: {
    why: (masked: string, date: string | null) =>
      `You receive this newsletter because you subscribed with ${masked}${date ? ` (consent given on ${date})` : ''}.`,
    unsub: 'Unsubscribe in one click',
    hint: 'You can also use the “Unsubscribe” button in your mail app.',
  },
} as const;

/** Public (human) unsubscribe page: GET shows a button, nothing is changed by a GET. */
export function unsubscribePageUrl(sig: string): string {
  return `${siteUrl()}/newsletter/desinscription?s=${encodeURIComponent(sig)}`;
}

/** RFC 8058 endpoint: POST `List-Unsubscribe=One-Click` unsubscribes immediately. */
export function unsubscribeOneClickUrl(sig: string): string {
  return `${siteUrl()}/api/newsletter/unsubscribe?s=${encodeURIComponent(sig)}`;
}

/**
 * Headers every newsletter email must carry (NWS-02 / AC-M5). `mailto` is optional:
 * pass SUPPORT_EMAIL-like address if you want a mailto fallback.
 */
export function listUnsubscribeHeaders(sig: string, mailto?: string): Record<string, string> {
  const targets = [`<${unsubscribeOneClickUrl(sig)}>`];
  if (mailto) targets.push(`<mailto:${mailto}?subject=unsubscribe>`);
  return {
    'List-Unsubscribe': targets.join(', '),
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/**
 * Footer block for newsletter emails: why-you-receive-this, the one-click unsubscribe link and
 * the mail-app hint. Pass as `footerExtra` of <EmailLayout>. `maskedEmail` is a masked address.
 */
export function NewsletterFooter({
  lang,
  maskedEmail,
  consentDate,
  sig,
}: {
  lang: EmailLang;
  maskedEmail: string;
  consentDate: string | null;
  sig: string;
}) {
  const c = NL_COPY[lang];
  return (
    <Section>
      <Text className="em-muted" style={{ fontSize: '14px', lineHeight: '22px', color: '#6b6b6b', margin: '0 0 8px' }}>
        {c.why(maskedEmail, consentDate)}
      </Text>
      <Text style={{ fontSize: '16px', lineHeight: '44px', margin: '0 0 4px' }}>
        <Link
          className="em-link"
          href={unsubscribePageUrl(sig)}
          style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}
        >
          {c.unsub}
        </Link>
      </Text>
      <Text className="em-muted" style={{ fontSize: '14px', lineHeight: '22px', color: '#6b6b6b', margin: '0 0 8px' }}>
        {c.hint}
      </Text>
    </Section>
  );
}
