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
      // appear when ≥ 80 % scrolled OR near bottom
      setVisible(total > 0 && scrolled / total > 0.7);
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
          }}
        >
          {t.bottomBar.donate}
        </Link>
      </p>

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
  );
}
