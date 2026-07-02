'use client';

import { useDayNight } from '@/hooks/useDayNight';
import { setMode } from '@/lib/theme';
import { useLayoutEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useDayNight();
  useLayoutEffect(() => {
    setMode(mode);
  }, [mode]);

  return <>{children}</>;
}
