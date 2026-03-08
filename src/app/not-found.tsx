import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight:      'calc(100vh - var(--navbar-h))',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '1.5rem',
        padding:        '2rem',
        textAlign:      'center',
      }}
    >
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)' }}>404</p>
      <h1
        style={{
          fontFamily: 'var(--font-cormorant),serif',
          fontSize:   'clamp(2.5rem,7vw,5rem)',
          fontStyle:  'italic',
          fontWeight: 300,
          color:      'var(--text)',
          lineHeight: 0.95,
        }}
      >
        Page introuvable
      </h1>
      <Link
        href="/"
        style={{
          fontSize:      '0.65rem',
          letterSpacing: '0.16em',
          color:         'var(--accent)',
          textDecoration: 'none',
          borderBottom:  '1px solid var(--accent)',
          paddingBottom: '2px',
          marginTop:     '1rem',
        }}
      >
        RETOUR À L'ACCUEIL
      </Link>
    </div>
  );
}
