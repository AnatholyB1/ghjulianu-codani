'use client';

import { useDayNight } from '@/hooks/useDayNight';
import { useT } from '@/hooks/useT';
import { Moon, Sun } from 'lucide-react';

export default function DayNightToggle() {
  const { mode, toggleMode } = useDayNight();
  const t = useT();

  const IsMoon = mode === 'night';
  const Icon = IsMoon ? Moon : Sun;

  // Tooltip / aria describe the action the button will perform
  const label = IsMoon ? t.portfolio.switchToDay : t.portfolio.switchToNight;

  return (
    <button
      onClick={toggleMode}
      aria-label={label}
      aria-pressed={mode === 'day'}
      title={label}
      style={{
        width: '4.5rem',
        height: '4.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        color: 'var(--text)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: '6px',
        padding: '0',
        lineHeight: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = 'rgba(255,255,255,0.08)';
        el.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = 'transparent';
        el.style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'scale(1.05)';
      }}
    >
      <Icon size={36} strokeWidth={1.5} />
    </button>
  );
}
