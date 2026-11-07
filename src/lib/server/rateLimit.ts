import 'server-only';
import { createHash } from 'node:crypto';
import { getAdminClient } from './supabaseAdmin';

export const MIN_SALT_LENGTH = 16;

/** IP_HASH_SALT, or throws: an unset / short salt would make hashed IPs and emails trivially reversible. */
export function requireSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt || salt.length < MIN_SALT_LENGTH) throw new Error('IP_HASH_SALT missing or too short');
  return salt;
}

/** Salted hash for identifiers (IP, email) used in rate-limit keys and proofs. Never store raw values. Throws when the salt is not configured (fail closed). */
export function hashIdentifier(value: string): string {
  const salt = requireSalt();
  return createHash('sha256').update(`${salt}:${value.trim().toLowerCase()}`).digest('hex').slice(0, 32);
}

/**
 * Fixed-window rate limit backed by the Postgres RPC `rate_limit_hit`.
 * Returns true when the call is allowed. Fails CLOSED (false) if the database is unreachable.
 */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await getAdminClient().rpc('rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn('[rateLimit] rpc error:', error.code ?? error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.warn('[rateLimit] failure:', e instanceof Error ? e.message : 'unknown');
    return false;
  }
}
