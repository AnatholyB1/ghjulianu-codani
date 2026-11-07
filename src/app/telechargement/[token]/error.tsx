'use client';

import Link from 'next/link';
import './telechargement.css';
import ThemeRoot from './ThemeRoot';
import { COPY, type Lang } from './copy';

/** Page error (landing GET threw). Opening the page never consumes anything. */
export default function DeliveryError({ reset }: { error: Error; reset: () => void }) {
  const lang: Lang = typeof navigator !== 'undefined' && /^en/i.test(navigator.language) ? 'en' : 'fr';
  const c = COPY[lang];
  return (
    <ThemeRoot lang={lang}>
      <header className="shell top">
        <Link className="brand" href="/" rel="noopener noreferrer">{c.brand}</Link>
      </header>
      <main className="shell">
        <div className="state">
          <div className="body rise">
            <h1>{c.errorH}</h1>
            <p className="lede">{c.errorB}</p>
            <p className="lede" style={{ marginTop: 'var(--s-3)' }}>{c.errorB2}</p>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => reset()}>{c.retry}</button>
              <Link className="btn btn-ghost" href="/" rel="noopener noreferrer">{c.back}</Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="foot"><div className="shell"><p>{c.footNote}</p></div></footer>
    </ThemeRoot>
  );
}
