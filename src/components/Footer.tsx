'use client';
import Link   from 'next/link';
import { useT } from '@/hooks/useT';

export default function Footer() {
  const t = useT();
  return (
    <footer
      style={{
        borderTop:      '1px solid var(--border)',
        background:     'var(--bg)',
        padding:        '2rem clamp(1.5rem, 6vw, 4rem) calc(2rem + 52px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            '1rem',
      }}
    >
      {/* Left — mentions légales */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '1.5rem',
          flexWrap:   'wrap',
        }}
      >
        <span
          style={{
            fontFamily:    'var(--font-space)',
            fontSize:      '0.6rem',
            letterSpacing: '0.1em',
            color:         'var(--muted)',
            textTransform: 'uppercase',
          }}
        >
          © {new Date().getFullYear()} Ghjulianu Codani
        </span>
        <Link
          href="/mentions-legales"
          style={{
            fontFamily:    'var(--font-space)',
            fontSize:      '0.6rem',
            letterSpacing: '0.1em',
            color:         'var(--muted)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition:    'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--muted)')}
        >
          {t.footer.mentions}
        </Link>
        <Link
          href="/politique-de-confidentialite"
          style={{
            fontFamily:    'var(--font-space)',
            fontSize:      '0.6rem',
            letterSpacing: '0.1em',
            color:         'var(--muted)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition:    'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--muted)')}
        >
          {t.footer.privacy}
        </Link>
      </div>

      {/* Right — crédit studio */}
      <p
        style={{
          fontFamily:    'var(--font-space)',
          fontSize:      '0.6rem',
          letterSpacing: '0.08em',
          color:         'var(--muted)',
          margin:        0,
        }}
      >
        {t.footer.madeBy}{' '}
        <a
          href="https://selenium-studio.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color:          'var(--text)',
            textDecoration: 'none',
            borderBottom:   '1px solid var(--border)',
            paddingBottom:  '1px',
            transition:     'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          }}
        >
          Selenium Studio
        </a>
        {' '}{t.footer.and}{' '}
        <a
          href="https://anatholy-bricon.com/services"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color:          'var(--text)',
            textDecoration: 'none',
            borderBottom:   '1px solid var(--border)',
            paddingBottom:  '1px',
            transition:     'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          }}
        >
          Anatholy Bricon
        </a>
      </p>
    </footer>
  );
}
