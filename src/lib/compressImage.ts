/**
 * Client-side image compression via Canvas API — zero dependencies.
 * Converts any image to WebP and resizes to the configured max dimensions.
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
