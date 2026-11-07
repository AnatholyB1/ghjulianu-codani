import { NextResponse, type NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { hit, hashIdentifier } from '@/lib/server/rateLimit';
import { countryOf, deviceClass, ipVisitorHash, logEvent } from '@/lib/server/events';
import { isBotUserAgent } from '@/lib/server/bots';

/**
 * POST /api/track : anonymous audience measurement (KPI-03).
 *
 * The client is trusted for NOTHING but a photo identifier (uuid, or the image
 * URL it displays, resolved server-side to a row id). Device, country, visitor
 * hash, day/night, album and timestamp are all derived here. No cookie is set,
 * no IP / UA is stored. Well-formed input always answers 204 (bots,
 * rate-limited, unknown photo and duplicates are silently dropped).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// select_add / request / link_open / download are logged server-side by their own routes.
const ALLOWED_TYPES = new Set(['view']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY = 2048;
const RATE_LIMIT = 120; // events per IP per minute (UA independent)
const RATE_WINDOW_S = 60;

const noContent = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
const bad = () => new NextResponse(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '').trim() || 'unknown';
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // some browsers omit Origin on same-origin beacons
  try {
    return new URL(origin).host === (req.headers.get('x-forwarded-host') ?? req.headers.get('host'));
  } catch {
    return false;
  }
}

/** Accepts only an https image URL (query/hash stripped). */
function cleanSrc(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > 1024) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:') return null;
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

interface PhotoRow {
  id: string;
  album_id: string | null;
  is_day: boolean | null;
}

async function resolvePhoto(photoId: string | null, src: string | null): Promise<PhotoRow | null> {
  const db = getAdminClient();
  for (const table of ['album_photos', 'portfolio_photos'] as const) {
    const sel = table === 'album_photos' ? 'id, album_id, is_day' : 'id, is_day';
    const base = db.from(table).select(sel).limit(1);
    const { data } = await (photoId ? base.eq('id', photoId) : base.eq('src', src as string)).maybeSingle<{
      id: string;
      album_id?: string | null;
      is_day: boolean | null;
    }>();
    if (data) return { id: data.id, album_id: data.album_id ?? null, is_day: data.is_day ?? null };
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return bad();

  const text = await req.text();
  if (text.length === 0 || text.length > MAX_BODY) return bad();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return bad();
  }
  if (typeof body !== 'object' || body === null) return bad();
  const { type, photo_id: rawId, src: rawSrc } = body as Record<string, unknown>;

  if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) return bad();
  const photoId = typeof rawId === 'string' && UUID_RE.test(rawId) ? rawId : null;
  if (rawId !== undefined && rawId !== null && !photoId) return bad();
  const src = cleanSrc(rawSrc);
  if (!photoId && !src) return bad();

  // From here on: accept and silently drop.
  if (isBotUserAgent(req.headers.get('user-agent'))) return noContent();

  try {
    // H1: the per-IP limit comes FIRST and depends on the IP only (salted hash), never on the
    // User-Agent, so rotating UAs from one address cannot dodge it. The view's visitor_hash is IP-only
    // too: the unique index (target, visitor_hash, Paris day) then caps views at 1 per IP per target per day.
    if (!(await hit(`track:ip:${hashIdentifier(clientIp(req))}`, RATE_LIMIT, RATE_WINDOW_S))) return noContent();
    const vh = ipVisitorHash(req);

    const photo = await resolvePhoto(photoId, src);
    if (!photo) return noContent();

    await logEvent({
      type: 'view',
      photo_id: photo.id,
      album_id: photo.album_id,
      is_day: photo.is_day,
      device: deviceClass(req),
      country: countryOf(req),
      visitor_hash: vh,
    });
  } catch (e) {
    console.warn('[track] failure:', e instanceof Error ? e.message : 'unknown');
  }
  return noContent();
}
