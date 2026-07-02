'use client';

import { useRef, useState } from 'react';
import { useDayNight } from '@/hooks/useDayNight';
import { Moon, Sun } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/prefersReducedMotion';
import VideoTransitionOverlay from '@/components/VideoTransitionOverlay';

export default function DayNightToggle() {
  const { mode, toggleMode } = useDayNight();
  const [showOverlay, setShowOverlay] = useState(false);
  // Capture transition values at click time — before React batches mode + overlay state
  const pendingOverlay = useRef<{ src: string; message: string } | null>(null);

  // Determine which icon to show based on current mode
  const IsMoon = mode === 'night';
  const Icon = IsMoon ? Moon : Sun;

  // Tooltip text based on current mode
  const tooltip = IsMoon ? 'Switch to day mode' : 'Switch to night mode';

  function handleToggle() {
    if (prefersReducedMotion()) {
      toggleMode();
      return;
    }
    // Read mode NOW (before any state update) to get the correct src/message
    pendingOverlay.current = {
      src: mode === 'day' ? '/transitions/day-to-night.mp4' : '/transitions/night-to-day.mp4',
      message:
        mode === 'day'
          ? 'Passage en mode nuit — Retrouvez le nightlife dans Portfolio et Albums'
          : 'Passage en mode jour — Retrouvez les shootings dans Portfolio et Albums',
    };
    setShowOverlay(true);
    toggleMode();
  }

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={mode === 'night' ? 'Activer le mode jour' : 'Activer le mode nuit'}
        aria-pressed={mode === 'day'}
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
        <span
          key={mode}
          style={{ display: 'flex', animation: 'iconSwap 200ms cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <Icon size={20} strokeWidth={1.5} />
        </span>
      </button>
      {showOverlay && pendingOverlay.current && (
        <VideoTransitionOverlay
          src={pendingOverlay.current.src}
          message={pendingOverlay.current.message}
          onComplete={() => setShowOverlay(false)}
        />
      )}
    </>
  );
}
