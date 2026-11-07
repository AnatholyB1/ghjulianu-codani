// Pure helpers for the download-request flow (phase 6).
// Deliberately free of 'server-only' / path aliases so `node --test` can import it directly.
// Only ever imported from server code (server actions / route handlers).
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

export const MAX_PHOTOS_PER_REQUEST = 200;
export const MIN_SUBMIT_MS = 2_000;
export const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;
export const LINK_TTL_HOURS = 48;

export type PhotoSource = 'album_photos' | 'portfolio_photos';
export interface PhotoRef { photoId: string; source: PhotoSource }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/** Pragmatic address check (the real proof is the email delivery itself). */
const EMAIL_RE = /^[^\s@<>()\[\]\\,;:"]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

/** Lowercased + trimmed address, or null when invalid. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  if (e.length < 6 || e.length > 254) return null;
  const at = e.lastIndexOf('@');
  if (at < 1 || at > 64) return null;
  const tld = e.slice(e.lastIndexOf('.') + 1);
  if (tld.length < 2) return null;
  return EMAIL_RE.test(e) ? e : null;
}

/** Validate + dedupe a client-provided cart snapshot. Never trusts anything but ids. */
export function parsePhotoRefs(raw: unknown): PhotoRef[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_PHOTOS_PER_REQUEST) return null;
  const seen = new Set<string>();
  const out: PhotoRef[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') return null;
    const { photoId, source } = r as Record<string, unknown>;
    if (!isUuid(photoId)) return null;
    if (source !== 'album_photos' && source !== 'portfolio_photos') return null;
    const key = `${source}:${photoId.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ photoId: photoId.toLowerCase(), source });
  }
  return out;
}

function secret(): string {
  const s = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!s || s.length < 16) throw new Error('DOWNLOAD_TOKEN_SECRET missing or too short');
  return s;
}

function b64mac(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Signed render timestamp handed to the form when it opens: `<ms>.<hmac>`. */
export function signFormToken(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${b64mac(`form:${ts}`)}`;
}

export type FormTokenState = 'ok' | 'too_fast' | 'expired' | 'invalid';

export function checkFormToken(token: unknown, now = Date.now()): FormTokenState {
  if (typeof token !== 'string' || token.length > 100) return 'invalid';
  const i = token.indexOf('.');
  if (i <= 0) return 'invalid';
  const ts = token.slice(0, i);
  if (!/^\d{10,15}$/.test(ts)) return 'invalid';
  if (!safeEq(token.slice(i + 1), b64mac(`form:${ts}`))) return 'invalid';
  const age = now - Number(ts);
  if (age < MIN_SUBMIT_MS) return 'too_fast';
  if (age > MAX_FORM_AGE_MS) return 'expired';
  return 'ok';
}

/** Constant-time string equality independent of length (compares SHA-256 digests). */
export function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Signed, short-lived private album access cookie value: `<expSec>.<hmac>`. */
export function signAlbumAccess(slug: string, accessKey: string, ttlSeconds: number, nowMs = Date.now()): string {
  const exp = Math.floor(nowMs / 1000) + ttlSeconds;
  const keyFp = createHash('sha256').update(accessKey).digest('hex').slice(0, 16);
  return `${exp}.${b64mac(`album:${slug}:${keyFp}:${exp}`)}`;
}

/** True when the cookie is authentic, unexpired, and bound to the album's CURRENT key (rotating the key revokes it). */
export function verifyAlbumAccess(value: string | undefined | null, slug: string, accessKey: string | null, nowMs = Date.now()): boolean {
  if (!value || !accessKey || value.length > 200) return false;
  const i = value.indexOf('.');
  if (i <= 0) return false;
  const expStr = value.slice(0, i);
  if (!/^\d{9,12}$/.test(expStr)) return false;
  const exp = Number(expStr);
  const keyFp = createHash('sha256').update(accessKey).digest('hex').slice(0, 16);
  if (!safeEq(value.slice(i + 1), b64mac(`album:${slug}:${keyFp}:${exp}`))) return false;
  return exp * 1000 > nowMs;
}

/** Fixed limits (one place). */
export const LIMITS = {
  ipPerHour: { limit: 8, windowSeconds: 3600 },
  emailPerHour: { limit: 3, windowSeconds: 3600 },
  keyAttempts: { limit: 5, windowSeconds: 900 },
  keyAttemptsGlobalPerIp: { limit: 20, windowSeconds: 900 },
  selectAddPerMinute: { limit: 120, windowSeconds: 60 },
} as const;

/**
 * GLOBAL cap on download emails per day (abuse as an email relay, F3).
 * Env DOWNLOAD_EMAIL_DAILY_CAP, default 80; unset / not a positive integer => 80.
 */
export const DEFAULT_DOWNLOAD_EMAIL_DAILY_CAP = 80;
export function downloadEmailDailyCap(raw: string | undefined = process.env.DOWNLOAD_EMAIL_DAILY_CAP): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_DOWNLOAD_EMAIL_DAILY_CAP;
}
/** Rate-limit key of the global daily bucket (fixed 24 h window of the rate_limit_hit RPC). */
export const GLOBAL_EMAIL_KEY = 'dlreq:global:day';
export const GLOBAL_EMAIL_WINDOW_SECONDS = 86400;
