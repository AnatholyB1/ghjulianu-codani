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
  },
  en: {
    sender: 'Ghjulianu Codani — Photographer, Paris & Corsica',
    why: 'You are receiving this email following a request made on ghjulianucodani.com.',
    privacy: 'Privacy policy',
  },
} as const;

const font = "Georgia, 'Times New Roman', serif";

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
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f4f1ec', margin: 0, padding: '24px 0', fontFamily: font, color: '#1a1a1a' }}>
        <Container style={{ maxWidth: '560px', backgroundColor: '#ffffff', padding: '32px 28px' }}>
          <Text style={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 24px', color: '#6b6b6b' }}>
            Ghjulianu Codani
          </Text>
          <Section>{children}</Section>
          <Hr style={{ borderColor: '#e5e0d8', margin: '32px 0 16px' }} />
          <Text style={{ fontSize: '12px', lineHeight: '18px', color: '#6b6b6b', margin: '0 0 8px' }}>{c.sender}</Text>
          <Text style={{ fontSize: '12px', lineHeight: '18px', color: '#6b6b6b', margin: '0 0 8px' }}>{c.why}</Text>
          {footerExtra}
          <Text style={{ fontSize: '12px', lineHeight: '18px', margin: 0 }}>
            <Link href={`${siteUrl()}/politique-de-confidentialite`} style={{ color: '#6b6b6b' }}>
              {c.privacy}
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
