export type NlLang = 'fr' | 'en';

export type ConfirmState = 'ready' | 'confirmed' | 'expired' | 'already';
export type UnsubState = 'ready' | 'confirmed' | 'already' | 'invalid';

/** `{a}` is replaced by the masked address (never the full address). */
export const COPY = {
  fr: {
    eyebrow: 'Newsletter',
    back: 'Retour au site',
    legal: 'Mentions légales',
    privacy: 'Politique de confidentialité',
    toggle: 'Basculer jour / nuit',
    busy: 'Confirmation…',
    unsubBusy: 'Désinscription…',
    confirm: {
      ready: {
        h1: 'Confirmez votre inscription',
        l1: 'Un dernier geste : appuyez sur le bouton pour recevoir les nouvelles photos de Ghjulianu Codani à l’adresse {a}.',
        l2: 'Tant que vous n’avez pas confirmé, rien n’est enregistré. Si ce n’est pas vous, fermez simplement cette page.',
        cta: 'Confirmer mon inscription',
      },
      confirmed: {
        h1: 'Inscription confirmée',
        l1: 'Merci. La prochaine newsletter arrivera à {a}.',
        l2: 'Chaque email contient un lien pour vous désinscrire en un clic.',
      },
      expired: {
        h1: 'Ce lien a expiré',
        l1: 'Le lien de confirmation n’est valable que 48 heures, ou il n’est plus valide. Aucune inscription n’a été faite.',
        l2: 'Pour recevoir la newsletter, cochez de nouveau la case « newsletter » quand vous demandez des photos : un nouvel email de confirmation vous sera envoyé.',
      },
      already: {
        h1: 'Déjà confirmé',
        l1: 'L’adresse {a} est déjà inscrite à la newsletter. Il n’y a rien à faire.',
        l2: 'Vous pouvez vous désinscrire à tout moment depuis n’importe quel email reçu.',
      },
      error: 'La confirmation n’a pas abouti. Vérifiez votre connexion puis réessayez.',
      recap: {
        title: 'Ce que vous confirmez',
        address: 'Adresse',
        consent: 'Consentement',
        asked: 'Demandé le',
        version: 'Version {v} du texte, conservée avec la date comme preuve de consentement.',
      },
    },
    unsub: {
      ready: {
        h1: 'Se désinscrire de la newsletter ?',
        l1: 'Vous ne recevrez plus la newsletter à l’adresse {a}.',
        l2: 'Les liens de téléchargement que vous demandez continueront d’être envoyés normalement.',
        cta: 'Me désinscrire',
        stay: 'Je reste abonné(e)',
      },
      confirmed: {
        h1: 'Vous êtes désinscrit(e)',
        l1: 'Plus aucune newsletter ne sera envoyée à {a}.',
        l2: 'Effectif immédiatement. Aucune action supplémentaire n’est nécessaire.',
      },
      already: {
        h1: 'Déjà désinscrit(e)',
        l1: 'L’adresse {a} ne reçoit déjà plus la newsletter.',
        l2: 'Rien à faire de votre côté.',
      },
      invalid: {
        h1: 'Lien non reconnu',
        l1: 'Ce lien de désinscription est incomplet ou a été modifié.',
        l2: 'Chaque newsletter se termine par un lien valide. Si le problème persiste, écrivez-nous depuis la page contact.',
      },
      error: 'La désinscription n’a pas abouti. Réessayez dans un instant.',
      resub: 'Se réinscrire. Cochez la case « newsletter » quand vous demandez des photos. Un email de confirmation vous sera envoyé.',
    },
  },
  en: {
    eyebrow: 'Newsletter',
    back: 'Back to site',
    legal: 'Legal notice',
    privacy: 'Privacy policy',
    toggle: 'Toggle day / night',
    busy: 'Confirming…',
    unsubBusy: 'Unsubscribing…',
    confirm: {
      ready: {
        h1: 'Confirm your subscription',
        l1: 'One last step: press the button to receive new photos from Ghjulianu Codani at {a}.',
        l2: 'Nothing is saved until you confirm. If this was not you, simply close this page.',
        cta: 'Confirm my subscription',
      },
      confirmed: {
        h1: 'Subscription confirmed',
        l1: 'Thank you. The next newsletter will reach {a}.',
        l2: 'Every email contains a one-click unsubscribe link.',
      },
      expired: {
        h1: 'This link has expired',
        l1: 'The confirmation link is only valid for 48 hours, or it is no longer valid. No subscription was made.',
        l2: 'To receive the newsletter, tick the “newsletter” box again when you request photos: a new confirmation email will be sent to you.',
      },
      already: {
        h1: 'Already confirmed',
        l1: '{a} is already subscribed to the newsletter. Nothing to do.',
        l2: 'You can unsubscribe at any time from any email you receive.',
      },
      error: 'The confirmation did not go through. Check your connection and try again.',
      recap: {
        title: 'What you are confirming',
        address: 'Address',
        consent: 'Consent',
        asked: 'Requested on',
        version: 'Text version {v}, stored with the date as proof of consent.',
      },
    },
    unsub: {
      ready: {
        h1: 'Unsubscribe from the newsletter?',
        l1: 'You will no longer receive the newsletter at {a}.',
        l2: 'Download links that you request will still be sent as usual.',
        cta: 'Unsubscribe me',
        stay: 'Keep me subscribed',
      },
      confirmed: {
        h1: 'You are unsubscribed',
        l1: 'No more newsletters will be sent to {a}.',
        l2: 'Effective immediately. No further action is needed.',
      },
      already: {
        h1: 'Already unsubscribed',
        l1: '{a} already no longer receives the newsletter.',
        l2: 'Nothing to do on your side.',
      },
      invalid: {
        h1: 'Link not recognised',
        l1: 'This unsubscribe link is incomplete or has been altered.',
        l2: 'Every newsletter ends with a valid link. If the problem continues, write to us from the contact page.',
      },
      error: 'The unsubscribe did not go through. Please try again in a moment.',
      resub: 'Subscribe again. Tick the “newsletter” box when you request photos. A confirmation email will follow.',
    },
  },
} as const;

export type FlowResult = { state: string; masked?: string; error?: boolean };
