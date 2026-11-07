import 'server-only';
import { ASSUMED_PHOTO_BYTES } from './deliveryPlan';

/**
 * PRT-03: the ONE place that decides where a photo file comes from.
 * Every delivery route and the landing page go through resolvePhotoSource().
 *
 * v1.1 (D-05): the buckets are public and there is a single optimized file per
 * photo, so the source is simply the public bucket URL stored in `src`.
 *
 * EXTENSION POINT (v1.2, private masters): add a new variant to PhotoSource
 * (e.g. `{ kind: 'signed-url', url, expiresAt }` created with the service-role
 * client from a private bucket) and return it from resolvePhotoSource() when a
 * row has a master. Callers only use `source.url` and fetchPhotoSource(), so no
 * route needs to change. `purpose` lets the resolver return a derivative for
 * thumbnails and the master for downloads.
 */

export type PhotoTable = 'album_photos' | 'portfolio_photos';

export interface PhotoRow {
  id: string;
  src: string;
  width?: number | null;
  height?: number | null;
  source: PhotoTable;
}

export type PhotoSource = {
  kind: 'public-url';
  url: string;
  ext: string;
  contentType: string;
};

export type PhotoPurpose = 'thumbnail' | 'download';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

function allowedHost(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing');
  return new URL(raw).host;
}

/** Throws when `src` is not a public-bucket URL of OUR Supabase project (SSRF guard). */
function assertOwnStorageUrl(src: string): URL {
  const u = new URL(src);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('photo source: bad protocol');
  if (u.host !== allowedHost()) throw new Error('photo source: foreign host');
  if (!u.pathname.startsWith('/storage/v1/object/public/')) throw new Error('photo source: not a public object');
  return u;
}

export async function resolvePhotoSource(row: PhotoRow, purpose: PhotoPurpose = 'download'): Promise<PhotoSource> {
  void purpose; // v1.1: same file for both; v1.2 returns a derivative for 'thumbnail'.
  const u = assertOwnStorageUrl(row.src);
  const ext = (u.pathname.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  return { kind: 'public-url', url: u.toString(), ext, contentType: MIME[ext] ?? 'application/octet-stream' };
}

/** Opens the file for streaming. One retry on network error / 5xx. Throws when unavailable. */
export async function fetchPhotoSource(source: PhotoSource, signal?: AbortSignal): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(source.url, { signal, cache: 'no-store' });
      if (res.ok && res.body) return res;
      lastErr = new Error(`upstream ${res.status}`);
      await res.body?.cancel().catch(() => undefined);
      if (res.status < 500) break;
    } catch (e) {
      if (signal?.aborted) throw e;
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('photo source unavailable');
}

/* ── size lookup (HEAD) with a small in-memory cache ─────────────── */

const SIZE_TTL_MS = 60 * 60 * 1000;
const SIZE_CACHE_MAX = 5000;
const sizeCache = new Map<string, { bytes: number; at: number }>();

/**
 * Byte size of a source via HEAD (Content-Length). Falls back to
 * ASSUMED_PHOTO_BYTES when the lookup fails; `known` tells which one it is.
 */
export async function photoSize(source: PhotoSource): Promise<{ bytes: number; known: boolean }> {
  const hit = sizeCache.get(source.url);
  if (hit && Date.now() - hit.at < SIZE_TTL_MS) return { bytes: hit.bytes, known: true };
  try {
    const res = await fetch(source.url, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const len = Number(res.headers.get('content-length'));
    if (res.ok && Number.isFinite(len) && len > 0) {
      if (sizeCache.size >= SIZE_CACHE_MAX) sizeCache.delete(sizeCache.keys().next().value as string);
      sizeCache.set(source.url, { bytes: len, at: Date.now() });
      return { bytes: len, known: true };
    }
  } catch {
    /* fall through to the assumed size */
  }
  return { bytes: ASSUMED_PHOTO_BYTES, known: false };
}

/** photoSize() over many sources with bounded concurrency. */
export async function photoSizes(sources: PhotoSource[], concurrency = 8) {
  const out = new Array<{ bytes: number; known: boolean }>(sources.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, sources.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= sources.length) return;
        out[i] = await photoSize(sources[i]);
      }
    }),
  );
  return out;
}
