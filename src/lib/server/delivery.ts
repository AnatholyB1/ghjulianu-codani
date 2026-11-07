import 'server-only';
import { getAdminClient } from './supabaseAdmin';
import { hashToken } from './tokens';
import {
  SESSION_WINDOW_MINUTES,
  downloadPrefix,
  planParts,
  type Part,
} from './deliveryPlan';
import {
  photoSize,
  photoSizes,
  resolvePhotoSource,
  type PhotoRow,
  type PhotoSource,
  type PhotoTable,
} from './photoSource';

/** Tokens are 32 random bytes in base64url = exactly 43 chars. */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export type Lang = 'fr' | 'en';

export interface DeliveryRequest {
  id: string;
  lang: Lang;
  albumId: string | null;
  photos: { photo_id: string; source: PhotoTable }[];
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  windowStartedAt: Date | null;
}

/** Result of the NON-consuming lookup. `invalid` covers unknown, malformed and revoked (same screen). */
export type DeliveryState =
  | { status: 'invalid' }
  | { status: 'expired' | 'exhausted' | 'valid'; request: DeliveryRequest; windowEndsAt: Date | null };

function parsePhotos(raw: unknown): DeliveryRequest['photos'] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((p) => {
    const o = p as { photo_id?: unknown; source?: unknown };
    if (typeof o?.photo_id !== 'string') return [];
    if (o.source !== 'album_photos' && o.source !== 'portfolio_photos') return [];
    return [{ photo_id: o.photo_id, source: o.source as PhotoTable }];
  });
}

