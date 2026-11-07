'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'day-night-storage';

/** Site's persisted day/night choice (zustand persist). Night when absent or unreadable. */
function read(): 'day' | 'night' {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw && JSON.parse(raw)?.state?.mode === 'day' ? 'day' : 'night';
  } catch {
    return 'night';
  }
}
const subscribe = (cb: () => void) => {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
};

/**
 * Scoped theme wrapper. The site's own ThemeProvider forces night outside
 * /portfolio, so this page reads the persisted choice itself (UX-9) and applies
 * it to its own `.dlp` scope only.
 */
export default function ThemeRoot({ lang, children }: { lang: string; children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, read, () => 'night' as const);
  return (
    <div className={`dlp${mode === 'day' ? ' dlp-day' : ''}`} lang={lang}>
      {children}
    </div>
  );
}
