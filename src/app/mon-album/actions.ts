'use server';

import { cookies, headers } from 'next/headers';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { hit, hashIdentifier } from '@/lib/server/rateLimit';
import { LIMITS, constantTimeEqual, signAlbumAccess } from '@/lib/server/requestGuards';

export type UnlockResult =
  | { ok: true; slug: string }
  | { ok: false; code: 'invalid_key'; attemptsLeft: number }
  | { ok: false; code: 'locked' };

const COOKIE_TTL_SECONDS = 24 * 3600;

function clientIp(h: Headers): string {
  const xff = h.get('x-forwarded-for');
  return (xff?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || 'unknown';
}

/** Attempts used in the current window for a limiter key (best effort, for the UI hint only). */
async function attemptsUsed(key: string): Promise<number> {
  try {
    const { data } = await getAdminClient()
      .from('rate_limits').select('count').eq('key', key)
      .order('window_start', { ascending: false }).limit(1).maybeSingle();
    return typeof data?.count === 'number' ? data.count : 1;
  } catch {
    return 1;
  }
}

/**
 * Verify a private album key. The key travels in the server-action POST body only.
 * Brute-force limited per hashed IP + album (or IP + "*" when the album is unknown), plus a global per-IP cap.
 * Over the limit the key is NOT verified at all. On success a signed, short-lived cookie is set.
 * `slug` given: key must match that album (direct album page). Omitted: look the key up among private albums.
 */
export async function unlockAlbum(key: string, slug?: string): Promise<UnlockResult> {
  const k = typeof key === 'string' ? key.trim() : '';
  const h = await headers();
  let ip: string;
  try {
    ip = hashIdentifier(clientIp(h));
  } catch (e) {
    // IP_HASH_SALT missing / too short: fail closed, the key is NOT verified.
    console.error('[mon-album] unlock refused:', e instanceof Error ? e.message : 'unknown');
    return { ok: false, code: 'locked' };
  }
  const scope = typeof slug === 'string' && slug ? slug.slice(0, 200) : '*';
  const limKey = `albumkey:${ip}:${scope}`;

  const okAlbum = await hit(limKey, LIMITS.keyAttempts.limit, LIMITS.keyAttempts.windowSeconds);
  const okGlobal = await hit(`albumkey:${ip}:all`, LIMITS.keyAttemptsGlobalPerIp.limit, LIMITS.keyAttemptsGlobalPerIp.windowSeconds);
  if (!okAlbum || !okGlobal) return { ok: false, code: 'locked' };

  const wrong = async (): Promise<UnlockResult> => ({
    ok: false,
    code: 'invalid_key',
    attemptsLeft: Math.max(0, LIMITS.keyAttempts.limit - (await attemptsUsed(limKey))),
  });
  if (k.length === 0 || k.length > 128) return wrong();

  let q = getAdminClient().from('albums').select('slug, access_key').eq('is_public', false).not('access_key', 'is', null);
  if (scope !== '*') q = q.eq('slug', scope);
  const { data: albums, error } = await q;
  if (error || !albums) return wrong();

  // Compare against EVERY candidate (no early exit) in constant time.
  let matched: { slug: string; access_key: string } | null = null;
  for (const a of albums) {
    if (constantTimeEqual(k, a.access_key as string) && !matched) matched = a as { slug: string; access_key: string };
  }
  if (!matched) return wrong();

  const jar = await cookies();
  jar.set(`album-access-${matched.slug}`, signAlbumAccess(matched.slug, matched.access_key, COOKIE_TTL_SECONDS), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_TTL_SECONDS,
  });
  // a correct key clears the failure counter for this scope (best effort)
  try { await getAdminClient().from('rate_limits').delete().eq('key', limKey); } catch { /* ignore */ }
  return { ok: true, slug: matched.slug };
}
