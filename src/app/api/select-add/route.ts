import { NextResponse, type NextRequest } from 'next/server';
import { logEvent, safeVisitorHash, deviceClass, countryOf } from '@/lib/server/events';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { hit, hashIdentifier } from '@/lib/server/rateLimit';
import { LIMITS, isUuid } from '@/lib/server/requestGuards';

export const runtime = 'nodejs';

/** Fire-and-forget `select_add` event. Always 204; never blocks or errors the UI. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { photoId?: unknown; albumId?: unknown; source?: unknown } | null;
    const photoId = body?.photoId;
    if (!isUuid(photoId)) return new NextResponse(null, { status: 204 });
    const xff = req.headers.get('x-forwarded-for');
    const ip = (xff?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '').trim() || 'unknown';
    if (!(await hit(`selectadd:${hashIdentifier(ip)}`, LIMITS.selectAddPerMinute.limit, LIMITS.selectAddPerMinute.windowSeconds))) {
      return new NextResponse(null, { status: 204 });
    }
    // The client is never trusted: the photo must exist and album_id is derived from the DB row
    // (album_photos.album_id; portfolio photos have none). Unknown ids are dropped silently, so
    // forged ids cannot pollute the events / favorites stats.
    const db = getAdminClient();
    const { data: ap } = await db.from('album_photos').select('album_id').eq('id', photoId).maybeSingle();
    let albumId: string | null = null;
    if (ap) {
      albumId = ap.album_id ?? null;
    } else {
      const { data: pp } = await db.from('portfolio_photos').select('id').eq('id', photoId).maybeSingle();
      if (!pp) return new NextResponse(null, { status: 204 });
    }
    await logEvent({
      type: 'select_add',
      photo_id: photoId,
      album_id: albumId,
      visitor_hash: safeVisitorHash(req),
      device: deviceClass(req),
      country: countryOf(req),
    });
  } catch {
    /* swallow */
  }
  return new NextResponse(null, { status: 204 });
}
