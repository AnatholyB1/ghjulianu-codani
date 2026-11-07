import 'server-only';

/** Bump when the wording below changes; stored with each opt-in as proof. */
export const CONSENT_TEXT_VERSION = 'v1';

export const CONSENT_TEXT = {
  fr: "Je souhaite aussi recevoir la newsletter de Ghjulianu Codani (actualités, nouveaux albums). Je peux me désinscrire à tout moment. Facultatif : le téléchargement ne dépend pas de cette case.",
  en: "I would also like to receive Ghjulianu Codani's newsletter (news, new albums). I can unsubscribe at any time. Optional: your download does not depend on this box.",
} as const;

export type ConsentLang = keyof typeof CONSENT_TEXT;
