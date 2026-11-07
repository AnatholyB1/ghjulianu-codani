import 'server-only';

/**
 * PHASE 9 HOOK. Phase 6 only records a `pending` subscriber (with consent proof).
 * Phase 9 fills this function: create/refresh confirm_token_hash + confirm_expires_at and send the
 * double opt-in email (button -> POST /newsletter/confirmer). Phase 6 deliberately sends NOTHING
 * here and never sends marketing content.
 *
 * Must never throw into the download flow and must not reveal whether the address was already known.
 */
export async function enqueueConfirmation(email: string, lang: 'fr' | 'en'): Promise<void> {
  void email;
  void lang;
  // intentionally empty until phase 9
}
