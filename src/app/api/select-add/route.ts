import { NextResponse, type NextRequest } from 'next/server';
import { logEvent, visitorHash, deviceClass, countryOf } from '@/lib/server/events';
import { hit, hashIdentifier } from '@/lib/server/rateLimit';
import { LIMITS, isUuid } from '@/lib/server/requestGuards';

export const runtime = 'nodejs';

/** Fire-and-forget `select_add` event. Always 204; never blocks or errors the UI. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { photoId?: unknown; albumId?: unknown } | null;
    const photoId = body?.photoId;
    const albumId = body?.albumId;
    if (!isUuid(photoId) || (albumId != null && !isUuid(albumId))) return new NextResponse(null, { status: 204 });
    const xff = req.headers.get('x-forwarded-for');
    const ip = (xff?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '').trim() || 'unknown';
    if (!(await hit(`selectadd:${hashIdentifier(ip)}`, LIMITS.selectAddPerMinute.limit, LIMITS.selectAddPerMinute.windowSeconds))) {
      return new NextResponse(null, { status: 204 });
    }
    await logEvent({
      type: 'select_add',
      photo_id: photoId,
      album_id: (albumId as string | null | undefined) ?? null,
      visitor_hash: visitorHash(req),
      device: deviceClass(req),
      country: countryOf(req),
    });
  } catch {
    /* swallow */
  }
  return new NextResponse(null, { status: 204 });
}
