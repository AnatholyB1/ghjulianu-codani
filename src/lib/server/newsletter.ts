import 'server-only';
import { getAdminClient } from './supabaseAdmin';
import { newToken, hashToken } from './tokens';
import { hit, hashIdentifier } from './rateLimit';
import { sendEmail } from './email/send';
import { CONSENT_TEXT_VERSION } from './consent';
import { ConfirmSubscriptionEmail, confirmSubject, confirmText } from './email/ConfirmSubscription';
import type { EmailLang } from './email/layout';

/** Double opt-in link lifetime (contract: 48 h). */
export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

export type SubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed' | 'suppressed';

export interface SubscriberRow {
  id: string;
  email: string;
  status: SubscriberStatus;
  lang: string;
  consent_text_version: string | null;
  consent_at: string | null;
  confirm_token_hash: string | null;
  confirm_expires_at: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  suppressed_reason: string | null;
  source: string | null;
  created_at: string;
}

export function normaliseLang(l: unknown): EmailLang {
  return l === 'en' ? 'en' : 'fr';
}

/** Language for pages where the address (and so its stored language) is unknown: browser preference, default FR. */
export function langFromAcceptLanguage(h: string | null | undefined): EmailLang {
  return /^\s*en/i.test(h ?? '') ? 'en' : 'fr';
}

/**
 * Fields written when an address (re)subscribes: a new explicit opt-in, so the consent proof is refreshed
 * (time, wording version, source) and any earlier unsubscribe is cleared. Used for the insert and for an
 * `unsubscribed` / stale `pending` row ticking the box again. Pure, unit-tested.
 */
export function resubscribePatch(now: Date, lang: EmailLang, source: string) {
  const iso = now.toISOString();
  return {
    status: 'pending' as const,
    lang,
    consent_text_version: CONSENT_TEXT_VERSION,
    consent_at: iso,
    source,
    unsubscribed_at: null as string | null,
    updated_at: iso,
  };
}

/**
 * NWS-01 hook, called by the request flow (phase 6) once a visitor ticked the optional newsletter box.
 *
 * - Creates the `pending` subscriber row when it does not exist yet (phase 6 normally does it first).
 * - Stores only the SHA-256 hash of a fresh random token + a 48 h expiry (re-sending replaces the
 *   previous link).
 * - Sends the double opt-in email through sendEmail() (guard D-13 applies: never a real send outside
 *   production). Transactional mail: no List-Unsubscribe header (nothing to unsubscribe from yet).
 * - Never throws and never reveals anything to the caller: a failure here must not break the download
 *   request. Already `confirmed` and `suppressed` rows are left alone (a suppressed address is never
 *   re-enabled by a visitor).
 */
