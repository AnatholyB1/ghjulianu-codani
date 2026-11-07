/**
 * Newsletter consent wording shown next to the optional checkbox (client-safe).
 * The server stores `CONSENT_TEXT_VERSION` with each opt-in, and src/lib/server/consent.ts
 * builds the stored proof text from THESE strings, so what is displayed is what is recorded.
 * If any string here changes, bump CONSENT_TEXT_VERSION in src/lib/server/consent.ts.
 */
export const CONSENT_LABEL = {
  fr: 'Je souhaite aussi recevoir la newsletter de Ghjulianu Codani (nouveaux albums, actualités).',
  en: 'I would also like to receive the Ghjulianu Codani newsletter (new albums, news).',
} as const;

export const CONSENT_SUB = {
  fr: 'Facultatif : vous recevez vos photos dans tous les cas. Une confirmation par email vous sera demandée. Désinscription en un clic.',
  en: 'Optional: you get your photos either way. You will be asked to confirm by email. Unsubscribe in one click.',
} as const;
