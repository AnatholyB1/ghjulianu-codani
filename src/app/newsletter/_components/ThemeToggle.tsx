'use client';

import { Moon, Sun } from 'lucide-react';
import { useDayNight } from '@/hooks/useDayNight';

/** Day / night toggle for the newsletter pages (same persisted store as the portfolio toggle, no video overlay). */
export default function ThemeToggle({ label }: { label: string }) {
  const { mode, toggleMode } = useDayNight();
  const Icon = mode === 'night' ? Moon : Sun;
  return (
    <button type="button" className="nlp-theme-btn" onClick={toggleMode} aria-label={label}>
      <Icon aria-hidden="true" strokeWidth={1.25} />
    </button>
  );
}
