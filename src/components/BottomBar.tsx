'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/hooks/useT';

export default function BottomBar() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const scrolled  = window.scrollY;
      const total     = document.documentElement.scrollHeight - window.innerHeight;
      // show when near bottom OR when page isn't scrollable (e.g. fullscreen /albums)
      setVisible(total <= 0 || scrolled / total > 0.7);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, []);

  return (
    <div
      role="contentinfo"
      className="bb-bar"
      style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     90,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding:    '0 2rem',
        minHeight:  '52px',
        background: 'rgba(8,8,8,0.9)',
        borderTop:  '1px solid var(--border)',
        backdropFilter: 'blur(14px)',
        transform:  visible ? 'translateY(0)' : 'translateY(100%)',
        opacity:    visible ? 1 : 0,
        transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease',
      }}
    >
      <p
        className="bb-text"
        style={{
          fontSize:      '0.65rem',
          letterSpacing: '0.12em',
          color:         'var(--muted)',
          whiteSpace:    'nowrap',
          display:       'flex',
          alignItems:    'center',
          gap:           '0.6rem',
        }}
      >
        <span className="bb-prefix">{t.bottomBar.enjoy}{' '}</span>
        <Link
          href="/don"
          style={{
            color:          'var(--accent)',
            textDecoration: 'none',
            borderBottom:   '1px solid var(--accent)',
            paddingBottom:  '1px',
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.35rem',
          }}
        >
          {t.bottomBar.donate}
        </Link>
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <a
          href="https://www.instagram.com/ghjulianu.cdn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          style={{ color: 'var(--muted)', opacity: 0.65, display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.65')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
          </svg>
        </a>
        <Link
          href="/contact"
          style={{
            fontSize:      '0.65rem',
            letterSpacing: '0.14em',
            color:         'var(--text)',
            textDecoration: 'none',
            opacity:       0.7,
            transition:    'opacity 0.2s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '1')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '0.7')}
        >
          {t.bottomBar.contact}
        </Link>
      </div>
    </div>
  );
}
