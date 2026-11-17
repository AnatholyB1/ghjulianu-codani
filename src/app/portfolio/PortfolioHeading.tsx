'use client';

import { useT } from '@/hooks/useT';
import PortfolioThemeToggle from './PortfolioThemeToggle';

export default function PortfolioHeading() {
  const t = useT();

  return (
    <>
      <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>
        {t.portfolio.label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant),serif',
            fontSize:   'clamp(2.5rem,7vw,5.5rem)',
            fontStyle:  'italic',
            fontWeight: 300,
            lineHeight: 0.95,
            color:      'var(--text)',
          }}
        >
          {t.portfolio.title}
        </h1>
        <PortfolioThemeToggle />
      </div>
    </>
  );
}
