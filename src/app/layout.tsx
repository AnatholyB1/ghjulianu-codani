import type { Metadata } from 'next';
import { Cormorant_Garamond, Space_Grotesk } from 'next/font/google';
import './globals.css';
import SiteShell from '@/components/SiteShell';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600'],
  style:    ['normal', 'italic'],
  display:  'swap',
});

const space = Space_Grotesk({
  variable: '--font-space',
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600'],
  display:  'swap',
});

export const viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ghjulianucodani.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default:  'Ghjulianu Codani — Photographe',
    template: '%s — Ghjulianu Codani',
  },
  description:
    'Portfolio de Ghjulianu Codani – Photographe basé à Paris. Shooting personnel, communication de marques & événementiel nightlife.',
  keywords: [
    'photographe paris',
    'photographe nightlife',
    'shooting personnel paris',
    'photographe événementiel',
    'portfolio photographe',
    'ghjulianu codani',
  ],
  authors:   [{ name: 'Ghjulianu Codani', url: BASE_URL }],
  creator:   'Ghjulianu Codani',
  publisher: 'Ghjulianu Codani',

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    type:        'website',
    locale:      'fr_FR',
    url:         BASE_URL,
    siteName:    'Ghjulianu Codani — Photographe',
    title:       'Ghjulianu Codani — Photographe',
    description: 'Photographe basé à Paris — Shooting personnel, marques & événementiel nightlife.',
    images: [
      {
        url:    '/opengraph-image',
        width:  1200,
        height: 630,
        alt:    'Ghjulianu Codani — Photographe',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Ghjulianu Codani — Photographe',
    description: 'Photographe basé à Paris — Shooting personnel, marques & événementiel nightlife.',
    creator:     '@ghjulianu_codani',
    images:      ['/twitter-image'],
  },

  robots: {
    index:             true,
    follow:            true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  icons: {
    icon:  [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },

  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${cormorant.variable} ${space.variable}`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
