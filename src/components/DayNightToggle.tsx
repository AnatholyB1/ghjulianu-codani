'use client';

import { useDayNight } from '@/hooks/useDayNight';
import { Moon, Sun } from 'lucide-react';

export default function DayNightToggle() {
  const { mode, toggleMode } = useDayNight();

  // Determine which icon to show based on current mode
  const IsMoon = mode === 'night';
  const Icon = IsMoon ? Moon : Sun;

  // Tooltip text based on current mode
  const tooltip = IsMoon ? 'Switch to day mode' : 'Switch to night mode';

  return (
    <button
      onClick={toggleMode}
      aria-label="Toggle day/night mode"
      title={tooltip}
      style={{
        width: '3rem',
        height: '3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        color: 'var(--text)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: '4px',
        padding: '0',
        lineHeight: 0,
        marginRight: '1.5rem', // Add space between toggle and logo
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
      <Icon size={20} strokeWidth={1.5} />
    </button>
  );
}