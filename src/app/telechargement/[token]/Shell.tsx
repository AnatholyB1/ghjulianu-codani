import Link from 'next/link';
import './telechargement.css';
import ThemeRoot from './ThemeRoot';
import { COPY, type Lang } from './copy';

/** Header + main + footer of the delivery pages (the site chrome is hidden for this route, see SiteShell). */
export default function Shell({
  lang,
  langHref,
  children,
}: {
  lang: Lang;
  /** Path (no query) used by the FR/EN switch; omitted on pages where the switch makes no sense. */
  langHref?: string;
  children: React.ReactNode;
}) {
  const c = COPY[lang];
  const supportEmail = process.env.SUPPORT_EMAIL;
  const supportHref = supportEmail ? `mailto:${supportEmail}` : '/contact';
  return (
    <ThemeRoot lang={lang}>
      <header className="shell top">
        <Link className="brand" href="/" rel="noopener noreferrer">
          {c.brand}
        </Link>
        {langHref && (
          <nav className="lang" aria-label={c.langNav}>
            <a href={`${langHref}?lang=fr`} lang="fr" hrefLang="fr" aria-current={lang === 'fr' ? 'true' : undefined} rel="nofollow noreferrer">FR</a>
            <a href={`${langHref}?lang=en`} lang="en" hrefLang="en" aria-current={lang === 'en' ? 'true' : undefined} rel="nofollow noreferrer">EN</a>
          </nav>
        )}
      </header>
      <main className="shell">{children}</main>
      <footer className="foot">
        <div className="shell">
          <p>{c.footNote}</p>
          <nav>
            <Link href="/politique-de-confidentialite" rel="noopener noreferrer">{c.privacy}</Link>
            <a href={supportHref} rel="noopener noreferrer">{c.support}</a>
            <Link href="/" rel="noopener noreferrer">{c.back}</Link>
          </nav>
        </div>
      </footer>
    </ThemeRoot>
  );
}
