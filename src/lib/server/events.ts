import 'server-only';
import { createHash } from 'node:crypto';
import { userAgent } from 'next/server';
import { getAdminClient } from './supabaseAdmin';

export type EventType = 'view' | 'select_add' | 'request' | 'link_open' | 'download';

export interface EventInput {
  type: EventType;
  photo_id?: string | null;
  album_id?: string | null;
  request_id?: string | null;
  is_day?: boolean | null;
  device?: string | null;
  country?: string | null;
  visitor_hash?: string | null;
  session_key?: string | null;
  bytes?: number | null;
}

type HeaderCarrier = { headers: Headers };

function parisDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d); // YYYY-MM-DD
}

function clientIp(req: HeaderCarrier): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '').trim() || 'unknown';
}

/**
 * Anonymous, cookie-less visitor id: sha256(ip + ua + daily_salt).
 * daily_salt = sha256(IP_HASH_SALT + Paris date), so ids cannot be linked across days.
 */
export function visitorHash(req: HeaderCarrier): string {
  const daily = createHash('sha256').update(`${process.env.IP_HASH_SALT ?? ''}:${parisDate()}`).digest('hex');
  const ua = req.headers.get('user-agent') ?? '';
  return createHash('sha256').update(`${clientIp(req)}|${ua}|${daily}`).digest('hex').slice(0, 32);
}

/** 'mobile' | 'tablet' | 'desktop' (the UA itself is never stored). */
export function deviceClass(req: HeaderCarrier): 'mobile' | 'tablet' | 'desktop' {
  const t = userAgent({ headers: req.headers }).device.type;
  return t === 'mobile' || t === 'tablet' ? t : 'desktop';
}

/** ISO country from the Vercel edge header, or null. */
export function countryOf(req: HeaderCarrier): string | null {
  const c = req.headers.get('x-vercel-ip-country');
  return c && /^[A-Za-z]{2}$/.test(c) ? c.toUpperCase() : null;
}

/** Append-only event write. NEVER throws: failures are swallowed with a warning. */
export async function logEvent(e: EventInput): Promise<void> {
  try {
    const { error } = await getAdminClient().from('events').insert(e);
    // 23505 = view dedupe unique violation: expected, silent.
    if (error && error.code !== '23505') {
      console.warn('[events] insert failed:', error.code ?? error.message);
    }
  } catch (err) {
    console.warn('[events] failure:', err instanceof Error ? err.message : 'unknown');
  }
}
