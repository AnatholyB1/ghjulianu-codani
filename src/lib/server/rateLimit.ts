import 'server-only';
import { createHash } from 'node:crypto';
import { getAdminClient } from './supabaseAdmin';

/** Salted hash for identifiers (IP, email) used in rate-limit keys and proofs. Never store raw values. */
export function hashIdentifier(value: string): string {
  const salt = process.env.IP_HASH_SALT ?? '';
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
