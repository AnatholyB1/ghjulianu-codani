import 'server-only';
import type { User } from '@supabase/supabase-js';

/**
 * Single source of truth for "who is an admin".
 *
 * The Supabase project is shared and has open sign-up, so "logged in" is NOT "admin". An account is an admin
 * only when its email is in the server-side allowlist env `ADMIN_EMAILS` (comma separated, case-insensitive).
 * Fails CLOSED: unset / empty allowlist means nobody is admin (and a warning is logged).
 */

let warned = false;

export function parseAdminEmails(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isAdminEmail(email: string | null | undefined, raw: string | undefined | null = process.env.ADMIN_EMAILS): boolean {
  const list = parseAdminEmails(raw);
  if (list.length === 0) {
    if (!warned) {
      warned = true;
      console.warn('[admin] ADMIN_EMAILS is not set or empty: every admin request is refused (fail closed).');
    }
    return false;
  }
  if (typeof email !== 'string') return false;
  const e = email.trim().toLowerCase();
  return e.length > 0 && list.includes(e);
}

/** True when this Supabase user is an allowlisted admin. */
export function isAdminUser(user: Pick<User, 'email'> | null | undefined): boolean {
  return !!user && isAdminEmail(user.email);
}

/** The authenticated admin user from the request cookies, or null (unauthenticated and non-admin look the same). */
export async function getAdminUser(): Promise<User | null> {
  // Lazy: keeps the pure allowlist helpers importable from proxy.ts and node tests without next/headers.
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user && isAdminUser(user) ? user : null;
}

/** For server actions that throw on failure: resolves to the admin user or throws `Unauthorized`. */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
