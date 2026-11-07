/**
 * Resend webhook signature verification (Svix / Standard Webhooks scheme).
 * Same algorithm as the `standardwebhooks` package used by the installed `resend` SDK
 * (resend.webhooks.verify): signed content = `${id}.${timestamp}.${rawBody}`,
 * key = base64-decoded secret without the `whsec_` prefix, HMAC-SHA256, base64,
 * header = space separated list of `v1,<sig>`. Timestamp tolerance 5 minutes.
 * Pure (node:crypto only) so it can be unit-tested.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

/** Resend sends svix-* headers; Standard Webhooks style webhook-* is accepted too. */
export function readSvixHeaders(h: { get(name: string): string | null }): SvixHeaders {
  return {
    id: h.get('svix-id') ?? h.get('webhook-id'),
    timestamp: h.get('svix-timestamp') ?? h.get('webhook-timestamp'),
    signature: h.get('svix-signature') ?? h.get('webhook-signature'),
  };
}

export function signSvix(secret: string, id: string, timestamp: string | number, payload: string): string {
  const raw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const key = Buffer.from(raw, 'base64');
  if (key.length === 0) throw new Error('empty webhook secret');
  return createHmac('sha256', key).update(`${id}.${timestamp}.${payload}`).digest('base64');
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'missing_headers' | 'bad_timestamp' | 'stale' | 'bad_signature' };

export function verifySvix(
  secret: string,
  headers: SvixHeaders,
  payload: string,
  nowMs: number = Date.now(),
): VerifyResult {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return { ok: false, reason: 'missing_headers' };
  if (!/^\d{1,12}$/.test(timestamp)) return { ok: false, reason: 'bad_timestamp' };
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(nowMs / 1000);
  if (Math.abs(now - ts) > WEBHOOK_TOLERANCE_SECONDS) return { ok: false, reason: 'stale' };

  const expected = Buffer.from(signSvix(secret, id, timestamp, payload));
  for (const part of signature.split(' ')) {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) continue;
    const given = Buffer.from(sig);
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true };
  }
  return { ok: false, reason: 'bad_signature' };
}

function bareAddress(address: string): string {
  const m = address.match(/<([^>]+)>/);
  return (m ? m[1] : address).trim().toLowerCase();
}

/** `Name <a@sub.example.com>` or `a@sub.example.com` -> `sub.example.com` (lowercase), else null. */
export function domainOf(address: string | null | undefined): string | null {
  if (!address) return null;
  const addr = bareAddress(address);
  const at = addr.lastIndexOf('@');
  if (at < 0 || at === addr.length - 1) return null;
  return addr.slice(at + 1);
}

/** True when `from` belongs to our own sender domain (exact or subdomain of RESEND_FROM's domain). */
export function isOwnSender(from: string | null | undefined, ourFrom: string | null | undefined): boolean {
  const mine = domainOf(ourFrom);
  const theirs = domainOf(from);
  if (!mine || !theirs) return false;
  return theirs === mine || theirs.endsWith(`.${mine}`);
}

export type SuppressionDecision =
  | { suppress: true; reason: 'hard_bounce' | 'complaint'; recipients: string[] }
  | { suppress: false };

/** Decide what a (verified, parsed) Resend event means for the subscriber list. */
export function decideSuppression(evt: unknown, ourFrom: string | null | undefined): SuppressionDecision {
  if (!evt || typeof evt !== 'object') return { suppress: false };
  const e = evt as { type?: unknown; data?: Record<string, unknown> };
  const data = e.data;
  if (!data || typeof data !== 'object') return { suppress: false };
  if (e.type !== 'email.bounced' && e.type !== 'email.complained') return { suppress: false };
  if (!isOwnSender(typeof data.from === 'string' ? data.from : null, ourFrom)) return { suppress: false };

  let reason: 'hard_bounce' | 'complaint';
  if (e.type === 'email.complained') {
    reason = 'complaint';
  } else {
    const bounce = data.bounce as { type?: unknown } | undefined;
    // Resend bounce.type: "Permanent" (hard) | "Transient" | "Undetermined". Only Permanent suppresses.
    if (typeof bounce?.type !== 'string' || bounce.type.toLowerCase() !== 'permanent') return { suppress: false };
    reason = 'hard_bounce';
  }
  const to = Array.isArray(data.to) ? data.to : [];
  const recipients = [
    ...new Set(
      to
        .filter((x): x is string => typeof x === 'string')
        .map(bareAddress)
        .filter((x) => x.includes('@')),
    ),
  ];
  if (recipients.length === 0) return { suppress: false };
  return { suppress: true, reason, recipients };
}
