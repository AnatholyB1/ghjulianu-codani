import 'server-only';
import { userAgent } from 'next/server';
import { getAdminClient } from './supabaseAdmin';
import { hit, hashIdentifier } from './rateLimit';
import { hashToken } from './tokens';
import { countryOf, deviceClass, safeVisitorHash } from './events';
import {
  RATE_LIMIT_PER_IP,
  RATE_LIMIT_PER_TOKEN,
  RATE_LIMIT_WINDOW_SECONDS,
} from './deliveryPlan';
import { TOKEN_RE, getDeliveryState, type DeliveryRequest } from './delivery';

/** Headers every delivery response carries (contract section 2). */
export const PRIVATE_HEADERS: Record<string, string> = {
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};

export type Refusal = 'invalid' | 'expired' | 'exhausted' | 'rate' | 'error';

const STATUS: Record<Refusal, number> = { invalid: 404, expired: 410, exhausted: 410, rate: 429, error: 502 };

/** Browsers clicking a download link want a page; scripts (curl, fetch) want JSON. */
function wantsPage(req: Request): boolean {
  const dest = req.headers.get('sec-fetch-dest');
  if (dest) return dest === 'document';
  return (req.headers.get('accept') ?? '').includes('text/html');
}

/**
 * Page-friendly refusal. A browser navigation is sent back to the landing page
 * (which renders the matching state; `?e=rate` shows the "too many downloads"
 * callout). Anything else gets JSON with the real status code. Nothing is
 * consumed by a refusal.
 */
export function refuse(req: Request, token: string, reason: Refusal): Response {
  const headers = { ...PRIVATE_HEADERS };
  if (reason === 'rate') (headers as Record<string, string>)['Retry-After'] = String(RATE_LIMIT_WINDOW_SECONDS);
  if (wantsPage(req) && TOKEN_RE.test(token)) {
    const to = `/telechargement/${token}${reason === 'rate' || reason === 'error' ? `?e=${reason}` : ''}`;
    return new Response(null, { status: 303, headers: { ...headers, Location: to } });
  }
  return Response.json(
    { error: reason, status: STATUS[reason] },
    { status: STATUS[reason], headers },
  );
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '').trim() || 'unknown';
}

/**
 * Common gate for both download routes, BEFORE anything is consumed:
 * token shape, rate limits (per IP and per token), non-consuming state check.
 */
export async function gate(
  req: Request,
  token: string,
): Promise<{ ok: true; request: DeliveryRequest } | { ok: false; response: Response }> {
  if (!TOKEN_RE.test(token)) return { ok: false, response: refuse(req, token, 'invalid') };

  const [ipOk, tokOk] = await Promise.all([
    hit(`dl:ip:${hashIdentifier(clientIp(req))}`, RATE_LIMIT_PER_IP, RATE_LIMIT_WINDOW_SECONDS),
    hit(`dl:tok:${hashToken(token).slice(0, 32)}`, RATE_LIMIT_PER_TOKEN, RATE_LIMIT_WINDOW_SECONDS),
  ]);
  if (!ipOk || !tokOk) return { ok: false, response: refuse(req, token, 'rate') };

  const state = await getDeliveryState(token);
  if (state.status === 'invalid') return { ok: false, response: refuse(req, token, 'invalid') };
  if (state.status !== 'valid') return { ok: false, response: refuse(req, token, state.status) };
  return { ok: true, request: state.request };
}

export function contentDisposition(filename: string): string {
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, '_');
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

export interface DownloadRecord {
  photoId: string | null;
  bytes: number;
}

/** Appends `download` events (bytes actually transferred). NEVER throws. */
export async function logDownloads(
  req: Request,
  ctx: { requestId: string; albumId: string | null; part?: number },
  records: DownloadRecord[],
): Promise<void> {
  try {
    const rows = records
      .filter((r) => r.bytes > 0)
      .map((r) => ({
        type: 'download' as const,
        request_id: ctx.requestId,
        album_id: ctx.albumId,
        photo_id: r.photoId,
        bytes: r.bytes,
        device: deviceClass(req),
        country: countryOf(req),
        visitor_hash: safeVisitorHash(req),
        session_key: ctx.part ? `zip:${ctx.part}` : 'photo',
      }));
    if (!rows.length) return;
    const { error } = await getAdminClient().from('events').insert(rows);
    if (error) console.warn('[delivery] event insert failed:', error.code ?? error.message);
  } catch (e) {
    console.warn('[delivery] event failure:', e instanceof Error ? e.message : 'unknown');
  }
}

/** True for crawlers/link previewers; they must not produce link_open events. */
export function isBot(req: { headers: Headers }): boolean {
  return userAgent({ headers: req.headers }).isBot;
}
