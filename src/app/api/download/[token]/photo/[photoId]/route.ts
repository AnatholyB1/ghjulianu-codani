import { after } from 'next/server';
import { consumeDownloadUse, loadDeliveryPhotos } from '@/lib/server/delivery';
import { DOWNLOAD_MAX_DURATION_SECONDS, photoFileName } from '@/lib/server/deliveryPlan';
import { PRIVATE_HEADERS, contentDisposition, gate, logDownloads, refuse } from '@/lib/server/deliveryHttp';
import { fetchPhotoSource, resolvePhotoSource } from '@/lib/server/photoSource';
import { countingStream } from '@/lib/server/zipStream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = DOWNLOAD_MAX_DURATION_SECONDS;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Single photo, pass-through stream (no buffering). Order matters:
 *  1. gate: token shape, rate limit, non-consuming state check
 *  2. photo belongs to the request? (404 otherwise, nothing consumed)
 *  3. open the upstream file (a broken file must not burn a use)
 *  4. consume_download_use (atomic; reuses an open 15-minute session)
 *  5. stream; bytes are counted from the stream and logged via after()
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string; photoId: string }> }) {
  const { token, photoId } = await ctx.params;
  try {
    const g = await gate(req, token);
    if (!g.ok) return g.response;

    if (!UUID_RE.test(photoId) || !g.request.photos.some((p) => p.photo_id === photoId)) {
      return Response.json({ error: 'not_found', status: 404 }, { status: 404, headers: PRIVATE_HEADERS });
    }

    const { prefix, photos } = await loadDeliveryPhotos(g.request);
    const photo = photos.find((p) => p.row.id === photoId);
    if (!photo) return Response.json({ error: 'not_found', status: 404 }, { status: 404, headers: PRIVATE_HEADERS });

    const source = await resolvePhotoSource(photo.row, 'download');
    const abort = new AbortController();
    req.signal.addEventListener('abort', () => abort.abort(), { once: true });

    let upstream: Response;
    try {
      upstream = await fetchPhotoSource(source, abort.signal);
    } catch {
      return refuse(req, token, 'error'); // nothing consumed
    }

    const consumed = await consumeDownloadUse(token);
    if (!consumed || !consumed.photos.some((p) => p.photo_id === photoId)) {
      await upstream.body?.cancel().catch(() => undefined);
      return refuse(req, token, consumed ? 'invalid' : 'exhausted');
    }

    let resolveBytes!: (n: number) => void;
    const bytesDone = new Promise<number>((r) => (resolveBytes = r));
    const counted = countingStream(upstream.body as ReadableStream<Uint8Array>, (bytes, completed) => {
      resolveBytes(bytes); // bytes actually sent, also when the client aborted
      if (!completed) abort.abort();
    });
    after(async () => {
      const bytes = await bytesDone;
      await logDownloads(req, { requestId: consumed.requestId, albumId: photo.albumId ?? g.request.albumId }, [
        { photoId, bytes },
      ]);
    });

    const headers = new Headers(PRIVATE_HEADERS);
    headers.set('Content-Type', upstream.headers.get('content-type') ?? source.contentType);
    headers.set('Content-Disposition', contentDisposition(photoFileName(prefix, photo.n, source.ext)));
    const len = upstream.headers.get('content-length');
    if (len && !upstream.headers.get('content-encoding')) headers.set('Content-Length', len);
    headers.set('X-Download-Window-Open', consumed.windowOpen ? '1' : '0');
    headers.set('X-Download-Uses-Remaining', String(consumed.remaining));
    return new Response(counted, { status: 200, headers });
  } catch (e) {
    console.error('[download/photo] failure:', e instanceof Error ? e.message : 'unknown');
    return refuse(req, token, 'error');
  }
}
