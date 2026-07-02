'use client';

import DayNightToggle from '@/components/DayNightToggle';
import { useDayNight } from '@/hooks/useDayNight';

export default function PortfolioThemeToggle() {
  const { mode } = useDayNight();

  const label =
    mode === 'day'
      ? 'Changer de thème pour voir les photos de nuit'
      : 'Changer de thème pour voir les photos de jour';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
      <DayNightToggle />
      <span
        style={{
          fontSize:      '0.5rem',
          letterSpacing: '0.1em',
          color:         'var(--muted)',
          whiteSpace:    'nowrap',
          textAlign:     'left',
          lineHeight:    1.4,
        }}
      >
        {label}
      </span>
    </div>
  );
}
