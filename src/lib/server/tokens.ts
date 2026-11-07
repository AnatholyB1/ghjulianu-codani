import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** Random 32-byte token, base64url (43 chars). Only its hash is ever stored. */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** SHA-256 hex of a token (what is stored in the DB). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function secret(): string {
  const s = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!s || s.length < 16) throw new Error('DOWNLOAD_TOKEN_SECRET missing or too short');
  return s;
}

function mac(payload: string): string {
  return createHmac('sha256', secret()).update(`unsubscribe:${payload}`).digest('base64url');
}

/** Stateless unsubscribe token: base64url(email).hmac. No expiry (unsubscribe links must keep working). */
export function signUnsubscribe(email: string): string {
  const payload = Buffer.from(email.trim().toLowerCase(), 'utf8').toString('base64url');
  return `${payload}.${mac(payload)}`;
}

/** Returns the lowercased email when the signature is valid, otherwise null. */
export function verifyUnsubscribe(sig: string): string | null {
  if (typeof sig !== 'string' || sig.length > 512) return null;
  const idx = sig.indexOf('.');
  if (idx <= 0) return null;
  const payload = sig.slice(0, idx);
  const given = Buffer.from(sig.slice(idx + 1));
  const expected = Buffer.from(mac(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return Buffer.from(payload, 'base64url').toString('utf8');
}
