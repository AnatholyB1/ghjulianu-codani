'use client';

import { usePathname } from 'next/navigation';
import { useDayNight } from '@/hooks/useDayNight';
import { setMode } from '@/lib/theme';
import { useLayoutEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useDayNight();
  const pathname = usePathname();

  useLayoutEffect(() => {
    // Day/night theme only applies on /portfolio — rest of site stays dark
    const effectiveMode = pathname === '/portfolio' ? mode : 'night';
    setMode(effectiveMode);
  }, [mode, pathname]);

  return <>{children}</>;
}
