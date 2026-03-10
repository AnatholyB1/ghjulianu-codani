'use client';
import { useLang } from '@/contexts/LanguageContext';
import { getT }    from '@/lib/i18n';

export function useT() {
  const { lang } = useLang();
  return getT(lang);
}
