'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'PORTFOLIO',    href: '/portfolio' },
  { label: 'ALBUMS',       href: '/albums' },
  { label: 'À PROPOS',     href: '/about' },
  { label: 'TARIFS',       href: '/tarifs' },
  { label: 'CONTACT',      href: '/contact' },
  { label: 'FAIRE UN DON', href: '/don' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

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
            display:    'flex',
            gap:        '2.2rem',
            alignItems: 'center',
          }}
          className="hidden-mobile"
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
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
            display:    'flex',
            flexDirection: 'column',
            gap:        '5px',
            padding:    '4px',
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
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontFamily:    'var(--font-cormorant), serif',
              fontSize:      'clamp(1.6rem, 6vw, 2.4rem)',
              fontStyle:     'italic',
              letterSpacing: '0.05em',
              color:         pathname === link.href ? 'var(--accent)' : 'var(--text)',
              textDecoration: 'none',
              opacity:       menuOpen ? 1 : 0,
              transform:     menuOpen ? 'translateY(0)' : 'translateY(20px)',
              transition:    `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`,
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Inline style for responsive helpers */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile   { display: none; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none; }
          .show-mobile   { display: flex; }
        }
      `}</style>
    </>
  );
}
