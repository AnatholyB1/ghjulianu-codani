/**
 * Delivery limits and ZIP part planning (D-08). Pure module: no imports, no
 * server-only marker, so it can be unit tested with plain node.
 * Every limit of the delivery routes lives in THIS file.
 */

/** A ZIP part holds at most this many bytes of (stored, uncompressed) photo data. */
export const ZIP_PART_MAX_BYTES = 120 * 1024 * 1024;
/** ... and at most this many files. */
export const ZIP_PART_MAX_FILES = 60;
/**
 * Size assumed for a photo whose size could not be looked up (HEAD failed).
 * The page and the ZIP route both use it, so they still compute the same
 * parts as long as the same lookups fail. 3 MB is a typical optimized photo.
 */
export const ASSUMED_PHOTO_BYTES = 3 * 1024 * 1024;

/** A download session lasts this long (matches the SQL function default). */
export const SESSION_WINDOW_MINUTES = 15;

/** Rate limits (fixed window, Postgres RPC). Checked BEFORE a use is consumed. */
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_PER_TOKEN = 60;
export const RATE_LIMIT_PER_IP = 90;

/** Vercel function duration for the download routes (seconds). Verify on a preview. */
export const DOWNLOAD_MAX_DURATION_SECONDS = 300;

export interface SizedItem {
  /** Size in bytes (use ASSUMED_PHOTO_BYTES when unknown). */
  bytes: number;
}

export interface Part<T extends SizedItem> {
  /** 1-based. */
  index: number;
  items: T[];
  /** Index (0-based) of the first item of this part in the original list. */
  start: number;
  bytes: number;
}

/**
 * Deterministic greedy split: items keep their order; a new part starts when
 * adding the next item would exceed the byte or file cap. An item larger than
 * the byte cap still gets (alone) its own part. Same input => same output.
 */
export function planParts<T extends SizedItem>(
  items: readonly T[],
  maxBytes = ZIP_PART_MAX_BYTES,
  maxFiles = ZIP_PART_MAX_FILES,
): Part<T>[] {
  const parts: Part<T>[] = [];
  let cur: Part<T> | null = null;
  items.forEach((item, i) => {
    const size = Math.max(0, Math.floor(item.bytes));
    if (!cur || cur.items.length >= maxFiles || (cur.items.length > 0 && cur.bytes + size > maxBytes)) {
      cur = { index: parts.length + 1, items: [], start: i, bytes: 0 };
      parts.push(cur);
    }
    cur.items.push(item);
    cur.bytes += size;
  });
  return parts;
}

/** Short file prefix from an album slug (same rule as the legacy cart download). */
export function downloadPrefix(slug: string | null | undefined): string {
  const p = (slug ?? '').replace(/-/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 12);
  return p || 'PHOTOS';
}

/** `FURTIVE2025_007.jpg` style name; `n` is the 1-based position in the whole request. */
export function photoFileName(prefix: string, n: number, ext: string): string {
  return `${prefix}_${String(n).padStart(3, '0')}.${ext}`;
}

export function zipFileName(prefix: string, part: number, total: number): string {
  return total > 1 ? `${prefix}_part${part}of${total}.zip` : `${prefix}.zip`;
}