/** Read-only lookup by token hash. Never consumes a use. */
export async function getDeliveryState(token: string, now = new Date()): Promise<DeliveryState> {
  if (!TOKEN_RE.test(token)) return { status: 'invalid' };
  const { data, error } = await getAdminClient()
    .from('download_requests')
    .select('id, lang, album_id, photos, expires_at, max_uses, used_count, window_started_at, revoked_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (error) throw new Error(`download_requests lookup failed: ${error.code ?? error.message}`);
  if (!data || data.revoked_at) return { status: 'invalid' };

  const request: DeliveryRequest = {
    id: data.id,
    lang: data.lang === 'en' ? 'en' : 'fr',
    albumId: data.album_id ?? null,
    photos: parsePhotos(data.photos),
    expiresAt: new Date(data.expires_at),
    maxUses: data.max_uses,
    usedCount: data.used_count,
    windowStartedAt: data.window_started_at ? new Date(data.window_started_at) : null,
  };
  const windowEnd = request.windowStartedAt
    ? new Date(request.windowStartedAt.getTime() + SESSION_WINDOW_MINUTES * 60_000)
    : null;
  const windowEndsAt = windowEnd && windowEnd > now ? windowEnd : null;

  // Precedence (contract): invalid > exhausted > expired > valid.
  if (!windowEndsAt && request.usedCount >= request.maxUses) return { status: 'exhausted', request, windowEndsAt };
  if (request.expiresAt <= now) return { status: 'expired', request, windowEndsAt };
  return { status: 'valid', request, windowEndsAt };
}

export interface ConsumeResult {
  requestId: string;
  photos: DeliveryRequest['photos'];
  email: string;
  remaining: number;
  /** true when an already-open 15-minute session was reused (no use consumed). */
  windowOpen: boolean;
}

/**
 * The ONLY place a use is consumed: atomic Postgres function. Returns null when
 * refused (unknown, revoked, expired, or all uses spent outside an open session).
 */
export async function consumeDownloadUse(token: string): Promise<ConsumeResult | null> {
  const { data, error } = await getAdminClient().rpc('consume_download_use', {
    p_token_hash: hashToken(token),
    p_window_minutes: SESSION_WINDOW_MINUTES,
  });
  if (error) throw new Error(`consume_download_use failed: ${error.code ?? error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    requestId: row.request_id,
    photos: parsePhotos(row.photos),
    email: row.email,
    remaining: row.remaining,
    windowOpen: row.window_open === true,
  };
}

export interface DeliveryPhoto {
  /** 1-based position in the whole request (used for file names). */
  n: number;
  row: PhotoRow;
  albumId: string | null;
}

export interface DeliveryAlbum {
  id: string | null;
  slug: string | null;
  title: string | null;
  isPublic: boolean;
}

/**
 * Resolves the request's photo ids to DB rows, in request order. Photos deleted
 * since the request was made are silently skipped.
 */
export async function loadDeliveryPhotos(
  req: Pick<DeliveryRequest, 'albumId' | 'photos'>,
): Promise<{ album: DeliveryAlbum; prefix: string; photos: DeliveryPhoto[] }> {
  const db = getAdminClient();
  const ids = (t: PhotoTable) => req.photos.filter((p) => p.source === t).map((p) => p.photo_id);
  const [ap, pp] = await Promise.all([
    ids('album_photos').length
      ? db.from('album_photos').select('id, album_id, src, width, height').in('id', ids('album_photos'))
      : Promise.resolve({ data: [], error: null }),
    ids('portfolio_photos').length
      ? db.from('portfolio_photos').select('id, src, width, height').in('id', ids('portfolio_photos'))
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ap.error || pp.error) throw new Error('photo rows lookup failed');

  const byKey = new Map<string, { row: PhotoRow; albumId: string | null }>();
  for (const r of ap.data ?? []) {
    byKey.set(`album_photos:${r.id}`, {
      row: { id: r.id, src: r.src, width: r.width, height: r.height, source: 'album_photos' },
      albumId: r.album_id ?? null,
    });
  }
  for (const r of pp.data ?? []) {
    byKey.set(`portfolio_photos:${r.id}`, {
      row: { id: r.id, src: r.src, width: r.width, height: r.height, source: 'portfolio_photos' },
      albumId: null,
    });
  }

  const seen = new Set<string>();
  const photos: DeliveryPhoto[] = [];
  for (const p of req.photos) {
    const key = `${p.source}:${p.photo_id}`;
    const hit = byKey.get(key);
    if (!hit || seen.has(key)) continue;
    seen.add(key);
    photos.push({ n: photos.length + 1, row: hit.row, albumId: hit.albumId });
  }

  const albumId = req.albumId ?? photos.find((p) => p.albumId)?.albumId ?? null;
  let album: DeliveryAlbum = { id: null, slug: null, title: null, isPublic: false };
  if (albumId) {
    const { data } = await db.from('albums').select('id, slug, title, is_public').eq('id', albumId).maybeSingle();
    if (data) album = { id: data.id, slug: data.slug, title: data.title, isPublic: data.is_public === true };
  }
  return { album, prefix: album.slug ? downloadPrefix(album.slug) : 'PORTFOLIO', photos };
}

export interface PlannedPhoto extends DeliveryPhoto {
  source: PhotoSource;
  bytes: number;
  sizeKnown: boolean;
  /** same as sizeKnown; the field name planParts() looks at. */
  known: boolean;
}

export interface DeliveryPlan {
  items: PlannedPhoto[];
  parts: Part<PlannedPhoto>[];
  totalBytes: number;
  allSizesKnown: boolean;
}

/** Sizes every photo (HEAD, cached) and splits them into parts. Deterministic for a given set of sizes. */
export async function planDelivery(photos: DeliveryPhoto[]): Promise<DeliveryPlan> {
  const sources = await Promise.all(photos.map((p) => resolvePhotoSource(p.row, 'download')));
  const sizes = await photoSizes(sources);
  // One retry for the lookups that failed: a transient HEAD error must not flip the plan
  // (landing page and ZIP route have to agree on the parts, M4).
  await Promise.all(
    sizes.map(async (s, i) => {
      if (!s.known) sizes[i] = await photoSize(sources[i]);
    }),
  );
  const items: PlannedPhoto[] = photos.map((p, i) => ({
    ...p,
    source: sources[i],
    bytes: sizes[i].bytes,
    sizeKnown: sizes[i].known,
    known: sizes[i].known,
  }));
  return {
    items,
    parts: planParts(items),
    totalBytes: items.reduce((a, b) => a + b.bytes, 0),
    allSizesKnown: items.every((i) => i.sizeKnown),
  };
}