export async function enqueueConfirmation(email: string, lang: EmailLang, opts: { source?: string } = {}): Promise<void> {
  try {
    const addr = (email ?? '').trim().toLowerCase();
    if (addr.length < 3 || addr.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return;
    const l = normaliseLang(lang);
    const source = opts.source ?? 'download';

    // At most 3 confirmation emails per address per hour (anti mail-bombing of third parties).
    if (!(await hit(`nl-confirm:${hashIdentifier(addr)}`, 3, 3600))) {
      console.warn('[newsletter] confirmation throttled');
      return;
    }

    const db = getAdminClient();
    const { data: existing, error: selErr } = await db
      .from('subscribers')
      .select('id,status')
      .eq('email', addr)
      .maybeSingle();
    if (selErr) {
      console.warn('[newsletter] lookup failed:', selErr.code ?? selErr.message);
      return;
    }
    if (existing && (existing.status === 'confirmed' || existing.status === 'suppressed')) return;

    const token = newToken();
    const now = new Date();
    const patch = {
      ...resubscribePatch(now, l, source),
      confirm_token_hash: hashToken(token),
      confirm_expires_at: new Date(now.getTime() + CONFIRM_TTL_MS).toISOString(),
    };

    if (existing) {
      const { error } = await db.from('subscribers').update(patch).eq('id', existing.id).in('status', ['pending', 'unsubscribed']);
      if (error) {
        console.warn('[newsletter] update failed:', error.code ?? error.message);
        return;
      }
    } else {
      const { error } = await db.from('subscribers').insert({ email: addr, ...patch });
      if (error) {
        console.warn('[newsletter] insert failed:', error.code ?? error.message);
        return;
      }
    }

    await sendEmail({
      to: addr,
      subject: confirmSubject(l),
      react: ConfirmSubscriptionEmail({ lang: l, token }),
      text: confirmText(l, token),
      tags: [{ name: 'type', value: 'newsletter_confirm' }],
    });
  } catch (e) {
    console.warn('[newsletter] enqueueConfirmation failed:', e instanceof Error ? e.message : 'unknown');
  }
}

const SUBSCRIBER_COLUMNS =
  'id,email,status,lang,consent_text_version,consent_at,confirm_token_hash,confirm_expires_at,confirmed_at,unsubscribed_at,suppressed_reason,source,created_at';

export async function findByConfirmToken(token: string): Promise<SubscriberRow | null> {
  if (!token || token.length > 128) return null;
  const { data, error } = await getAdminClient()
    .from('subscribers')
    .select(SUBSCRIBER_COLUMNS)
    .eq('confirm_token_hash', hashToken(token))
    .maybeSingle();
  if (error) throw new Error(`subscribers lookup failed: ${error.code ?? error.message}`);
  return (data as SubscriberRow | null) ?? null;
}

export async function findByEmail(email: string): Promise<SubscriberRow | null> {
  const { data, error } = await getAdminClient()
    .from('subscribers')
    .select(SUBSCRIBER_COLUMNS)
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(`subscribers lookup failed: ${error.code ?? error.message}`);
  return (data as SubscriberRow | null) ?? null;
}

export type ConfirmOutcome =
  | { state: 'confirmed'; row: SubscriberRow }
  | { state: 'already'; row: SubscriberRow }
  | { state: 'expired'; row: SubscriberRow | null };

/** Classify a confirm token WITHOUT changing anything (used by the GET page). */
export function classifyConfirm(row: SubscriberRow | null, now: Date = new Date()): 'ready' | 'already' | 'expired' {
  if (!row) return 'expired'; // unknown and used look the same: no enumeration
  if (row.status === 'confirmed') return 'already';
  if (row.status !== 'pending') return 'expired';
  if (!row.confirm_expires_at || new Date(row.confirm_expires_at).getTime() < now.getTime()) return 'expired';
  return 'ready';
}

/** POST handler core: idempotent (a replay returns `already`). */
export async function confirmByToken(token: string): Promise<ConfirmOutcome> {
  const row = await findByConfirmToken(token);
  const c = classifyConfirm(row);
  if (!row || c === 'expired') return { state: 'expired', row: row && row.status === 'pending' ? row : null };
  if (c === 'already') return { state: 'already', row };

  const nowIso = new Date().toISOString();
  const { data, error } = await getAdminClient()
    .from('subscribers')
    .update({ status: 'confirmed', confirmed_at: nowIso, updated_at: nowIso })
    .eq('id', row.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`confirm failed: ${error.code ?? error.message}`);
  if (!data) {
    // Lost a race (double submit): re-read, the other request won.
    const again = await findByConfirmToken(token);
    return again?.status === 'confirmed' ? { state: 'already', row: again } : { state: 'expired', row: null };
  }
  return { state: 'confirmed', row: { ...row, status: 'confirmed', confirmed_at: nowIso } };
}

export type UnsubscribeOutcome = 'unsubscribed' | 'already' | 'unknown';

/**
 * Immediate effect. `suppressed` rows stay suppressed (reported as `already`). An address that is
 * not in the list is `unknown` (public pages show the generic invalid state, one-click POST still 200).
 */
export async function unsubscribeEmail(email: string): Promise<UnsubscribeOutcome> {
  const row = await findByEmail(email);
  if (!row) return 'unknown';
  if (row.status === 'unsubscribed' || row.status === 'suppressed') return 'already';
  const nowIso = new Date().toISOString();
  const { error } = await getAdminClient()
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: nowIso, updated_at: nowIso })
    .eq('id', row.id)
    .in('status', ['pending', 'confirmed']);
  if (error) throw new Error(`unsubscribe failed: ${error.code ?? error.message}`);
  return 'unsubscribed';
}

/**
 * Suppress addresses after a hard bounce / spam complaint (NWS-03). Idempotent: rows that are already
 * `suppressed` are not touched (the first reason is kept). Returns the number of rows changed.
 */
export async function suppressEmails(emails: string[], reason: 'hard_bounce' | 'complaint'): Promise<number> {
  if (emails.length === 0) return 0;
  const nowIso = new Date().toISOString();
  const { data, error } = await getAdminClient()
    .from('subscribers')
    .update({ status: 'suppressed', suppressed_reason: reason, updated_at: nowIso })
    .in('email', emails.map((e) => e.trim().toLowerCase()))
    .neq('status', 'suppressed')
    .select('id');
  if (error) throw new Error(`suppress failed: ${error.code ?? error.message}`);
  return data?.length ?? 0;
}
