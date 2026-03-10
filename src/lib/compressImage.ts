/**
 * Client-side image compression via Canvas API — zero dependencies.
 * Converts any image to WebP and resizes to the configured max dimensions.
 *
 * Also generates a LQIP (Low Quality Image Placeholder): a tiny inline base64
 * data URL (~200–400 bytes) to use as `blurDataURL` in <Image placeholder="blur">.
 * No extra network request — the placeholder is embedded directly in the HTML.
 */

export interface CompressionOptions {
  maxWidth?:  number; // default 2400
  maxHeight?: number; // default 2400
  quality?:   number; // 0–1, default 0.85
}

export interface CompressResult {
  file:           File;
  width:          number;
  height:         number;
  originalSize:   number;
  compressedSize: number;
  /** Tiny base64 WebP (~200–400 bytes) for placeholder="blur" */
  lqipDataUrl:    string;
}

/**
 * Generates a LQIP from an already-loaded HTMLImageElement.
 * Produces a ~20px-wide WebP at quality 0.05 — visually just a colour wash.
 * @internal called by compressImage()
 */
function lqipFromImage(img: HTMLImageElement): string {
  const LQIP_W = 20;
  const ratio  = img.naturalHeight / img.naturalWidth;
  const lw     = LQIP_W;
  const lh     = Math.max(1, Math.round(lw * ratio));

  const c      = document.createElement('canvas');
  c.width      = lw;
  c.height     = lh;
  c.getContext('2d')!.drawImage(img, 0, 0, lw, lh);

  // toDataURL is synchronous, quality 0.05 produces <400 bytes
  return c.toDataURL('image/webp', 0.05);
}

export async function compressImage(
  original: File,
  opts: CompressionOptions = {},
): Promise<CompressResult> {
  const { maxWidth = 2400, maxHeight = 2400, quality = 0.85 } = opts;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(original);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: w, naturalHeight: h } = img;
      // Scale down proportionally only if needed
      const ratio = Math.min(1, maxWidth / w, maxHeight / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);

      // Generate LQIP while source image is still in memory
      const lqipDataUrl = lqipFromImage(img);

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      const baseName = original.name.replace(/\.[^.]+$/, '');
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression échouée')); return; }
          resolve({
            file:           new File([blob], `${baseName}.webp`, { type: 'image/webp' }),
            width:          w,
            height:         h,
            originalSize:   original.size,
            compressedSize: blob.size,
            lqipDataUrl,
          });
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire l\'image'));
    };
    img.src = objectUrl;
  });
}

/** Max dimensions + quality preset per Supabase bucket */
export function getBucketPreset(bucket: string): CompressionOptions {
  switch (bucket) {
    case 'album-covers':      return { maxWidth: 900,  maxHeight: 1200, quality: 0.88 };
    case 'album-backgrounds': return { maxWidth: 1920, maxHeight: 1080, quality: 0.85 };
    case 'album-photos':      return { maxWidth: 2400, maxHeight: 2400, quality: 0.84 };
    case 'portfolio-photos':  return { maxWidth: 2400, maxHeight: 2400, quality: 0.84 };
    default:                  return { maxWidth: 2400, maxHeight: 2400, quality: 0.85 };
  }
}

/** Formats bytes → "1.2 Mo", "340 Ko", etc. */
export function formatSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} o`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

/**
 * Standalone LQIP generator — useful when you want a blur placeholder
 * for an image that was already uploaded (no re-compression needed).
 *
 * Returns a data URL (~200–400 bytes) usable directly as `blurDataURL`
 * in `<Image placeholder="blur" blurDataURL={...} />`.
 *
 * To use LQIP with next/image:
 *   1. Store the returned string in the `lqip` column of album_photos /
 *      portfolio_photos (TEXT column, nullable).
 *      SQL: ALTER TABLE album_photos ADD COLUMN IF NOT EXISTS lqip TEXT;
 *           ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS lqip TEXT;
 *   2. Pass `placeholder="blur" blurDataURL={photo.lqip ?? undefined}`
 *      to the <Image> component.
 */
export function generateLqip(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(lqipFromImage(img));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('LQIP: impossible de lire l\'image')); };
    img.src = url;
  });
}
