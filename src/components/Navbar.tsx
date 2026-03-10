'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useT }    from '@/hooks/useT';

export default function Navbar() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const t = useT();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const NAV_LINKS = [
    { label: t.nav.portfolio, href: '/portfolio' },
    { label: t.nav.albums,    href: '/albums' },
    { label: t.nav.about,     href: '/about' },
    { label: t.nav.tarifs,    href: '/tarifs' },
    { label: t.nav.contact,   href: '/contact' },
    { label: t.nav.don,       href: '/don' },
    { label: t.nav.myAlbum,   href: '/mon-album' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <header
        style={{
          position:   'fixed',
          top: 0, left: 0, right: 0,
          zIndex:     100,
          height:     'var(--navbar-h)',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding:    '0 2rem',
          transition: 'background 0.4s ease, border-color 0.4s ease',
          background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        {/* Logo / name */}
        <Link
          href="/"
          style={{
            fontFamily:    'var(--font-cormorant), serif',
            fontSize:      '1.35rem',
            fontStyle:     'italic',
            letterSpacing: '0.04em',
            color:         'var(--text)',
            textDecoration: 'none',
            flexShrink:    0,
          }}
        >
          GHJULIANU C.
        </Link>

        {/* Desktop nav */}
        <nav
          style={{
            gap:        '2.2rem',
            alignItems: 'center',
          }}
          className="hidden-mobile"
        >
          {NAV_LINKS.map((link) => {
            const active  = pathname === link.href;
            const isCta   = link.href === '/mon-album';

            if (isCta) return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize:      '0.62rem',
                  letterSpacing: '0.14em',
                  color:         active ? '#080808' : 'var(--accent)',
                  textDecoration: 'none',
                  background:    active ? 'var(--accent)' : 'transparent',
                  border:        '1px solid var(--accent)',
                  padding:       '0.38rem 0.9rem',
                  transition:    'background 0.2s, color 0.2s',
                  marginLeft:    '0.4rem',
                  whiteSpace:    'nowrap',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!active) { el.style.background = 'var(--accent)'; el.style.color = '#080808'; }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!active) { el.style.background = 'transparent'; el.style.color = 'var(--accent)'; }
                }}
              >
                {link.label}
              </Link>
            );

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize:      '0.68rem',
                  letterSpacing: '0.14em',
                  color:         active ? 'var(--accent)' : 'var(--text)',
                  textDecoration: 'none',
                  opacity:       active ? 1 : 0.7,
                  transition:    'color 0.2s, opacity 0.2s',
                  paddingBottom: '2px',
                  borderBottom:  active ? '1px solid var(--accent)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.target as HTMLElement).style.opacity = '1';
                    (e.target as HTMLElement).style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.target as HTMLElement).style.opacity = '0.7';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
          {/* Language switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '0.8rem', borderLeft: '1px solid var(--border)', paddingLeft: '1.2rem' }}>
            {(['fr', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  background:    lang === l ? 'rgba(200,169,126,0.15)' : 'transparent',
                  border:        lang === l ? '1px solid rgba(200,169,126,0.45)' : '1px solid transparent',
                  cursor:        'pointer',
                  fontSize:      '0.62rem',
                  letterSpacing: '0.14em',
                  color:         lang === l ? 'var(--accent)' : 'rgba(122,122,116,0.7)',
                  fontFamily:    'var(--font-space), sans-serif',
                  fontWeight:    lang === l ? 600 : 400,
                  padding:       '3px 8px',
                  borderRadius:  '2px',
                  transition:    'all 0.2s',
                  lineHeight:    1.4,
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="show-mobile"
          style={{
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            color:      'var(--text)',
            flexDirection: 'column',
            gap:        '5px',
            padding:    '8px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display:    'block',
                width:      '22px',
                height:     '1px',
                background: 'var(--text)',
                transition: 'transform 0.3s, opacity 0.3s',
                transform: menuOpen
                  ? i === 0 ? 'translateY(6px) rotate(45deg)'
                  : i === 2 ? 'translateY(-6px) rotate(-45deg)'
                  : 'scaleX(0)'
                  : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </header>

      {/* Mobile menu overlay */}
      <div
        style={{
          position:   'fixed',
          inset:      0,
          zIndex:     99,
          background: 'rgba(8,8,8,0.97)',
          display:    'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap:        '2rem',
          opacity:    menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
        }}
      >
        {NAV_LINKS.map((link, i) => {
          const mActive = pathname === link.href;
          const mIsCta  = link.href === '/mon-album';
          return (
            <Link
              key={link.href}
              href={link.href}
              style={mIsCta ? {
                fontFamily:    'var(--font-space), sans-serif',
                fontSize:      '0.65rem',
                letterSpacing: '0.16em',
                color:         mActive ? '#080808' : 'var(--accent)',
                textDecoration: 'none',
                background:    mActive ? 'var(--accent)' : 'transparent',
                border:        '1px solid var(--accent)',
                padding:       '0.55rem 1.4rem',
                marginTop:     '0.6rem',
                opacity:       menuOpen ? 1 : 0,
                transform:     menuOpen ? 'translateY(0)' : 'translateY(20px)',
                transition:    `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`,
              } : {
                fontFamily:    'var(--font-cormorant), serif',
                fontSize:      'clamp(1.6rem, 6vw, 2.4rem)',
                fontStyle:     'italic',
                letterSpacing: '0.05em',
                color:         mActive ? 'var(--accent)' : 'var(--text)',
                textDecoration: 'none',
                opacity:       menuOpen ? 1 : 0,
                transform:     menuOpen ? 'translateY(0)' : 'translateY(20px)',
                transition:    `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`,
              }}
            >
              {link.label}
            </Link>
          );
        })}

        {/* Mobile language switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {(['fr', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                background:    lang === l ? 'var(--accent)' : 'transparent',
                border:        '1px solid var(--border)',
                color:         lang === l ? '#080808' : 'var(--muted)',
                cursor:        'pointer',
                fontSize:      '0.65rem',
                letterSpacing: '0.14em',
                padding:       '0.45rem 1rem',
                fontFamily:    'var(--font-space), sans-serif',
                transition:    'all 0.2s',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Inline style for responsive helpers */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile   { display: none; }
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </>
  );
}
