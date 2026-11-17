'use client';

import DayNightToggle from '@/components/DayNightToggle';
import { useDayNight } from '@/hooks/useDayNight';
import { useT } from '@/hooks/useT';

export default function PortfolioThemeToggle() {
  const { mode } = useDayNight();
  const t = useT();

  const label = mode === 'day' ? t.portfolio.toggleToNight : t.portfolio.toggleToDay;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
      <DayNightToggle />
      <span
        style={{
          fontSize:      '0.8rem',
          letterSpacing: '0.08em',
          color:         'var(--muted)',
          textAlign:     'left',
          lineHeight:    1.4,
          maxWidth:      '16rem',
        }}
      >
        {label}
      </span>
    </div>
  );
}
