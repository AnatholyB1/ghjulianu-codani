import 'server-only';
import { CONSENT_LABEL, CONSENT_SUB } from '@/lib/consentCopy';

/** Bump when the wording changes; stored with each opt-in as proof. */
export const CONSENT_TEXT_VERSION = 'v1';

/** Full text shown to the visitor (label + sub line), built from the client-visible strings. */
export const CONSENT_TEXT = {
  fr: `${CONSENT_LABEL.fr} ${CONSENT_SUB.fr}`,
  en: `${CONSENT_LABEL.en} ${CONSENT_SUB.en}`,
} as const;

export type ConsentLang = keyof typeof CONSENT_TEXT;
