import Link from 'next/link';
import type { ReactNode } from 'react';
import ThemeToggle from './ThemeToggle';
import { COPY, type NlLang } from '../copy';
import '../newsletter.css';

/** Shared chrome of the public newsletter pages (top bar, footer). `children` is the <main> content. */
export default function Shell({ lang, children }: { lang: NlLang; children: ReactNode }) {
  const c = COPY[lang];
  return (
    <div className="nlp" lang={lang}>
      <header className="nlp-topbar">
        <Link className="nlp-wordmark" href="/">
          Ghjulianu Codani
        </Link>
        <ThemeToggle label={c.toggle} />
      </header>
      <main className="nlp-page">{children}</main>
      <footer className="nlp-foot">
        <span>© {new Date().getFullYear()} Ghjulianu Codani</span>
        <Link href="/mentions-legales">{c.legal}</Link>
        <Link href="/politique-de-confidentialite">{c.privacy}</Link>
      </footer>
    </div>
  );
}
