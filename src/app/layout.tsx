import type { Metadata } from 'next';
import { Cormorant_Garamond, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navbar    from '@/components/Navbar';
import BottomBar from '@/components/BottomBar';

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

export const metadata: Metadata = {
  title: 'Ghjulianu Codani — Photographe',
  description:
    'Portfolio de Ghjulianu Codani – Shooting personnel, marques & événementiel nightlife.',
  openGraph: {
    type:   'website',
    locale: 'fr_FR',
    title:  'Ghjulianu Codani — Photographe',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${cormorant.variable} ${space.variable}`}>
        <Navbar />
        <main style={{ minHeight: '100vh', paddingTop: 'var(--navbar-h)' }}>
          {children}
        </main>
        <BottomBar />
      </body>
    </html>
  );
}
